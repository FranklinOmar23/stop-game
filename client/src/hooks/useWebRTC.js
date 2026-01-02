import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from './useSocket';

export const useWebRTC = (roomCode, playerName) => {
  const { socket, emit, on, off } = useSocket();
  const [peers, setPeers] = useState({}); // { peerId: { peer, stream, name, isMuted } }
  const [isInVoiceChat, setIsInVoiceChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  
  const localStreamRef = useRef(null);
  const peersRef = useRef({});

  // Obtener stream de audio local
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Error getting media:', err);
      setError('No se pudo acceder al micrófono. Verifica los permisos.');
      throw err;
    }
  }, []);

  // Crear peer para un jugador
  const createPeer = useCallback((peerId, peerName, initiator, stream) => {
    const peer = new SimplePeer({
      initiator,
      stream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      }
    });

    peer.on('signal', signal => {
      emit('webrtc:signal', {
        to: peerId,
        signal,
        from: socket.id
      });
    });

    peer.on('stream', remoteStream => {
      console.log(`📻 Received stream from ${peerName}`);
      
      setPeers(prev => ({
        ...prev,
        [peerId]: {
          ...prev[peerId],
          stream: remoteStream,
          name: peerName
        }
      }));

      // Reproducir stream
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play().catch(err => console.error('Error playing audio:', err));
    });

    peer.on('error', err => {
      console.error(`Peer error with ${peerId}:`, err);
    });

    peer.on('close', () => {
      console.log(`Peer closed: ${peerId}`);
      removePeer(peerId);
    });

    peersRef.current[peerId] = { peer, name: peerName };
    
    setPeers(prev => ({
      ...prev,
      [peerId]: {
        peer,
        stream: null,
        name: peerName,
        isMuted: false
      }
    }));

    return peer;
  }, [socket, emit]);

  // Remover peer
  const removePeer = useCallback((peerId) => {
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].peer.destroy();
      delete peersRef.current[peerId];
    }
    
    setPeers(prev => {
      const newPeers = { ...prev };
      delete newPeers[peerId];
      return newPeers;
    });
  }, []);

  // Unirse al chat de voz
  const joinVoiceChat = useCallback(async () => {
    try {
      setError(null);
      const stream = await getLocalStream();
      
      // Notificar al servidor
      emit('webrtc:join-voice', { roomCode });
      
      setIsInVoiceChat(true);
      console.log('🎤 Joined voice chat');
      
    } catch (err) {
      console.error('Failed to join voice chat:', err);
      setError('No se pudo acceder al micrófono');
    }
  }, [roomCode, emit, getLocalStream]);

  // Salir del chat de voz
  const leaveVoiceChat = useCallback(() => {
    // Detener stream local
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Cerrar todas las conexiones peer
    Object.keys(peersRef.current).forEach(peerId => {
      peersRef.current[peerId].peer.destroy();
    });

    peersRef.current = {};
    setPeers({});
    
    emit('webrtc:leave-voice', { roomCode });
    setIsInVoiceChat(false);
    
    console.log('🔇 Left voice chat');
  }, [roomCode, emit]);

  // Mutear/desmutear
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Escuchar eventos WebRTC
  useEffect(() => {
    if (!socket || !isInVoiceChat) return;

    // Cuando un nuevo peer se une
    const handlePeerJoined = ({ peerId, peerName }) => {
      console.log(`👤 Peer joined: ${peerName} (${peerId})`);
      
      // Solo crear conexión si el stream local existe
      if (localStreamRef.current) {
        createPeer(peerId, peerName, true, localStreamRef.current);
      }
    };

    // Cuando recibimos señal de otro peer
    const handleSignal = ({ from, signal }) => {
      console.log(`📡 Received signal from ${from}`);
      
      if (peersRef.current[from]) {
        // Ya existe el peer, solo procesar la señal
        peersRef.current[from].peer.signal(signal);
      } else {
        // Crear nuevo peer (no iniciador)
        if (localStreamRef.current) {
          const peer = createPeer(from, 'Jugador', false, localStreamRef.current);
          peer.signal(signal);
        }
      }
    };

    // Cuando un peer se va
    const handlePeerLeft = ({ peerId }) => {
      console.log(`👋 Peer left: ${peerId}`);
      removePeer(peerId);
    };

    on('webrtc:peer-joined', handlePeerJoined);
    on('webrtc:signal', handleSignal);
    on('webrtc:peer-left', handlePeerLeft);

    return () => {
      off('webrtc:peer-joined', handlePeerJoined);
      off('webrtc:signal', handleSignal);
      off('webrtc:peer-left', handlePeerLeft);
    };
  }, [socket, isInVoiceChat, createPeer, removePeer, on, off]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (isInVoiceChat) {
        leaveVoiceChat();
      }
    };
  }, []);

  return {
    joinVoiceChat,
    leaveVoiceChat,
    toggleMute,
    peers: Object.values(peers),
    isInVoiceChat,
    isMuted,
    error,
    peerCount: Object.keys(peers).length
  };
};