import type { ReactNode } from "react";
import styles from "./StreamConnectingIndicator.module.less";

const LOGO_SRC = `${import.meta.env.BASE_URL}pwa-192.png`;

interface StreamConnectingIndicatorProps {
  /** Status line under the animation (e.g. 「连接中」). */
  label: ReactNode;
  /** Optional secondary hint. */
  hint?: ReactNode;
  /** Light page chrome vs dark stream surfaces (phone / browser viewport). */
  tone?: "default" | "onDark";
  /** Compact for phone bezel / dock panels. */
  size?: "md" | "sm";
}

/**
 * Shared connecting / waiting-frame indicator for remote browser & desktop.
 * Uses the YYC3-Pai logo.
 */
export default function StreamConnectingIndicator({
  label,
  hint,
  tone = "default",
  size = "md",
}: StreamConnectingIndicatorProps) {
  const rootClass = [
    styles.root,
    tone === "onDark" ? styles.onDark : "",
    size === "sm" ? styles.sizeSm : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <img
        className={styles.mascot}
        src={LOGO_SRC}
        alt=""
        aria-hidden
        draggable={false}
      />
      <div className={styles.label}>{label}</div>
      {hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
}
