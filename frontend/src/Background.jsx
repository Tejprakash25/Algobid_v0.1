import React, { useEffect, useRef } from "react";

export default function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = 0;
    let height = 0;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    window.addEventListener("resize", resize);

    const drawAurora = () => {
      time += 0.004;

      ctx.clearRect(0, 0, width, height);

      // Deep base
      const base = ctx.createLinearGradient(0, 0, 0, height);

      base.addColorStop(0, "#020604");
      base.addColorStop(0.5, "#03110d");
      base.addColorStop(1, "#010302");

      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      // Flowing aurora ribbons
      for (let layer = 0; layer < 4; layer++) {
        const gradient = ctx.createLinearGradient(
          0,
          height * 0.2,
          width,
          height * 0.8
        );

        gradient.addColorStop(
          0,
          "rgba(16,185,129,0)"
        );

        gradient.addColorStop(
          0.35,
          "rgba(16,185,129,0.07)"
        );

        gradient.addColorStop(
          0.55,
          "rgba(45,212,191,0.10)"
        );

        gradient.addColorStop(
          0.75,
          "rgba(16,185,129,0.04)"
        );

        gradient.addColorStop(
          1,
          "rgba(16,185,129,0)"
        );

        ctx.fillStyle = gradient;

        ctx.beginPath();

        const amplitude = 80 + layer * 25;
        const frequency = 0.002 + layer * 0.0004;
        const offset = layer * 120;

        ctx.moveTo(0, height * 0.45);

        for (let x = 0; x <= width; x += 12) {
          const wave =
            Math.sin(x * frequency + time + offset) *
              amplitude +
            Math.sin(x * frequency * 0.45 - time * 0.7) *
              amplitude *
              0.5;

          const y =
            height * 0.45 +
            wave +
            layer * 45;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);

        ctx.closePath();
        ctx.fill();
      }

      // Large soft glow
      const glow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        0,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.65
      );

      glow.addColorStop(
        0,
        "rgba(16,185,129,0.08)"
      );

      glow.addColorStop(
        0.45,
        "rgba(16,185,129,0.025)"
      );

      glow.addColorStop(
        1,
        "rgba(0,0,0,0)"
      );

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      animationFrameId =
        requestAnimationFrame(drawAurora);
    };

    drawAurora();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Soft vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 15%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Top atmospheric fade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.25), transparent 40%, rgba(0,0,0,0.55))",
        }}
      />
    </div>
  );
}