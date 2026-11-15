/**
 * @file CyberpunkBackground.tsx
 * @description 赛博朋克背景组件，提供背景效果
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags background,cyberpunk,ui,component
 */
import { useEffect, useRef } from "react";
import { useThemeStore } from "../store/theme-store";

export function CyberpunkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tokens: tk, isCyberpunk } = useThemeStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // In clean mode, no particle animation needed
    if (!isCyberpunk) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animId: number;
    const particles: { x: number; y: number; speed: number; length: number; opacity: number; color: string }[] = [];
    const colors = [tk.primary, tk.primary, tk.primary];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize data flow particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 2,
        length: 20 + Math.random() * 60,
        opacity: 0.1 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw data flow particles
      particles.forEach((p) => {
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.length);
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(0.5, p.color);
        gradient.addColorStop(1, "transparent");
        ctx.strokeStyle = gradient;
        ctx.globalAlpha = p.opacity;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length);
        ctx.stroke();

        p.y += p.speed;
        if (p.y > canvas.height) {
          p.y = -p.length;
          p.x = Math.random() * canvas.width;
        }
      });

      // Draw some floating dots at circuit intersections
      ctx.globalAlpha = 1;
      for (let i = 0; i < 8; i++) {
        const t = Date.now() * 0.001 + i * 1.3;
        const x = (Math.sin(t * 0.3 + i) * 0.4 + 0.5) * canvas.width;
        const y = (Math.cos(t * 0.2 + i * 0.7) * 0.4 + 0.5) * canvas.height;
        const r = 1.5 + Math.sin(t * 2) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors[i % 3];
        ctx.globalAlpha = 0.3 + Math.sin(t) * 0.2;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        glow.addColorStop(0, colors[i % 3] + "33");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [isCyberpunk, tk.primary, tk.primaryDim, tk.background]);

  // Clean theme: simple gradient background, no effects
  if (!isCyberpunk) {
    return (
      <div className="fixed inset-0" style={{ zIndex: 0, pointerEvents: "none" }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${tk.background} 0%, ${tk.backgroundAlt} 50%, ${tk.background} 100%)`,
          }}
        />
        {/* Subtle dot pattern for texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0" style={{ zIndex: 0, pointerEvents: "none" }}>
      {/* Base color */}
      <div className="absolute inset-0" style={{ background: tk.background }} />
      {/* Circuit grid */}
      <div className="absolute inset-0 circuit-grid" />
      {/* Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Scanline overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 w-full cyberpunk-scanline"
          style={{
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${tk.primaryDim}, transparent)`,
            top: 0,
          }}
        />
      </div>
      {/* CRT scanlines texture */}
      <div
        className="absolute inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          pointerEvents: "none",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
