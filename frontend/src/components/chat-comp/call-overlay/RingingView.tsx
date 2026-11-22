import { CallAvatar, RoundBtn } from "./controls";
import { BACKDROP_STYLE } from "./styles";
import { CallIcon, WithSlash } from "./icons";
import type { CallMode, CallPhase } from "../../../types";

/* ─── Ringing phase (incoming + outgoing) ───────────────────────── */

interface RingingViewProps {
  phase: CallPhase;
  mode: CallMode;
  peerName: string;
  peerAvatarUrl: string;
  error: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  /** Debug helper: flips between the incoming and outgoing ringing screens. */
  onTogglePov?: () => void;
}

export default function RingingView({ phase, mode, peerName, peerAvatarUrl, error, onAccept, onDecline, onCancel, onTogglePov = () => {} }: RingingViewProps) {
  const isIncoming = phase === "incoming_ringing";

  const badgeLabel = isIncoming
    ? mode === "video" ? "Incoming video call" : "Incoming voice call"
    : "Calling…";

  const subtitle = isIncoming
    ? mode === "video" ? "wants to video call you" : "is calling you"
    : "Waiting for them to answer…";

  return (
    <div
      id="call-overlay"
      className="call-overlay-backdrop fixed inset-0 z-50 flex items-center justify-center px-4"
      style={BACKDROP_STYLE}
    >
      {/* Background glow orb */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="call-overlay-card relative flex w-full max-w-xs flex-col items-center overflow-hidden rounded-3xl px-8 py-10 text-center"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Mode badge */}
        <div
          className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)", color: "#c4b5fd" }}
        >
          <CallIcon mode={mode} className="h-3 w-3" />
          {badgeLabel}
        </div>

        <CallAvatar peerName={peerName} peerAvatarUrl={peerAvatarUrl} isRinging />

        <p className="mt-5 max-w-full truncate text-xl font-bold text-white">
          {peerName || "Unknown"}
        </p>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          {subtitle}
        </p>
        {error && (
          <p className="mt-4 rounded-xl px-3 py-2 text-xs font-semibold text-red-100" style={{ background: "rgba(239,68,68,0.18)" }}>
            {error}
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-9 flex items-center justify-center gap-6">
          {/* Red — decline / cancel */}
          <RoundBtn
            id={isIncoming ? "btn-decline-call" : "btn-cancel-call"}
            onClick={isIncoming ? onDecline : onCancel}
            label={isIncoming ? "Decline" : "Cancel"}
            variant="red"
          >
            <WithSlash size={24}>
              <CallIcon mode={mode} className="h-6 w-6" />
            </WithSlash>
          </RoundBtn>

          {/* Green — accept (receiver only) */}
          {isIncoming && (
            <RoundBtn
              id="btn-accept-call"
              onClick={onAccept}
              label="Accept"
              variant="green"
            >
              <CallIcon mode={mode} className="h-6 w-6" />
            </RoundBtn>
          )}
        </div>

        {/* DEV: toggle caller/receiver POV */}
        <div className="hidden mt-6 items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}>
          <span className="text-[10px] font-bold" style={{ color: "#fbbf24" }}>DEV</span>
          <button
            type="button"
            onClick={onTogglePov}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold transition hover:opacity-80"
            style={{ background: "rgba(139,92,246,0.25)", color: "#c4b5fd" }}
          >
            {isIncoming ? "Receiver POV" : "Caller POV"} → switch
          </button>
        </div>
      </div>
    </div>
  );
}
