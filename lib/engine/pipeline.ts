import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { removeBackground } from "@imgly/background-removal";
import { midpoint, rollAngle, rotatePoint, computeCrop, cropOverflows, type Point, type CropRect } from "./geometry";
import { findCrownY } from "./crown";
import { encodeToSpec } from "./encode";
import { withWatermark } from "./watermark";
import type { Spec } from "../specs";

const TASKS_VISION_VERSION = "0.10.17";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Standard MediaPipe FaceMesh indices.
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;
const CHIN = 152;
const FOREHEAD_TOP = 10; // sits 15-40mm below the true crown — estimate only
const FACE_EDGE_LEFT = 234;
const FACE_EDGE_RIGHT = 454;

export class NoFaceError extends Error {
  constructor() {
    super("No face detected. Use a clear, front-facing photo with your whole head and shoulders visible.");
  }
}

export class RetakeError extends Error {}

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE).then(async (files) => {
      const options = {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" as const },
        runningMode: "IMAGE" as const,
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
  return landmarkerPromise;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image file."));
    img.src = URL.createObjectURL(file);
  });
}

function toCanvas(image: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(image, 0, 0, w, h);
  return c;
}

async function detectPoints(image: HTMLCanvasElement): Promise<Point[]> {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(image);
  const face = result.faceLandmarks[0];
  if (!face) throw new NoFaceError();
  return face.map((l) => ({ x: l.x * image.width, y: l.y * image.height }));
}

/** Removes the background, returning a same-size canvas with a transparent
 * background and the subject's real pixels intact. Load-bearing for crown
 * detection, not a cosmetic effect: see lib/engine/crown.ts.
 *
 * Encodes to a PNG Blob rather than passing ImageData directly: despite
 * ImageData being in @imgly/background-removal's own documented input type,
 * v1.7.0's imageSourceToImageData() has no case for it and silently passes
 * it through unconverted, so the inference step later reads `.shape` off a
 * raw ImageData (which has none) and throws "undefined is not iterable".
 * Blob input goes through imageDecode(), which does build a proper tensor. */
async function removeBackgroundCanvas(source: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const input = await new Promise<Blob>((resolve, reject) =>
    source.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image for background removal"))), "image/png")
  );
  const cutoutBlob = await removeBackground(input, { device: "gpu" }).catch(() =>
    removeBackground(input, { device: "cpu" })
  );
  const bitmap = await createImageBitmap(cutoutBlob);
  const out = document.createElement("canvas");
  out.width = bitmap.width;
  out.height = bitmap.height;
  out.getContext("2d")!.drawImage(bitmap, 0, 0);
  return out;
}

/** Rotates the image so the eyes are level, remapping landmarks through the
 * identical rigid transform (see geometry.ts for the pure math). */
function correctRoll(source: HTMLCanvasElement, points: Point[]) {
  const left = midpoint(points[LEFT_EYE_OUTER], points[LEFT_EYE_INNER]);
  const right = midpoint(points[RIGHT_EYE_INNER], points[RIGHT_EYE_OUTER]);
  const theta = -rollAngle(left, right);
  const pivot = midpoint(left, right);

  const pad = Math.round(Math.max(source.width, source.height) * 0.4);
  const out = document.createElement("canvas");
  out.width = source.width + pad * 2;
  out.height = source.height + pad * 2;
  const ctx = out.getContext("2d")!;
  const paddedPivot = { x: pivot.x + pad, y: pivot.y + pad };

  ctx.translate(paddedPivot.x, paddedPivot.y);
  ctx.rotate(theta);
  ctx.translate(-paddedPivot.x, -paddedPivot.y);
  ctx.drawImage(source, pad, pad);

  const remapped = points.map((p) => rotatePoint({ x: p.x + pad, y: p.y + pad }, paddedPivot, theta));
  return { canvas: out, points: remapped };
}

/**
 * Anthropometric fallback for when the alpha scan finds no confident
 * hairline (background removal failed, or hair blends into the background).
 * The forehead landmark sits roughly 15-40mm below the true crown; as a
 * fraction of forehead-to-chin distance that's consistently ~25-30%. Always
 * surfaced to the UI as estimated — never used silently for a final measurement.
 */
