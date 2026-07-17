/**
 * Ambient canvas. Server component: it renders no theme-specific values in JS, it only
 * reads CSS variables (--amb-*) that flip with data-theme, so the backdrop swaps between the
 * warm cream (light) and the deep teal-black (dark) with zero flash and no client work.
 */
export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background:
          "radial-gradient(ellipse 120% 90% at 50% -10%, rgb(var(--amb-1)) 0%, rgb(var(--amb-2)) 55%, rgb(var(--amb-3)) 100%)",
      }}
    >
      {/* faint grid, masked to fade toward the edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--amb-grid) 1px, transparent 1px), linear-gradient(90deg, var(--amb-grid) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(ellipse 85% 65% at 50% 32%, black 45%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 65% at 50% 32%, black 45%, transparent 100%)",
        }}
      />
      {/* soft accent glow in the upper area */}
      <div
        style={{
          position: "absolute",
          top: "-14%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 760,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--amb-glow) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />
      {/* second, cooler glow, upper right */}
      <div
        style={{
          position: "absolute",
          top: "-8%",
          right: "4%",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--amb-glow-2) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}
