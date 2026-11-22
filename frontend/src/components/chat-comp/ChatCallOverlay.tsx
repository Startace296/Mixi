import { useEffect, useState } from "react";

import InCallView from "./call-overlay/InCallView";
import RingingView from "./call-overlay/RingingView";
import type { CallPhase, CallState } from "../../types";

/* ─── Main export ────────────────────────────────────────────────── */

type ChatCallOverlayProps = Pick<
  CallState,
  "isOpen" | "phase" | "mode" | "peerName" | "peerAvatarUrl" | "isMicOn" | "isCamOn" | "error" | "iceState"
> & {
  remoteStream: MediaStream | null;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onToggleMic?: () => void;
  onToggleCam?: () => void;
  onEnd?: () => void;
};

export default function ChatCallOverlay({
  isOpen,
  phase,      // "outgoing_ringing" | "incoming_ringing" | "in_call"
  mode,       // "voice" | "video"
  peerName,
  peerAvatarUrl,
  isMicOn,
  isCamOn,
  error,
  iceState,
  remoteStream,
  onAccept,
  onDecline,
  onCancel,
  onToggleMic,
  onToggleCam,
  onEnd,
}: ChatCallOverlayProps) {
  const [debugPhaseOverride, setDebugPhaseOverride] = useState<CallPhase | null>(null);
  const effectivePhase = debugPhaseOverride ?? phase;

  useEffect(() => { setDebugPhaseOverride(null); }, [phase]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
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
        iceState={iceState}
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
