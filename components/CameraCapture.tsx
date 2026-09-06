"use client";

import { useEffect, useRef, useState } from "react";
import { getVideoLandmarker, evaluateFraming, type Guidance } from "@/lib/engine/camera";
import { Notice } from "./Notice";
import { useModalTrap } from "./useModalTrap";

export function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [guidance, setGuidance] = useState<Guidance>({ faceDetected: false, message: "Starting camera…", ready: false });
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useModalTrap(onClose);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        const landmarker = await getVideoLandmarker();
        if (cancelled) return;

        const loop = () => {
          const v = videoRef.current;
          if (v && v.readyState >= 2) {
            const result = landmarker.detectForVideo(v, performance.now());
            const face = result.faceLandmarks[0];
            setGuidance(
              face
                ? evaluateFraming(face, v.videoWidth, v.videoHeight)
                : { faceDetected: false, message: "No face detected — center yourself in frame", ready: false }
            );
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        setError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera access was denied. Allow camera access in your browser, or upload a photo instead."
            : "Could not access your camera. Try uploading a photo instead."
        );
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Take a photo</h2>
          <button
            onClick={onClose}
            aria-label="Close camera"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {error ? (
          <Notice tone="error">{error}</Notice>
        ) : (
          <>
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-black">
              {/* Mirrored for a natural selfie view. The captured frame is
                  drawn from the raw (unmirrored) video, so the saved photo
                  is correctly oriented despite the preview being flipped. */}
              <video
                ref={videoRef}
                className="h-full w-full -scale-x-100 object-cover"
                muted
                playsInline
                aria-label="Live camera preview"
              />
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-3">
                <div
                  className={`rounded-[50%] border-4 transition-colors ${
                    guidance.ready ? "border-emerald-400" : "border-white/70"
                  }`}
                  style={{ width: "44%", aspectRatio: "3/4" }}
                />
              </div>
            </div>

            <p
              className={`mt-3 text-center text-sm font-medium ${
                guidance.ready ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"
              }`}
              aria-live="polite"
            >
              {guidance.message}
            </p>

            <button
              onClick={capture}
              disabled={!guidance.faceDetected}
              className="mt-3 w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Capture photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
