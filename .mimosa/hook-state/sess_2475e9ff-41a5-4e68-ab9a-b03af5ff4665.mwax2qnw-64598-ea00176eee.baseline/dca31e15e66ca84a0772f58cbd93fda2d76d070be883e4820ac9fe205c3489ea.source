/**
 * @file CyberTooltip.tsx
 * @description 提示框组件，提供鼠标悬停提示
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,tooltip,ui
 */

import { ReactNode } from "react";
import { useThemeStore } from "../store/theme-store";

interface CyberTooltipProps {
  label: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

/**
 * Theme-aware hover tooltip wrapper.
 * Shows a styled tooltip on hover, adapting to cyberpunk or clean theme.
 */
export function CyberTooltip({ label, children, position = "bottom", className = "" }: CyberTooltipProps) {
  const { tokens } = useThemeStore();

  const positionStyles: Record<string, Record<string, string>> = {
    bottom: { left: "50%", top: "100%", marginTop: "8px", transform: "translateX(-50%)" },
    top: { left: "50%", bottom: "100%", marginBottom: "8px", transform: "translateX(-50%)" },
    left: { right: "100%", top: "50%", marginRight: "8px", transform: "translateY(-50%)" },
    right: { left: "100%", top: "50%", marginLeft: "8px", transform: "translateY(-50%)" },
  };

  const arrowMap: Record<string, Record<string, string | number>> = {
    bottom: { left: "50%", top: "-4px", transform: "translateX(-50%)", borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: `4px solid ${tokens.border}` },
    top: { left: "50%", bottom: "-4px", transform: "translateX(-50%)", borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `4px solid ${tokens.border}` },
    left: { right: "-4px", top: "50%", transform: "translateY(-50%)", borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `4px solid ${tokens.border}` },
    right: { left: "-4px", top: "50%", transform: "translateY(-50%)", borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderRight: `4px solid ${tokens.border}` },
  };

  return (
    <div className={`relative group ${className}`} style={{ display: "inline-flex" }}>
      {children}
      <div
        className="absolute whitespace-nowrap px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none"
        style={{
          ...positionStyles[position],
          fontFamily: tokens.fontMono,
          fontSize: "10px",
          letterSpacing: "0.5px",
          color: tokens.primary,
          background: tokens.panelBg,
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadow,
          zIndex: 9999,
        }}
      >
        {label}
        <div
          className="absolute"
          style={{ width: 0, height: 0, ...arrowMap[position] }}
        />
      </div>
    </div>
  );
}