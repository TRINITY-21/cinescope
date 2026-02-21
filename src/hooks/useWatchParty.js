import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import DOMPurify from 'dompurify';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function makePeerId(code) {
  return `bynge-${code}`;
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// Downscale a screen capture stream to target resolution via canvas
function createScaledStream(originalStream, maxWidth = 1280, maxHeight = 720, fps = 24) {
  const videoTrack = originalStream.getVideoTracks()[0];
  if (!videoTrack) return originalStream;

  const settings = videoTrack.getSettings();
  const srcW = settings.width || 1920;
  const srcH = settings.height || 1080;

  // Skip if already small enough
  if (srcW <= maxWidth && srcH <= maxHeight) return originalStream;

  const scale = Math.min(maxWidth / srcW, maxHeight / srcH);
  const outW = Math.round(srcW * scale);
  const outH = Math.round(srcH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');

  const video = document.createElement('video');
  video.srcObject = new MediaStream([videoTrack]);
  video.muted = true;
  video.play();

  let animId;
  function draw() {
    if (videoTrack.readyState === 'ended') { cancelAnimationFrame(animId); return; }
    ctx.drawImage(video, 0, 0, outW, outH);
    animId = requestAnimationFrame(draw);
  }
  draw();

  const scaledStream = canvas.captureStream(fps);

  // Carry over audio from original
  for (const audioTrack of originalStream.getAudioTracks()) {
    scaledStream.addTrack(audioTrack);
  }

  // When original video track stops, stop the canvas loop
  videoTrack.addEventListener('ended', () => {
    cancelAnimationFrame(animId);
    scaledStream.getTracks().forEach((t) => t.stop());
  });

  // Keep reference so we can stop the original track on cleanup
  scaledStream._originalVideoTrack = videoTrack;
  scaledStream._animId = animId;

  return scaledStream;
}

// Apply bitrate cap with retry (SDP negotiation may not be done on first try)
function capBitrate(mediaCall, bitrate = 1_200_000, maxRetries = 3) {
  let attempt = 0;
  function tryApply() {
    try {
      const pc = mediaCall.peerConnection;
      if (!pc) return;
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (!sender) { retry(); return; }
      const params = sender.getParameters();
      if (!params.encodings || params.encodings.length === 0) { retry(); return; }
      params.encodings[0].maxBitrate = bitrate;
      params.encodings[0].maxFramerate = 24;
      sender.setParameters(params);
    } catch { retry(); }
  }
  function retry() {
    attempt++;
    if (attempt < maxRetries) setTimeout(tryApply, 1500);
  }
  tryApply();
}

export function useWatchParty() {
  const [status, setStatus] = useState('idle');
  const [role, setRole] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [queue, setQueue] = useState([]);

  const peerRef = useRef(null);
  const connectionsRef = useRef([]);
  const mediaConnectionsRef = useRef([]);
  const localStreamRef = useRef(null);
  const guestDataConnRef = useRef(null);
  const cleanedUpRef = useRef(false);
  const queueRef = useRef([]);

  // Keep queueRef in sync for use in connection handlers
  useEffect(() => { queueRef.current = queue; }, [queue]);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addReaction = useCallback((reaction) => {
    const reactionWithPosition = {
      ...reaction,
      x: 10 + Math.random() * 80, // random horizontal position (10-90%)
    };
    setReactions((prev) => [...prev, reactionWithPosition]);
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 3000);
  }, []);

  const broadcastMessage = useCallback((msg, excludePeerId = null) => {
    for (const conn of connectionsRef.current) {
      if (conn.open && conn.peer !== excludePeerId) {
        try { conn.send(msg); } catch { /* connection may have closed */ }
      }
    }
  }, []);

  const broadcastSystemMessage = useCallback((text) => {
    const msg = {
      type: 'system',
      id: makeId('sys'),
      text,
      timestamp: Date.now(),
    };
    addMessage(msg);
    broadcastMessage(msg);
  }, [addMessage, broadcastMessage]);

  // Handle incoming data messages (shared between host and guest)
  const handleDataMessage = useCallback((data, isHost = false, senderPeerId = null) => {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'chat':
        addMessage(data);
        if (isHost) broadcastMessage(data, senderPeerId);
        break;

      case 'system':
        addMessage(data);
        break;

      case 'reaction':
        addReaction(data);
        if (isHost) broadcastMessage(data, senderPeerId);
        break;

      case 'queue-add':
        setQueue((prev) => {
          if (prev.some((item) => item.id === data.item.id)) return prev;
          return [...prev, data.item];
        });
        if (isHost) broadcastMessage(data, senderPeerId);
        break;

      case 'queue-vote':
        setQueue((prev) =>
          prev.map((item) => {
            if (item.id !== data.itemId) return item;
            const newVotes = { ...item.votes, [data.voterPeerId]: data.vote };
            return { ...item, votes: newVotes };
          })
        );
        if (isHost) broadcastMessage(data, senderPeerId);
        break;

      case 'queue-remove':
        setQueue((prev) => prev.filter((item) => item.id !== data.itemId));
        if (isHost) broadcastMessage(data, senderPeerId);
        break;

      case 'queue-sync':
        setQueue(data.queue || []);
        break;

      default:
        break;
    }
  }, [addMessage, addReaction, broadcastMessage]);

  const setupHostConnectionHandler = useCallback((dataConn) => {
    dataConn.on('open', () => {
      connectionsRef.current.push(dataConn);
      setParticipants((prev) => [...prev, { peerId: dataConn.peer, joinedAt: Date.now() }]);

      broadcastSystemMessage('A guest joined the party');

      // Sync current queue state to new guest
      if (queueRef.current.length > 0) {
        try {
          dataConn.send({ type: 'queue-sync', queue: queueRef.current });
        } catch { /* ignore */ }
      }

      // Send the media stream to the new guest
      if (localStreamRef.current && peerRef.current) {
        const mediaCall = peerRef.current.call(dataConn.peer, localStreamRef.current);
        if (mediaCall) {
          mediaConnectionsRef.current.push(mediaCall);
          // Cap bitrate with retry (waits for SDP negotiation to complete)
          capBitrate(mediaCall, 1_200_000);
        }
      }
    });

    dataConn.on('data', (data) => {
      handleDataMessage(data, true, dataConn.peer);
    });

    dataConn.on('close', () => {
      connectionsRef.current = connectionsRef.current.filter((c) => c.peer !== dataConn.peer);
      mediaConnectionsRef.current = mediaConnectionsRef.current.filter((mc) => {
        if (mc.peer === dataConn.peer) { mc.close(); return false; }
        return true;
      });
      setParticipants((prev) => prev.filter((p) => p.peerId !== dataConn.peer));
      broadcastSystemMessage('A guest left the party');
    });
  }, [broadcastSystemMessage, handleDataMessage]);

  const leaveParty = useCallback(() => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    if (localStreamRef.current) {
      // Stop the scaled stream's original video track if it exists
      if (localStreamRef.current._originalVideoTrack) {
        try { localStreamRef.current._originalVideoTrack.stop(); } catch { /* ignore */ }
      }
      if (localStreamRef.current._animId) {
        cancelAnimationFrame(localStreamRef.current._animId);
      }
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    for (const conn of connectionsRef.current) {
      try { conn.close(); } catch { /* ignore */ }
    }
    connectionsRef.current = [];

    for (const mc of mediaConnectionsRef.current) {
      try { mc.close(); } catch { /* ignore */ }
    }
    mediaConnectionsRef.current = [];

    if (guestDataConnRef.current) {
      try { guestDataConnRef.current.close(); } catch { /* ignore */ }
      guestDataConnRef.current = null;
    }

    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch { /* ignore */ }
      peerRef.current = null;
    }

    setStatus('idle');
    setRole(null);
    setRoomCode(null);
    setRemoteStream(null);
    setLocalStream(null);
    setParticipants([]);
    setMessages([]);
    setError(null);
    setReactions([]);
    setQueue([]);
  }, []);

  const createParty = useCallback(async () => {
    cleanedUpRef.current = false;
    setStatus('creating');
    setRole('host');
    setError(null);
    setMessages([]);
    setReactions([]);
    setQueue([]);

    const code = generateRoomCode();
    const peerId = makePeerId(code);

    try {
      const peer = new Peer(peerId);
      peerRef.current = peer;

      await new Promise((resolve, reject) => {
        peer.on('open', () => resolve());
        peer.on('error', (err) => reject(err));
      });

      setRoomCode(code);

      let rawStream;
      try {
        rawStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true,
        });
      } catch {
        peer.destroy();
        peerRef.current = null;
        setStatus('error');
        setRole(null);
        setError('Screen sharing is required to host a party. Please allow screen sharing and try again.');
        return;
      }

      // Downscale to 720p via canvas (browsers ignore getDisplayMedia resolution hints)
      const stream = createScaledStream(rawStream, 1280, 720, 24);

      // Set content hint for video encoding optimization
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.contentHint = 'motion';
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Stop when the original capture ends (user clicks browser's "stop sharing")
      const originalTrack = rawStream.getVideoTracks()[0];
      if (originalTrack) {
        originalTrack.addEventListener('ended', () => {
          leaveParty();
        });
      }

      peer.on('connection', (dataConn) => {
        setupHostConnectionHandler(dataConn);
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          setError('Room creation failed. Please try again.');
          setStatus('error');
        }
      });

      peer.on('disconnected', () => {
        try { peer.reconnect(); } catch { /* ignore */ }
      });

      setStatus('connected');
    } catch (err) {
      setStatus('error');
      setRole(null);
      setError(err.message || 'Failed to create party. Please try again.');
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    }
  }, [leaveParty, setupHostConnectionHandler]);

  const joinParty = useCallback(async (code) => {
    cleanedUpRef.current = false;
    setStatus('joining');
    setRole('guest');
    setError(null);
    setMessages([]);
    setReactions([]);
    setQueue([]);

    const hostPeerId = makePeerId(code.toUpperCase());

    try {
      const peer = new Peer();
      peerRef.current = peer;

      await new Promise((resolve, reject) => {
        peer.on('open', () => resolve());
        peer.on('error', (err) => reject(err));
      });

      const dataConn = peer.connect(hostPeerId, { reliable: true });
      guestDataConnRef.current = dataConn;

      dataConn.on('open', () => {
        setRoomCode(code.toUpperCase());
        setStatus('connected');
      });

      dataConn.on('data', (data) => {
        handleDataMessage(data, false);
      });

      dataConn.on('close', () => {
        setRemoteStream(null);
        setError('The host ended the party.');
        setStatus('error');
      });

      dataConn.on('error', () => {
        setError('Connection to host lost.');
        setStatus('error');
      });

      peer.on('call', (mediaCall) => {
        mediaCall.answer();
        mediaCall.on('stream', (stream) => {
          setRemoteStream(stream);
        });
        mediaCall.on('close', () => {
          setRemoteStream(null);
        });
      });

      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
          setError('Room not found. Check your code and try again.');
        } else if (err.type === 'network') {
          setError('Network error. Check your connection.');
        } else if (err.type === 'server-error') {
          setError('Connection server is unavailable. Try again later.');
        } else {
          setError(err.message || 'Connection failed.');
        }
        setStatus('error');
      });

      peer.on('disconnected', () => {
        try { peer.reconnect(); } catch { /* ignore */ }
      });
    } catch (err) {
      setStatus('error');
      setRole(null);
      setError(err.message || 'Failed to join party. Please try again.');
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    }
  }, [handleDataMessage]);

  const sendMessage = useCallback((text) => {
    const sanitized = DOMPurify.sanitize(text.trim());
    if (!sanitized) return;

    const shortId = peerRef.current?.id?.slice(-4) || '????';
    const msg = {
      type: 'chat',
      id: makeId('msg'),
      sender: role === 'host' ? 'Host' : `Guest-${shortId}`,
      senderRole: role,
      text: sanitized,
      timestamp: Date.now(),
    };

    addMessage(msg);

    if (role === 'host') {
      broadcastMessage(msg);
    } else if (guestDataConnRef.current?.open) {
      try { guestDataConnRef.current.send(msg); } catch { /* ignore */ }
    }
  }, [role, addMessage, broadcastMessage]);

  const sendReaction = useCallback((emoji) => {
    const shortId = peerRef.current?.id?.slice(-4) || '????';
    const reaction = {
      type: 'reaction',
      id: makeId('rxn'),
      emoji,
      sender: role === 'host' ? 'Host' : `Guest-${shortId}`,
      timestamp: Date.now(),
    };

    addReaction(reaction);

    if (role === 'host') {
      broadcastMessage(reaction);
    } else if (guestDataConnRef.current?.open) {
      try { guestDataConnRef.current.send(reaction); } catch { /* ignore */ }
    }
  }, [role, addReaction, broadcastMessage]);

  const addToQueue = useCallback((item) => {
    const shortId = peerRef.current?.id?.slice(-4) || '????';
    const queueItem = {
      ...item,
      id: item.id || makeId('q'),
      addedBy: role === 'host' ? 'Host' : `Guest-${shortId}`,
      votes: {},
      timestamp: Date.now(),
    };

    const msg = { type: 'queue-add', item: queueItem };

    setQueue((prev) => {
      if (prev.some((existing) => existing.tmdbId === queueItem.tmdbId && existing.mediaType === queueItem.mediaType)) {
        return prev;
      }
      return [...prev, queueItem];
    });

    if (role === 'host') {
      broadcastMessage(msg);
    } else if (guestDataConnRef.current?.open) {
      try { guestDataConnRef.current.send(msg); } catch { /* ignore */ }
    }
  }, [role, broadcastMessage]);

  const voteOnQueue = useCallback((itemId, vote) => {
    const peerId = peerRef.current?.id || 'unknown';
    const shortId = peerId.slice(-4);

    const msg = {
      type: 'queue-vote',
      id: makeId('vote'),
      itemId,
      vote,
      voter: role === 'host' ? 'Host' : `Guest-${shortId}`,
      voterPeerId: peerId,
      timestamp: Date.now(),
    };

    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newVotes = { ...item.votes, [peerId]: vote };
        return { ...item, votes: newVotes };
      })
    );

    if (role === 'host') {
      broadcastMessage(msg);
    } else if (guestDataConnRef.current?.open) {
      try { guestDataConnRef.current.send(msg); } catch { /* ignore */ }
    }
  }, [role, broadcastMessage]);

  const removeFromQueue = useCallback((itemId) => {
    const msg = { type: 'queue-remove', id: makeId('qrm'), itemId, timestamp: Date.now() };

    setQueue((prev) => prev.filter((item) => item.id !== itemId));

    if (role === 'host') {
      broadcastMessage(msg);
    } else if (guestDataConnRef.current?.open) {
      try { guestDataConnRef.current.send(msg); } catch { /* ignore */ }
    }
  }, [role, broadcastMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanedUpRef.current = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      for (const conn of connectionsRef.current) {
        try { conn.close(); } catch { /* ignore */ }
      }
      for (const mc of mediaConnectionsRef.current) {
        try { mc.close(); } catch { /* ignore */ }
      }
      if (guestDataConnRef.current) {
        try { guestDataConnRef.current.close(); } catch { /* ignore */ }
      }
      if (peerRef.current) {
        try { peerRef.current.destroy(); } catch { /* ignore */ }
      }
    };
  }, []);

  const canHost = typeof navigator?.mediaDevices?.getDisplayMedia === 'function';

  return {
    status,
    role,
    roomCode,
    remoteStream,
    localStream,
    participants,
    messages,
    error,
    canHost,
    reactions,
    queue,
    createParty,
    joinParty,
    sendMessage,
    sendReaction,
    addToQueue,
    voteOnQueue,
    removeFromQueue,
    leaveParty,
  };
}
