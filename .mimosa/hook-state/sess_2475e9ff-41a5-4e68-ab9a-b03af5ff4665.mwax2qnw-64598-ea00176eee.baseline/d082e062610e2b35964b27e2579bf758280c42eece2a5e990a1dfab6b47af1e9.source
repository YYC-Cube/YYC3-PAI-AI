/**
 * @file LoadingSkeleton.tsx
 * @description 加载骨架组件，提供加载状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags loading,skeleton,ui,component
 */

import { useThemeStore } from "../store/theme-store";

/** Full-screen skeleton for mode components (IDEMode, FullscreenMode) */
export function ModeSkeleton() {
  const { tokens, isCyberpunk } = useThemeStore();

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: tokens.background }}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Pulsing logo placeholder */}
        <div
          className="w-10 h-10 rounded-xl"
          style={{
            background: tokens.primaryGlow,
            border: `1px solid ${tokens.borderDim}`,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        {/* Text skeleton */}
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: tokens.fontMono,
              fontSize: "10px",
              color: tokens.primaryDim,
              letterSpacing: "3px",
              opacity: 0.5,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            YYC&#179; LOADING
          </span>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full"
              style={{
                background: tokens.primary,
                opacity: 0.4,
                animation: `pulse 1s ${i * 0.2}s ease-in-out infinite`,
                boxShadow: isCyberpunk ? `0 0 3px ${tokens.primary}` : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Small panel skeleton for overlay components */
export function PanelSkeleton() {
  const { tokens } = useThemeStore();

  return (
    <div
      className="flex items-center justify-center p-8"
      style={{ color: tokens.foregroundMuted }}
    >
      <span
        style={{
          fontFamily: tokens.fontMono,
          fontSize: "10px",
          letterSpacing: "1px",
          opacity: 0.5,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        Loading...
      </span>
    </div>
  );
}
