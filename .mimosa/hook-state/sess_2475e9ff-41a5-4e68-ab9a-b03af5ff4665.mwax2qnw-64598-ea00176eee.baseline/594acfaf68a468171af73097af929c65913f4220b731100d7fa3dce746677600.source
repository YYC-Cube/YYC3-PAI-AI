/**
 * @file CyberToast.tsx
 * @description CyberToast组件/模块
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,toast,notification,ui
 */

import { Toaster, toast } from "sonner";
import { useThemeStore } from "../store/theme-store";

/**
 * Cyberpunk-styled toast notification system.
 * Uses sonner under the hood with custom styling based on active theme.
 */
export function CyberToaster() {
  const { tokens } = useThemeStore();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "cyber-toast-item",
        },
        style: {
          fontFamily: tokens.fontMono,
          fontSize: "11px",
          color: tokens.primary,
          background: tokens.panelBg,
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadow,
          borderRadius: tokens.borderRadius,
          padding: "10px 14px",
          backdropFilter: "blur(10px)",
          letterSpacing: "0.5px",
          maxWidth: "360px",
          lineHeight: "1.4",
        },
      }}
    />
  );
}

/**
 * Show a cyberpunk-styled toast notification.
 */
export function cyberToast(message: string, options?: { icon?: string; duration?: number }) {
  toast(message, {
    duration: options?.duration ?? 2500,
    icon: options?.icon,
  });
}