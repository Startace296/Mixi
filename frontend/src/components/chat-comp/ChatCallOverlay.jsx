import { useEffect, useRef, useState } from "react";

/* ─── Icons ─────────────────────────────────────────────────────── */
const SVG_PROPS = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function IconPhone({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconPhoneFilled({ className = "h-5 w-5" }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function IconVideo({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function IconMic({ className = "h-5 w-5" }) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function IconMicOff({ className = "h-5 w-5" }) {
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
function WithSlash({ children, size = 24 }) {
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
function CallIcon({ mode, className = "h-6 w-6" }) {
  return mode === "video"
    ? <IconVideo className={className} />
    : <IconPhoneFilled className={className} />;
}

/* ─── Avatar with pulse rings ───────────────────────────────────── */
function CallAvatar({ peerName, peerAvatarUrl, isRinging }) {
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
const ROUND_BTN_STYLES = {
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

function RoundBtn({ id, onClick, label, variant, children }) {
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

function CtrlBtn({ onClick, children, label, danger = false, active = true, large = false }) {
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

function CallTimer() {
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

/* ─── Shared constants ───────────────────────────────────────────── */

const BACKDROP_STYLE = {
  background: "linear-gradient(135deg, rgba(15,10,30,0.96) 0%, rgba(30,15,50,0.96) 50%, rgba(15,10,30,0.96) 100%)",
  backdropFilter: "blur(24px)",
};

/* ─── Ringing phase (incoming + outgoing) ───────────────────────── */

function RingingView({ phase, mode, peerName, peerAvatarUrl, error, onAccept, onDecline, onCancel, onTogglePov = () => {} }) {
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

/* ─── In-call phase ──────────────────────────────────────────────── */

function InCallView({ mode, peerName, peerAvatarUrl, isMicOn, isCamOn, error, remoteStream, onToggleMic, onToggleCam, onEnd }) {
  const [peerCamOn, setPeerCamOn] = useState(false);
  const remoteAudioRef = useRef(null);
  const showVideoLayout = mode === "video" || isCamOn || peerCamOn;

  useEffect(() => {
    if (!remoteAudioRef.current) return;
    remoteAudioRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  return (
    <div
      id="call-overlay"
      className="call-overlay-backdrop fixed inset-0 z-50 flex flex-col"
      style={BACKDROP_STYLE}
    >
      <audio ref={remoteAudioRef} autoPlay playsInline />
      {/* Main content area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Background gradient orbs */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 30% 40%, rgba(139,92,246,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(99,102,241,0.1) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />

        {showVideoLayout ? (
          <div className="relative flex h-full w-full items-center justify-center p-4">
            <div
              className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl"
              style={{
                aspectRatio: "16 / 9",
                height: "100%",
                maxWidth: "100%",
                background: peerCamOn
                  ? "linear-gradient(160deg, rgba(30,20,60,0.7), rgba(20,10,40,0.7))"
                  : "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {peerCamOn ? (
                <>
                  {peerAvatarUrl ? (
                    <img src={peerAvatarUrl} alt={peerName} className="h-28 w-28 rounded-full object-cover opacity-90" />
                  ) : (
                    <div
                      className="flex h-28 w-28 items-center justify-center rounded-full text-5xl font-bold text-white"
                      style={{ background: "rgba(139,92,246,0.3)" }}
                    >
                      {(peerName || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <p className="mt-3 text-sm font-medium text-white/60">{peerName}</p>
                </>
              ) : (
                <>
                  {peerAvatarUrl ? (
                    <img src={peerAvatarUrl} alt={peerName} className="h-28 w-28 rounded-full object-cover opacity-60" />
                  ) : (
                    <div
                      className="flex h-28 w-28 items-center justify-center rounded-full text-5xl font-bold text-white opacity-40"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      {(peerName || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <p className="mt-4 text-sm font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Camera not connected
                  </p>
                </>
              )}
            </div>

            <div
              className="absolute bottom-6 right-6 flex flex-col items-center justify-center overflow-hidden rounded-xl"
              style={{
                aspectRatio: "16 / 9",
                width: 200,
                background: "rgba(255,255,255,0.07)",
                border: "2px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              {isCamOn ? (
                <span className="px-1 text-center text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Your cam
                </span>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <WithSlash size={18}><IconVideo className="h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} /></WithSlash>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>Off</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Voice: avatar + name + timer */
          <div className="flex flex-col items-center gap-5">
            <CallAvatar peerName={peerName} peerAvatarUrl={peerAvatarUrl} isRinging={false} />
            <div>
              <p className="text-center text-xl font-bold text-white">{peerName || "Unknown"}</p>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#10b981" }} />
                <CallTimer />
              </div>
              {error && (
                <p className="mt-3 max-w-xs rounded-xl px-3 py-2 text-center text-xs font-semibold text-red-100" style={{ background: "rgba(239,68,68,0.18)" }}>
                  {error}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {mode === "video" && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
          <span className="text-[10px] font-bold" style={{ color: "#fbbf24" }}>DEV</span>
          <button
            type="button"
            onClick={() => setPeerCamOn((v) => !v)}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold transition hover:opacity-80"
            style={{ background: peerCamOn ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)", color: peerCamOn ? "#34d399" : "#f87171" }}
          >
            Other cam: {peerCamOn ? "ON" : "OFF"}
          </button>
        </div>
      )}

      {/* Control bar */}
      <div
        className="relative flex items-center justify-center gap-5 px-6 py-6"
        style={{
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Peer name + timer shown on left when video layout is active */}
        {showVideoLayout && (
          <div className="absolute left-6 flex flex-col">
            <span className="text-sm font-semibold text-white">{peerName}</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#10b981" }} />
              <CallTimer />
            </div>
          </div>
        )}

        <CtrlBtn
          onClick={onToggleMic}
          label={isMicOn ? "Mute" : "Unmute"}
          active={isMicOn}
          aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicOn ? <IconMic className="h-5 w-5" /> : <IconMicOff className="h-5 w-5" />}
        </CtrlBtn>

        {mode === "video" && (
          <CtrlBtn
            onClick={onToggleCam}
            label={isCamOn ? "Cam off" : "Cam on"}
            active={isCamOn}
            aria-label={isCamOn ? "Turn camera off" : "Turn camera on"}
          >
            {isCamOn
              ? <IconVideo className="h-5 w-5" />
              : <WithSlash size={20}><IconVideo className="h-5 w-5" /></WithSlash>
            }
          </CtrlBtn>
        )}

        <CtrlBtn onClick={onEnd} label="End" danger large aria-label="End call">
          <WithSlash size={24}>
            <CallIcon mode={mode} className="h-6 w-6" />
          </WithSlash>
        </CtrlBtn>
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────── */

export default function ChatCallOverlay({
  isOpen,
  phase,      // "outgoing_ringing" | "incoming_ringing" | "in_call"
  mode,       // "voice" | "video"
  peerName,
  peerAvatarUrl,
  isMicOn,
  isCamOn,
  error,
  remoteStream,
  onAccept,
  onDecline,
  onCancel,
  onToggleMic,
  onToggleCam,
  onEnd,
}) {
  const [debugPhaseOverride, setDebugPhaseOverride] = useState(null);
  const effectivePhase = debugPhaseOverride ?? phase;

  useEffect(() => { setDebugPhaseOverride(null); }, [phase]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key !== "Escape") return;
      if (phase === "incoming_ringing") onDecline?.();
      else if (phase === "outgoing_ringing") onCancel?.();
      else onEnd?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, phase, onCancel, onDecline, onEnd]);

  if (!isOpen) return null;

  const handleTogglePov = () =>
    setDebugPhaseOverride((v) =>
      (v ?? effectivePhase) === "incoming_ringing" ? "outgoing_ringing" : "incoming_ringing"
    );

  if (effectivePhase === "in_call") {
    return (
      <InCallView
        mode={mode}
        peerName={peerName}
        peerAvatarUrl={peerAvatarUrl}
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        error={error}
        remoteStream={remoteStream}
        onToggleMic={onToggleMic}
        onToggleCam={onToggleCam}
        onEnd={onEnd}
      />
    );
  }

  return (
    <RingingView
      phase={effectivePhase}
      mode={mode}
      peerName={peerName}
      peerAvatarUrl={peerAvatarUrl}
      error={error}
      onAccept={onAccept}
      onDecline={onDecline}
      onCancel={onCancel}
      onTogglePov={handleTogglePov}
    />
  );
}
