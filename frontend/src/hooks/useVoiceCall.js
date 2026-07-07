import { useCallback, useEffect, useRef, useState } from "react";

import { getAuthenticatedSocket } from "../lib/socket.js";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  // TURN servers — relay audio when peer-to-peer fails (e.g. across different networks)
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const INITIAL_CALL_STATE = {
  isOpen: false,
  phase: "outgoing_ringing",
  mode: "voice",
  callId: "",
  conversationId: "",
  peerUserId: "",
  peerName: "",
  peerAvatarUrl: "",
  isMicOn: true,
  isCamOn: false,
  error: "",
};

function createCallId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getMediaErrorMessage(error) {
  if (error?.name === "NotAllowedError") return "Microphone permission was denied.";
  if (error?.name === "NotFoundError") return "No microphone was found.";
  return error?.message || "Could not start microphone.";
}

export function useVoiceCall({ currentUser } = {}) {
  const [callState, setCallState] = useState(INITIAL_CALL_STATE);
  const [remoteStream, setRemoteStream] = useState(null);
  const callStateRef = useRef(INITIAL_CALL_STATE);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const emitCallEvent = useCallback((eventName, payload = {}) => {
    const socket = getAuthenticatedSocket();
    if (!socket) return;
    socket.emit(eventName, payload);
  }, []);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, []);

  const closePeerConnection = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    pendingIceCandidatesRef.current = [];
    setRemoteStream(null);
  }, []);

  const resetCall = useCallback(() => {
    closePeerConnection();
    stopLocalStream();
    setCallState(INITIAL_CALL_STATE);
  }, [closePeerConnection, stopLocalStream]);

  const ensureLocalAudioStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser does not support microphone calls.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const applyPendingIceCandidates = useCallback(async (peerConnection) => {
    const pendingCandidates = pendingIceCandidatesRef.current;
    pendingIceCandidatesRef.current = [];

    for (const candidate of pendingCandidates) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch {
        // ICE candidates can arrive out of order; ignore stale candidates.
      }
    }
  }, []);

  const getPeerConnection = useCallback(async () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionRef.current = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) return;
      const currentCall = callStateRef.current;
      if (!currentCall.callId || !currentCall.conversationId || !currentCall.peerUserId) return;

      emitCallEvent("call:ice_candidate", {
        callId: currentCall.callId,
        conversationId: currentCall.conversationId,
        targetUserId: currentCall.peerUserId,
        mode: "voice",
        candidate: event.candidate,
      });
    };

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) setRemoteStream(stream);
    };

    const localStream = await ensureLocalAudioStream();
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    return peerConnection;
  }, [emitCallEvent, ensureLocalAudioStream]);

  const sendOffer = useCallback(async () => {
    const currentCall = callStateRef.current;
    if (!currentCall.callId || !currentCall.conversationId || !currentCall.peerUserId) return;

    const peerConnection = await getPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    emitCallEvent("call:offer", {
      callId: currentCall.callId,
      conversationId: currentCall.conversationId,
      targetUserId: currentCall.peerUserId,
      mode: "voice",
      offer,
    });
  }, [emitCallEvent, getPeerConnection]);

  const startVoiceCall = useCallback(async (chat) => {
    if (!chat || chat.type === "group") return;

    const peerUserId = chat.friendId ?? chat.otherUserId;
    if (!peerUserId) return;

    closePeerConnection();
    stopLocalStream();

    const callId = createCallId();
    const nextState = {
      ...INITIAL_CALL_STATE,
      isOpen: true,
      phase: "outgoing_ringing",
      callId,
      conversationId: chat.id || chat.conversationId,
      peerUserId: String(peerUserId),
      peerName: chat.name || "",
      peerAvatarUrl: chat.profilePic || chat.avatarUrl || "",
    };

    setCallState(nextState);

    try {
      await ensureLocalAudioStream();
      emitCallEvent("call:invite", {
        callId,
        conversationId: nextState.conversationId,
        targetUserId: nextState.peerUserId,
        mode: "voice",
        callerName: currentUser?.displayName || currentUser?.name || "",
        callerAvatarUrl: currentUser?.avatarUrl || currentUser?.profilePic || "",
      });
    } catch (error) {
      resetCall();
      setCallState({
        ...INITIAL_CALL_STATE,
        isOpen: true,
        phase: "outgoing_ringing",
        peerName: chat.name || "",
        peerAvatarUrl: chat.profilePic || chat.avatarUrl || "",
        error: getMediaErrorMessage(error),
      });
    }
  }, [closePeerConnection, currentUser, emitCallEvent, ensureLocalAudioStream, resetCall, stopLocalStream]);

  const acceptCall = useCallback(async () => {
    const currentCall = callStateRef.current;
    if (!currentCall.callId || !currentCall.conversationId || !currentCall.peerUserId) return;

    try {
      await ensureLocalAudioStream();
      setCallState((prev) => ({ ...prev, phase: "in_call", isOpen: true, error: "" }));
      emitCallEvent("call:accept", {
        callId: currentCall.callId,
        conversationId: currentCall.conversationId,
        targetUserId: currentCall.peerUserId,
        mode: "voice",
      });
    } catch (error) {
      setCallState((prev) => ({ ...prev, error: getMediaErrorMessage(error) }));
      emitCallEvent("call:decline", {
        callId: currentCall.callId,
        conversationId: currentCall.conversationId,
        targetUserId: currentCall.peerUserId,
        mode: "voice",
      });
    }
  }, [emitCallEvent, ensureLocalAudioStream]);

  const cancelOutgoingCall = useCallback(() => {
    const currentCall = callStateRef.current;
    if (currentCall.callId && currentCall.conversationId && currentCall.peerUserId) {
      emitCallEvent("call:cancel", {
        callId: currentCall.callId,
        conversationId: currentCall.conversationId,
        targetUserId: currentCall.peerUserId,
        mode: "voice",
      });
    }
    resetCall();
  }, [emitCallEvent, resetCall]);

  const declineCall = useCallback(() => {
    const currentCall = callStateRef.current;
    if (currentCall.callId && currentCall.conversationId && currentCall.peerUserId) {
      emitCallEvent("call:decline", {
        callId: currentCall.callId,
        conversationId: currentCall.conversationId,
        targetUserId: currentCall.peerUserId,
        mode: "voice",
      });
    }
    resetCall();
  }, [emitCallEvent, resetCall]);

  const endCall = useCallback(() => {
    const currentCall = callStateRef.current;
    if (currentCall.callId && currentCall.conversationId && currentCall.peerUserId) {
      emitCallEvent("call:end", {
        callId: currentCall.callId,
        conversationId: currentCall.conversationId,
        targetUserId: currentCall.peerUserId,
        mode: "voice",
      });
    }
    resetCall();
  }, [emitCallEvent, resetCall]);

  const toggleMic = useCallback(() => {
    setCallState((prev) => {
      const nextMicOn = !prev.isMicOn;
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = nextMicOn;
      });
      return { ...prev, isMicOn: nextMicOn };
    });
  }, []);

  useEffect(() => {
    const socket = getAuthenticatedSocket();
    if (!socket) return undefined;

    const handleIncomingCall = (payload = {}) => {
      if (!payload.callId || !payload.conversationId || !payload.fromUserId) return;
      const currentCall = callStateRef.current;

      if (currentCall.isOpen && currentCall.callId !== payload.callId) {
        emitCallEvent("call:decline", {
          callId: payload.callId,
          conversationId: payload.conversationId,
          targetUserId: payload.fromUserId,
          mode: "voice",
        });
        return;
      }

      setCallState({
        ...INITIAL_CALL_STATE,
        isOpen: true,
        phase: "incoming_ringing",
        callId: String(payload.callId),
        conversationId: String(payload.conversationId),
        peerUserId: String(payload.fromUserId),
        peerName: payload.callerName || "Unknown",
        peerAvatarUrl: payload.callerAvatarUrl || "",
      });
    };

    const handleAccepted = async (payload = {}) => {
      const currentCall = callStateRef.current;
      if (!payload.callId || payload.callId !== currentCall.callId) return;

      setCallState((prev) => ({
        ...prev,
        phase: "in_call",
        peerUserId: String(payload.fromUserId || prev.peerUserId),
        error: "",
      }));

      try {
        await sendOffer();
      } catch (error) {
        setCallState((prev) => ({ ...prev, error: error.message || "Could not connect call." }));
      }
    };

    const handleOffer = async (payload = {}) => {
      const currentCall = callStateRef.current;
      if (!payload.callId || payload.callId !== currentCall.callId || !payload.offer) return;

      try {
        const peerConnection = await getPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));
        await applyPendingIceCandidates(peerConnection);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        emitCallEvent("call:answer", {
          callId: currentCall.callId,
          conversationId: currentCall.conversationId,
          targetUserId: currentCall.peerUserId,
          mode: "voice",
          answer,
        });
      } catch (error) {
        setCallState((prev) => ({ ...prev, error: error.message || "Could not answer call." }));
      }
    };

    const handleAnswer = async (payload = {}) => {
      const currentCall = callStateRef.current;
      if (!payload.callId || payload.callId !== currentCall.callId || !payload.answer) return;

      try {
        const peerConnection = await getPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
        await applyPendingIceCandidates(peerConnection);
      } catch (error) {
        setCallState((prev) => ({ ...prev, error: error.message || "Could not connect audio." }));
      }
    };

    const handleIceCandidate = async (payload = {}) => {
      const currentCall = callStateRef.current;
      if (!payload.callId || payload.callId !== currentCall.callId || !payload.candidate) return;

      const candidate = new RTCIceCandidate(payload.candidate);
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection?.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await peerConnection.addIceCandidate(candidate);
      } catch {
        // Ignore stale ICE candidates from closed or renegotiated calls.
      }
    };

    const handleRemoteClose = (payload = {}) => {
      const currentCall = callStateRef.current;
      if (!payload.callId || payload.callId !== currentCall.callId) return;
      resetCall();
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:accepted", handleAccepted);
    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice_candidate", handleIceCandidate);
    socket.on("call:declined", handleRemoteClose);
    socket.on("call:cancelled", handleRemoteClose);
    socket.on("call:ended", handleRemoteClose);
    socket.on("call:missed", handleRemoteClose);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:accepted", handleAccepted);
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice_candidate", handleIceCandidate);
      socket.off("call:declined", handleRemoteClose);
      socket.off("call:cancelled", handleRemoteClose);
      socket.off("call:ended", handleRemoteClose);
      socket.off("call:missed", handleRemoteClose);
    };
  }, [applyPendingIceCandidates, emitCallEvent, getPeerConnection, resetCall, sendOffer]);

  // ── Emit call:end before browser tab/window closes ──────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentCall = callStateRef.current;
      if (!currentCall.isOpen || !currentCall.callId) return;
      const socket = getAuthenticatedSocket();
      if (!socket?.connected) return;
      socket.emit("call:end", {
        callId: currentCall.callId,
        conversationId: currentCall.conversationId,
        targetUserId: currentCall.peerUserId,
        mode: currentCall.mode || "voice",
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []); // callStateRef is a stable ref — no deps needed

  // ── Reset call state on socket disconnect (network loss / server restart) ──
  useEffect(() => {
    const socket = getAuthenticatedSocket();
    if (!socket) return undefined;

    const handleSocketDisconnect = () => {
      // Backend will notify the peer via its disconnect handler.
      // We just clean up local state so the overlay closes on our side.
      if (callStateRef.current.isOpen) {
        closePeerConnection();
        stopLocalStream();
        setCallState(INITIAL_CALL_STATE);
      }
    };

    socket.on("disconnect", handleSocketDisconnect);
    return () => socket.off("disconnect", handleSocketDisconnect);
  }, [closePeerConnection, stopLocalStream]);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      closePeerConnection();
      stopLocalStream();
    };
  }, [closePeerConnection, stopLocalStream]);

  return {
    callState,
    remoteStream,
    startVoiceCall,
    acceptCall,
    cancelOutgoingCall,
    declineCall,
    endCall,
    toggleMic,
  };
}
