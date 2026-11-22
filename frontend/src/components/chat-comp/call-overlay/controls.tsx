import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

/* ─── Avatar with pulse rings ───────────────────────────────────── */
export function CallAvatar({ peerName, peerAvatarUrl, isRinging }: { peerName: string; peerAvatarUrl: string; isRinging: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      {isRinging && (
        <>
          <span
            className="call-pulse-ring absolute inset-0 rounded-full"
            style={{ background: "rgba(139,92,246,0.25)" }}
          />
          <span
            className="call-pulse-ring-2 absolute inset-0 rounded-full"
            style={{ background: "rgba(139,92,246,0.18)" }}
          />
        </>
      )}
      <div
        className={`relative z-10 h-24 w-24 overflow-hidden rounded-full ring-4 ${isRinging ? "call-avatar-glow ring-violet-500/60" : "ring-white/20"
          }`}
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        {peerAvatarUrl ? (
          <img src={peerAvatarUrl} alt={peerName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
            {(peerName || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Round action button (Decline / Cancel / Accept) ───────────── */
const ROUND_BTN_STYLES: Record<string, CSSProperties> = {
  red: {
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    border: "1px solid rgba(239,68,68,0.4)",
    boxShadow: "0 8px 24px rgba(239,68,68,0.35)",
  },
  green: {
    background: "linear-gradient(135deg,#10b981,#059669)",
    border: "1px solid rgba(16,185,129,0.4)",
    boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
  },
};

interface RoundBtnProps {
  id?: string;
  onClick?: () => void;
  label: string;
  variant: keyof typeof ROUND_BTN_STYLES;
  children?: ReactNode;
}

export function RoundBtn({ id, onClick, label, variant, children }: RoundBtnProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        id={id}
        onClick={onClick}
        aria-label={label}
        style={{ ...ROUND_BTN_STYLES[variant], transition: "transform 0.12s ease, box-shadow 0.12s ease" }}
        className="flex h-16 w-16 items-center justify-center rounded-full text-white hover:scale-105 active:scale-95"
      >
        {children}
      </button>
      <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
        {label}
      </span>
    </div>
  );
}

/* ─── In-call square button (Mic / Cam / End) ───────────────────── */

interface CtrlBtnProps {
  onClick?: () => void;
  children?: ReactNode;
  label: string;
  danger?: boolean;
  active?: boolean;
  large?: boolean;
}

export function CtrlBtn({ onClick, children, label, danger = false, active = true, large = false }: CtrlBtnProps) {
  const bg = danger
    ? "linear-gradient(135deg,#ef4444,#dc2626)"
    : active
      ? "rgba(255,255,255,0.15)"
      : "rgba(239,68,68,0.25)";

  const border = danger
    ? "1px solid rgba(239,68,68,0.4)"
    : active
      ? "1px solid rgba(255,255,255,0.18)"
      : "1px solid rgba(239,68,68,0.35)";

  const labelColor = active && !danger ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.9)";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{ background: bg, backdropFilter: "blur(8px)", border, transition: "transform 0.12s ease, background 0.2s ease" }}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl text-white ${large ? "h-16 w-16" : "h-14 w-14"
        } hover:scale-105 active:scale-95`}
    >
      {children}
      {label && (
        <span className="text-[10px] font-medium leading-none" style={{ color: labelColor }}>
          {label}
        </span>
      )}
    </button>
  );
}

/* ─── Call duration timer ────────────────────────────────────────── */

export function CallTimer() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <span className="tabular-nums" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
      {mm}:{ss}
    </span>
  );
}

