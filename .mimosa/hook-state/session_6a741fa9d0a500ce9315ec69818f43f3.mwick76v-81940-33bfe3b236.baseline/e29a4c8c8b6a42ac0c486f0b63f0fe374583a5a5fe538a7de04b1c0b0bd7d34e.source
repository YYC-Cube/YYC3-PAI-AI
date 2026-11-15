/**
 * @file GlitchText.tsx
 * @description 故障文本组件，提供故障效果
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags text,glitch,ui,component
 */
import { useState, useEffect } from "react";
import { useThemeStore } from "../store/theme-store";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "div" | "p";
}

export function GlitchText({ text, className = "", as: Tag = "span" }: GlitchTextProps) {
  const [glitching, setGlitching] = useState(false);
  const { tokens } = useThemeStore();

  useEffect(() => {
    // Only run glitch effect in cyberpunk mode
    if (!tokens.enableGlitch) return;
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [tokens.enableGlitch]);

  return (
    <Tag
      className={`relative inline-block ${className} ${glitching && tokens.enableGlitch ? "cyberpunk-glitch" : ""}`}
      data-text={text}
      style={{ fontFamily: tokens.fontDisplay }}
    >
      {text}
    </Tag>
  );
}
