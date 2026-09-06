import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * Live-preview guidance only — a rough, fast landmark read every frame to
 * tell the user "move back" / "center yourself" while framing the shot.
 * This is deliberately a separate FaceLandmarker instance in VIDEO running
 * mode from the one in pipeline.ts (IMAGE mode): the two modes can't share
 * an instance, and the accurate crown-detection measurement still happens
 * on the captured still frame via the existing pipeline, not here.
 */

const TASKS_VISION_VERSION = "0.10.17";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let videoLandmarkerPromise: Promise<FaceLandmarker> | null = null;

export function getVideoLandmarker(): Promise<FaceLandmarker> {
  if (!videoLandmarkerPromise) {
    videoLandmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE).then(async (files) => {
      const options = {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" as const },
        runningMode: "VIDEO" as const,
        numFaces: 1,
      };
      try {
        return await FaceLandmarker.createFromOptions(files, options);
      } catch {
        return FaceLandmarker.createFromOptions(files, {
          ...options,
          baseOptions: { ...options.baseOptions, delegate: "CPU" },
        });
      }
    });
  }
  return videoLandmarkerPromise;
}

// Standard MediaPipe FaceMesh indices (same set used in pipeline.ts).
const FOREHEAD_TOP = 10;
const CHIN = 152;
const FACE_EDGE_LEFT = 234;
const FACE_EDGE_RIGHT = 454;
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;

export type NormalizedLandmark = { x: number; y: number };

export type Guidance = {
  faceDetected: boolean;
  message: string;
  ready: boolean;
};

/**
 * Turns raw face landmarks into plain-English framing feedback. Pure
 * function (no DOM), so this is unit tested directly.
 *
 * Left/right is the trickiest part: the landmarks come from the raw,
 * unmirrored video frame, but the on-screen preview is CSS-mirrored (so the
 * user sees a natural selfie view, like a mirror). "Move left/right" must be
 * given relative to what's on screen, not the raw data, or the hint points
 * the wrong way — hence negating xOffset before turning it into text.
 */
export function evaluateFraming(landmarks: NormalizedLandmark[], videoWidth: number, videoHeight: number): Guidance {
  const top = landmarks[FOREHEAD_TOP];
  const chin = landmarks[CHIN];
  const left = landmarks[FACE_EDGE_LEFT];
  const right = landmarks[FACE_EDGE_RIGHT];

  const faceHeightPx = (chin.y - top.y) * videoHeight;
  const centerX = ((left.x + right.x) / 2) * videoWidth;
  const centerY = ((top.y + chin.y) / 2) * videoHeight;

  const heightRatio = faceHeightPx / videoHeight;
  const xOffset = (centerX - videoWidth / 2) / videoWidth;
  const yOffset = (centerY - videoHeight / 2) / videoHeight;
  const previewXOffset = -xOffset; // undo the mirror for the instruction text

  const leftEye = midpoint(landmarks[LEFT_EYE_OUTER], landmarks[LEFT_EYE_INNER]);
  const rightEye = midpoint(landmarks[RIGHT_EYE_INNER], landmarks[RIGHT_EYE_OUTER]);
  const tiltDeg = Math.abs(Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI));

  if (heightRatio < 0.28) return { faceDetected: true, message: "Move closer", ready: false };
  if (heightRatio > 0.55) return { faceDetected: true, message: "Move back", ready: false };
  if (previewXOffset > 0.12) return { faceDetected: true, message: "Move left", ready: false };
  if (previewXOffset < -0.12) return { faceDetected: true, message: "Move right", ready: false };
  if (yOffset > 0.12) return { faceDetected: true, message: "Move up", ready: false };
  if (yOffset < -0.12) return { faceDetected: true, message: "Move down", ready: false };
  if (tiltDeg > 8) return { faceDetected: true, message: "Keep your head level", ready: false };

  return { faceDetected: true, message: "Hold still…", ready: true };
}

function midpoint(a: NormalizedLandmark, b: NormalizedLandmark): NormalizedLandmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