function estimateCrownFallback(foreheadY: number, chinY: number): number {
  return foreheadY - (chinY - foreheadY) * 0.28;
}

function describeOverflow(crop: CropRect, w: number, h: number): string {
  if (crop.y < 0) return "Step back and retake with more space above your head.";
  if (crop.y + crop.h > h) return "Retake with more space below your chin and shoulders.";
  if (crop.x < 0 || crop.x + crop.w > w) return "Center yourself in the frame and retake with more space on the sides.";
  return "Retake with more space around your head and shoulders.";
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export type ComplianceCheck = { id: string; label: string; pass: boolean; detail: string };

function rangeCheck(
  id: string,
  label: string,
  value: number,
  min: number,
  max: number,
  unit: string,
  estimated = false
): ComplianceCheck {
  const pass = value >= min && value <= max;
  const est = estimated ? " (crown estimated — retake in better light for a precise measurement)" : "";
  return { id, label, pass, detail: `${value.toFixed(1)}${unit} — needs ${min}–${max}${unit}${est}` };
}

function backgroundCheck(canvas: HTMLCanvasElement, spec: Spec): ComplianceCheck {
  const ctx = canvas.getContext("2d")!;
  const target = hexToRgb(spec.background.color);
  const corners: [number, number][] = [
    [2, 2],
    [canvas.width - 3, 2],
    [2, canvas.height - 3],
    [canvas.width - 3, canvas.height - 3],
  ];
  let maxDist = 0;
  for (const [x, y] of corners) {
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    maxDist = Math.max(maxDist, Math.hypot(r - target.r, g - target.g, b - target.b));
  }
  return {
    id: "background",
    label: "Background",
    pass: maxDist <= spec.background.tolerance,
    detail: `Replaced with ${spec.background.color} (corner deviation ${maxDist.toFixed(0)})`,
  };
}

function fileSizeCheck(kb: number, spec: Spec): ComplianceCheck {
  const { min_kb, max_kb } = spec.digital;
  const pass = (min_kb == null || kb >= min_kb) && (max_kb == null || kb <= max_kb);
  const bound =
    min_kb != null && max_kb != null
      ? `${min_kb}–${max_kb}KB`
      : max_kb != null
        ? `under ${max_kb}KB`
        : min_kb != null
          ? `over ${min_kb}KB`
          : "no limit";
  return { id: "file-size", label: "File size", pass, detail: `${kb.toFixed(0)}KB (${bound})` };
}

export type ProgressStage =
  | "loading-image"
  | "detecting-face"
  | "leveling"
  | "removing-background"
  | "cropping"
  | "verifying"
  | "encoding";

/** Pixel positions in finalCanvas's own coordinate space, from the
 * re-verification pass — lets the UI draw guide lines on the exact photo
 * being sold, not a re-derived approximation. Null if re-verification
 * couldn't detect a face (see the "re-verify" check for why). */
export type Measurements = { crownY: number; chinY: number; eyeY: number } | null;

export type PipelineResult = {
  finalCanvas: HTMLCanvasElement;
  previewCanvas: HTMLCanvasElement;
  blob: Blob;
  kb: number;
  checks: ComplianceCheck[];
  allPassed: boolean;
  crownEstimated: boolean;
  measurements: Measurements;
};

function measureFace(points: Point[]) {
  const faceLeft = points[FACE_EDGE_LEFT];
  const faceRight = points[FACE_EDGE_RIGHT];
  const faceCenterX = (faceLeft.x + faceRight.x) / 2;
  const faceWidth = Math.abs(faceRight.x - faceLeft.x);
  const leftEye = midpoint(points[LEFT_EYE_OUTER], points[LEFT_EYE_INNER]);
  const rightEye = midpoint(points[RIGHT_EYE_INNER], points[RIGHT_EYE_OUTER]);
  const eye = midpoint(leftEye, rightEye);
  const chinY = points[CHIN].y;
  const foreheadY = points[FOREHEAD_TOP].y;
  return { faceCenterX, faceWidth, eye, chinY, foreheadY };
}

async function measureCrown(canvas: HTMLCanvasElement, points: Point[]) {
  const m = measureFace(points);
  const cutout = await removeBackgroundCanvas(canvas);
  const alpha = cutout.getContext("2d")!.getImageData(0, 0, cutout.width, cutout.height);
  let crownY = findCrownY(alpha, { centerX: m.faceCenterX, bandWidth: m.faceWidth * 0.7 });
  let estimated = false;
  if (crownY === null) {
    crownY = estimateCrownFallback(m.foreheadY, m.chinY);
    estimated = true;
  }
  return { ...m, cutout, crownY, estimated };
}

export async function processPhoto(
  file: File,
  spec: Spec,
  onProgress?: (stage: ProgressStage) => void
): Promise<PipelineResult> {
  onProgress?.("loading-image");
  const img = await loadImage(file);
  const source = toCanvas(img, img.naturalWidth, img.naturalHeight);

  onProgress?.("detecting-face");
  const points = await detectPoints(source);

  onProgress?.("leveling");
  const { canvas: leveled, points: leveledPts } = correctRoll(source, points);

  onProgress?.("removing-background");
  const measured = await measureCrown(leveled, leveledPts);

  onProgress?.("cropping");
  const headTargetMm = (spec.head.height_mm_min + spec.head.height_mm_max) / 2;
  const eyeTargetPct = (spec.eye_line.from_bottom_pct_min + spec.eye_line.from_bottom_pct_max) / 2;
  const crop = computeCrop(measured.crownY, measured.chinY, measured.eye, {
    outW: spec.digital.width_px,
    outH: spec.digital.height_px,
    dpi: spec.print.dpi,
    headTargetMm,
    eyeTargetPct,
  });

  if (cropOverflows(crop, leveled.width, leveled.height)) {
    throw new RetakeError(describeOverflow(crop, leveled.width, leveled.height));
  }

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = spec.digital.width_px;
  finalCanvas.height = spec.digital.height_px;
  const fctx = finalCanvas.getContext("2d")!;
  fctx.fillStyle = spec.background.color;
  fctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  fctx.drawImage(measured.cutout, crop.x, crop.y, crop.w, crop.h, 0, 0, finalCanvas.width, finalCanvas.height);

  onProgress?.("verifying");
  const checks: ComplianceCheck[] = [];
  let crownEstimated = measured.estimated;
  let measurements: Measurements = null;

  try {
    const rePoints = await detectPoints(finalCanvas);
    const reMeasured = await measureCrown(finalCanvas, rePoints);
    crownEstimated = crownEstimated || reMeasured.estimated;
    measurements = { crownY: reMeasured.crownY, chinY: reMeasured.chinY, eyeY: reMeasured.eye.y };

    const ppm = spec.print.dpi / 25.4;
    const measuredHeadMm = (reMeasured.chinY - reMeasured.crownY) / ppm;
    const measuredEyePct = (1 - reMeasured.eye.y / finalCanvas.height) * 100;

    checks.push(
      rangeCheck(
        "head-height",
        "Head height",
        measuredHeadMm,
        spec.head.height_mm_min,
        spec.head.height_mm_max,
        "mm",
        reMeasured.estimated
      )
    );
    checks.push(
      rangeCheck(
        "eye-line",
        "Eye line from bottom",
        measuredEyePct,
        spec.eye_line.from_bottom_pct_min,
        spec.eye_line.from_bottom_pct_max,
        "%"
      )
    );
  } catch (err) {
    checks.push({
      id: "re-verify",
      label: "Re-measurement",
      pass: false,
      detail:
        err instanceof NoFaceError
          ? "Could not re-detect a face in the rendered photo — retake with more even lighting."
          : "Re-measurement failed unexpectedly.",
    });
  }

  checks.push(backgroundCheck(finalCanvas, spec));
  checks.push({
    id: "resolution",
    label: "Resolution",
    pass: true,
    detail: `${finalCanvas.width}×${finalCanvas.height}px at ${spec.print.dpi} DPI`,
  });

  onProgress?.("encoding");
  const { blob, kb } = await encodeToSpec(finalCanvas, spec);
  checks.push(fileSizeCheck(kb, spec));

  return {
    finalCanvas,
    previewCanvas: withWatermark(finalCanvas),
    blob,
    kb,
    checks,
    allPassed: checks.every((c) => c.pass),
    crownEstimated,
    measurements,
  };
}
