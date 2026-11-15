/**
 * @file HoloCard.tsx
 * @description 全息卡片组件，提供全息效果
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags card,hologram,ui,component
 */
import { type ReactNode } from "react";
import { useThemeStore } from "../store/theme-store";

interface HoloCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "magenta" | "yellow";
}

export function HoloCard({ children, className = "" }: HoloCardProps) {
  const { tokens, isCyberpunk } = useThemeStore();

  return (
    <div
      className={`${isCyberpunk ? "holo-card" : ""} rounded-lg p-4 backdrop-blur-sm ${className}`}
      style={{
        background: isCyberpunk ? undefined : tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: tokens.shadow,
        borderRadius: tokens.borderRadius,
      }}
    >
      {children}
    </div>
  );
}
