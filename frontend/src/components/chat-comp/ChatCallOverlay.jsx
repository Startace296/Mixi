import { useEffect } from "react";

function IconPhone({ className = "h-5 w-5" }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

function IconVideo({ className = "h-5 w-5" }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function IconMic({ className = "h-5 w-5" }) {
  return (
    <IconPhone className={className} />
  );
}

function IconMicOff({ className = "h-5 w-5" }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z" />
    </svg>
  );
}

function IconCam({ className = "h-5 w-5" }) {
  return <IconVideo className={className} />;
}

function IconCamOff({ className = "h-5 w-5" }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
    </svg>
  );
}

function IconEnd({ className = "h-5 w-5" }) {
  return <IconPhone className={className} />;
}

export default function ChatCallOverlay({
  isOpen,
  phase, // "outgoing_ringing" | "incoming_ringing" | "in_call"
  mode, // "voice" | "video"
  peerName,
  peerAvatarUrl,
  isMicOn,
  isCamOn,
  onAccept,
  onDecline,
  onCancel,
  onToggleMic,
  onToggleCam,
  onEnd,
  onDebugAcceptOutgoing,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (phase === "incoming_ringing") onDecline?.();
        else if (phase === "outgoing_ringing") onCancel?.();
        else onEnd?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, phase, onCancel, onDecline, onEnd]);

  if (!isOpen) return null;

  const title =
    phase === "incoming_ringing"
      ? `Incoming ${mode === "video" ? "video" : "voice"} call`
      : phase === "outgoing_ringing"
        ? `Calling…`
        : `In call`;

  const subtitle =
    phase === "incoming_ringing"
      ? "Accept or decline."
      : phase === "outgoing_ringing"
        ? "Waiting for recipient to accept (signaling not wired yet)."
        : "Controls are local-only for now.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-7 pb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#65676b]">{title}</p>
          <div className="mx-auto mt-6 h-24 w-24 overflow-hidden rounded-full bg-[#f0f2f5] ring-2 ring-black/5">
            {peerAvatarUrl ? (
              <img src={peerAvatarUrl} alt={peerName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#65676b]">
                {(peerName || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <p className="mt-4 truncate text-lg font-bold text-[#1c1e21]">{peerName || "Unknown"}</p>
          <p className="mt-1 text-sm text-[#65676b]">{subtitle}</p>
        </div>

        {phase === "in_call" ? (
          <div className="border-t border-[#e4e6eb] px-6 py-5">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={onToggleMic}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isMicOn ? "bg-[#f0f2f5] text-[#1c1e21]" : "bg-red-50 text-red-600"
                }`}
              >
                {isMicOn ? <IconMic /> : <IconMicOff />}
                {isMicOn ? "Mic" : "Off"}
              </button>

              <button
                type="button"
                onClick={onToggleCam}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isCamOn
                    ? "bg-[#f0f2f5] text-[#1c1e21]"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {isCamOn ? <IconCam /> : <IconCamOff />}
                {isCamOn ? "Cam" : "Off"}
              </button>

              <button
                type="button"
                onClick={onEnd}
                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <IconEnd />
                End
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-[#e4e6eb] px-6 py-5">
            {phase === "incoming_ringing" ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onDecline}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#e4e6eb] bg-white px-4 py-3 text-sm font-semibold text-[#1c1e21] transition hover:bg-[#f0f2f5]"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={onAccept}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  {mode === "video" ? <IconVideo /> : <IconPhone />}
                  Accept
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <IconEnd />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDebugAcceptOutgoing}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  {mode === "video" ? <IconVideo /> : <IconPhone />}
                  Simulate accept
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

