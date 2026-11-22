import { useEffect, useRef, useState } from "react";

import { CallAvatar, CallTimer, CtrlBtn } from "./controls";
import { BACKDROP_STYLE } from "./styles";
import { IconMic, IconMicOff, IconVideo, WithSlash } from "./icons";
import type { CallMode, CallState } from "../../../types";

/* ─── In-call phase ──────────────────────────────────────────────── */

interface InCallViewProps {
  mode: CallMode;
  peerName: string;
  peerAvatarUrl: string;
  isMicOn: boolean;
  isCamOn: boolean;
  error: string;
  iceState: CallState["iceState"];
  remoteStream: MediaStream | null;
  onToggleMic?: () => void;
  onToggleCam?: () => void;
  onEnd?: () => void;
}

export default function InCallView({ mode, peerName, peerAvatarUrl, isMicOn, isCamOn, error, iceState, remoteStream, onToggleMic, onToggleCam, onEnd }: InCallViewProps) {
  const [peerCamOn, setPeerCamOn] = useState(false);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const showVideoLayout = mode === "video" || isCamOn || peerCamOn;

  useEffect(() => {
    if (!remoteAudioRef.current) return;
    remoteAudioRef.current.srcObject = remoteStream || null;
    if (remoteStream) {
      console.log("[WebRTC] Setting remoteStream on audio element, playing...");
      remoteAudioRef.current.play().catch((err: unknown) => {
        console.warn("[WebRTC] Audio autoplay blocked:", err);
      });
    }
  }, [remoteStream]);

  return (
    <div
      id="call-overlay"
      className="call-overlay-backdrop fixed inset-0 z-50 flex flex-col"
      style={BACKDROP_STYLE}
    >
      <audio ref={remoteAudioRef} autoPlay />
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
              {/* ICE state debug badge */}
              {iceState && (
                <p className="mt-2 text-[10px] font-mono" style={{
                  color: iceState === "connected" || iceState === "completed" ? "#34d399"
                    : iceState === "failed" || iceState === "disconnected" ? "#f87171"
                    : "rgba(255,255,255,0.4)"
                }}>
                  ICE: {iceState}
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

        <CtrlBtn onClick={onEnd} label="End" danger aria-label="End call">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z" />
          </svg>
        </CtrlBtn>
      </div>
    </div>
  );
}
