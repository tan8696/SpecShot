import Topography from "./Topography";

/** The full-bleed WebGL contour field used behind the landing page and every
 * tool page. Fixed to the viewport and pointer-transparent, so it can be
 * dropped anywhere in a page's tree; the scrim on top keeps body copy
 * readable over the brighter ridge lines. */
export function PageBackground() {
  return (
    <>
      {/* Opaque base — sits under the WebGL layer so the page never falls back
          to the light <body> background when the OS theme is light. */}
      <div className="fixed inset-0 -z-20 bg-surface-container-lowest" />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <Topography
          lowColor="#5a5a5a"
          midColor="#9c9c9c"
          highColor="#ffffff"
          speed={0.15}
          morphAmount={3}
          morphSpeed={0.05}
          bands={2}
          thickness={0.013}
          scale={1.2}
          glow={0.22}
          colorMode="elevation"
          contrast={1.7}
          brightness={1}
          opacity={0.8}
          grain
          grainIntensity={0.03}
          mouseInteraction={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/40 via-surface-container-lowest/70 to-surface-container-lowest/92" />
      </div>
    </>
  );
}
