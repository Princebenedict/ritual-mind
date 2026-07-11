"use client";

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
          "radial-gradient(ellipse 120% 90% at 50% -10%, #FBFAF8 0%, #F5F3EF 55%, #F1EFE9 100%)",
      }}
    >
      {/* very faint warm grid, masked to fade toward the edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.028) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage:
            "radial-gradient(ellipse 85% 65% at 50% 32%, black 45%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 65% at 50% 32%, black 45%, transparent 100%)",
        }}
      />
      {/* one soft cool pastel glow in the upper area, barely perceptible */}
      <div
        style={{
          position: "absolute",
          top: "-14%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 760,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(158,217,206,0.30) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />
      {/* faint warm highlight, upper right, to keep the light warm */}
      <div
        style={{
          position: "absolute",
          top: "-8%",
          right: "4%",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(214,196,158,0.16) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}
