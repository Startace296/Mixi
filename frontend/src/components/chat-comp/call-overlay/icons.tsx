import type { CSSProperties, ReactNode, SVGProps } from "react";

import type { CallMode } from "../../../types";

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

/* ─── Icons ─────────────────────────────────────────────────────── */
const SVG_PROPS: SVGProps<SVGSVGElement> = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconPhoneFilled({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

export function IconVideo({ className = "h-5 w-5", style }: IconProps) {
  return (
    <svg className={className} style={style} {...SVG_PROPS}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

export function IconMic({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export function IconMicOff({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/* Overlays a diagonal slash on any icon child */
export function WithSlash({ children, size = 24 }: { children?: ReactNode; size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {children}
      <svg
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <line x1="3" y1="3" x2="21" y2="21" />
      </svg>
    </span>
  );
}

/* Returns the correct "accept" icon for the current call mode */
export function CallIcon({ mode, className = "h-6 w-6" }: { mode: CallMode; className?: string }) {
  return mode === "video"
    ? <IconVideo className={className} />
    : <IconPhoneFilled className={className} />;
}
