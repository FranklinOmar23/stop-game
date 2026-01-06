import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import { useSocket } from './useSocket';

export const useWebRTC = (roomCode, playerName) => {
  const { socket, emit, on, off } = useSocket();
  const [peers, setPeers] = useState({});
  const [isInVoiceChat, setIsInVoiceChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [myPeerId, setMyPeerId] = useState(null);
  
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const callsRef = useRef({});
  const audioElementsRef = useRef({}); // ← NUEVO: Referencias a elementos de audio
  const retryTimeoutsRef = useRef({});

  // Inicializar PeerJS
  useEffect(() => {
    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      }
    });

    peer.on('open', (id) => {
      console.log('✅ My peer ID:', id);
      setMyPeerId(id);
      peerRef.current = peer;
    });

    peer.on('call', (call) => {
      console.log('📞 Receiving call from:', call.peer);
      
      if (localStreamRef.current) {
        call.answer(localStreamRef.current);
        
        call.on('stream', (remoteStream) => {
          console.log('📻 Received stream from:', call.peer);
          handleRemoteStream(call.peer, remoteStream);
        });

        call.on('close', () => {
          console.log('Call closed from:', call.peer);
          removePeer(call.peer);
        });

        callsRef.current[call.peer] = call;
      }
    });

    peer.on('error', (err) => {
      console.error('❌ PeerJS error:', err);
      if (err.type !== 'peer-unavailable') {
        setError('Error de conexión P2P');
      }
    });

    return () => {
      peer.destroy();
      Object.values(retryTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Obtener stream local
  const getLocalStream = useCallback(async () => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: false
      };

      console.log('🎤 Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      localStreamRef.current = stream;
      console.log('✅ Local stream obtained');
      
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('🎤 Audio track:', {
          enabled: audioTrack.enabled,
          muted: audioTrack.muted,
          readyState: audioTrack.readyState
        });
      }
      
      return stream;
    } catch (err) {
      console.error('❌ Error getting media:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Permisos de micrófono denegados');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró micrófono');
      } else {
        setError('No se pudo acceder al micrófono');
      }
      
      throw err;
    }
  }, []);

  // Manejar stream remoto - CORREGIDO
  const handleRemoteStream = useCallback((peerId, stream, peerName = 'Jugador') => {
    console.log('🔊 Setting up remote stream for:', peerId, peerName);
    
    // Si ya existe un audio element para este peer, detenerlo
    if (audioElementsRef.current[peerId]) {
      console.log('♻️ Cleaning up existing audio for:', peerId);
      const oldAudio = audioElementsRef.current[peerId];
      oldAudio.pause();
      oldAudio.srcObject = null;
      delete audioElementsRef.current[peerId];
    }

    // Crear nuevo elemento de audio
    const audio = new Audio();
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.playsInline = true; // Importante para iOS
    audio.volume = 1.0;

    // Intentar reproducir
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Audio playing for:', peerName);
        })
        .catch(error => {
          console.warn('⚠️ Autoplay blocked for:', peerName);
          
          // Guardar para reproducir con interacción del usuario
          if (!window.pendingAudioStreams) {
            window.pendingAudioStreams = new Map();
          }
          window.pendingAudioStreams.set(peerId, { audio, peerId, peerName });
        });
    }

    // Guardar referencia
    audioElementsRef.current[peerId] = audio;

    // Actualizar estado
    setPeers(prev => ({
      ...prev,
      [peerId]: {
        stream,
        name: peerName,
        isMuted: false,
        audio // Pasar referencia para control de volumen
      }
    }));
  }, []);

  // Remover peer - MEJORADO
  const removePeer = useCallback((peerId) => {
    console.log('❌ Removing peer:', peerId);
    
    // Cerrar llamada
    if (callsRef.current[peerId]) {
      callsRef.current[peerId].close();
      delete callsRef.current[peerId];
    }

    // Detener y limpiar audio
    if (audioElementsRef.current[peerId]) {
      const audio = audioElementsRef.current[peerId];
      audio.pause();
      audio.srcObject = null;
      delete audioElementsRef.current[peerId];
    }

    // Limpiar timeout de reintento
    if (retryTimeoutsRef.current[peerId]) {
      clearTimeout(retryTimeoutsRef.current[peerId]);
      delete retryTimeoutsRef.current[peerId];
    }

    // Limpiar de pending
    if (window.pendingAudioStreams) {
      window.pendingAudioStreams.delete(peerId);
    }

    // Actualizar estado
    setPeers(prev => {
      const newPeers = { ...prev };
      delete newPeers[peerId];
      return newPeers;
    });
  }, []);

  // Llamar a un peer con reintentos - MEJORADO
  const callPeer = useCallback((peerId, peerName, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000;

    if (!peerRef.current || !localStreamRef.current) {
      console.log('⚠️ Cannot call peer, missing requirements');
      return;
    }

    if (callsRef.current[peerId]) {
      console.log('ℹ️ Call already exists for:', peerId);
      return;
    }

    console.log(`📞 Calling peer (${retryCount + 1}/${MAX_RETRIES}):`, peerName);
    
    try {
      const call = peerRef.current.call(peerId, localStreamRef.current);
      
      if (!call) {
        console.error('❌ Failed to create call');
        return;
      }

      let hasReceivedStream = false;
      let streamTimeout;

      call.on('stream', (remoteStream) => {
        console.log('✅ Stream received from:', peerName);
        hasReceivedStream = true;
        clearTimeout(streamTimeout);
        handleRemoteStream(peerId, remoteStream, peerName);
        
        if (retryTimeoutsRef.current[peerId]) {
          clearTimeout(retryTimeoutsRef.current[peerId]);
          delete retryTimeoutsRef.current[peerId];
        }
      });

      call.on('close', () => {
        console.log('📴 Call closed:', peerName);
        clearTimeout(streamTimeout);
        removePeer(peerId);
      });

      call.on('error', (err) => {
        console.error('❌ Call error:', peerName, err);
        clearTimeout(streamTimeout);
        
        if (!hasReceivedStream && retryCount < MAX_RETRIES) {
          console.log(`🔄 Retrying ${peerName} in ${RETRY_DELAY}ms...`);
          delete callsRef.current[peerId];
          
          retryTimeoutsRef.current[peerId] = setTimeout(() => {
            callPeer(peerId, peerName, retryCount + 1);
          }, RETRY_DELAY);
        }
      });

      callsRef.current[peerId] = call;

      // Timeout: si no hay stream en 8 segundos, reintentar
      streamTimeout = setTimeout(() => {
        if (!hasReceivedStream && retryCount < MAX_RETRIES) {
          console.log(`⏰ Timeout for ${peerName}, retrying...`);
          call.close();
          delete callsRef.current[peerId];
          callPeer(peerId, peerName, retryCount + 1);
        }
      }, 8000);

    } catch (err) {
      console.error('❌ Exception calling peer:', err);
      
      if (retryCount < MAX_RETRIES) {
        retryTimeoutsRef.current[peerId] = setTimeout(() => {
          callPeer(peerId, peerName, retryCount + 1);
        }, RETRY_DELAY);
      }
    }
  }, [handleRemoteStream, removePeer]);

  // Unirse al chat de voz
  const joinVoiceChat = useCallback(async () => {
    if (!myPeerId) {
      setError('Esperando conexión P2P...');
      return;
    }

    try {
      setError(null);
      await getLocalStream();
      
      console.log('🎤 Joining voice chat with peer ID:', myPeerId);
      
      emit('webrtc:join-voice', { 
        roomCode,
        peerId: myPeerId 
      });
      
      setIsInVoiceChat(true);
      
    } catch (err) {
      console.error('❌ Failed to join:', err);
      setError('No se pudo acceder al micrófono');
    }
  }, [roomCode, myPeerId, emit, getLocalStream]);

  // Salir del chat de voz - MEJORADO
  const leaveVoiceChat = useCallback(() => {
    console.log('🔇 Leaving voice chat');
    
    // Limpiar timeouts
    Object.values(retryTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current = {};
    
    // Detener stream local
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Cerrar y limpiar todos los audio elements
    Object.entries(audioElementsRef.current).forEach(([peerId, audio]) => {
      audio.pause();
      audio.srcObject = null;
    });
    audioElementsRef.current = {};

    // Cerrar llamadas
    Object.values(callsRef.current).forEach(call => call.close());
    callsRef.current = {};
    
    // Limpiar pending
    if (window.pendingAudioStreams) {
      window.pendingAudioStreams.clear();
    }
    
    setPeers({});
    emit('webrtc:leave-voice', { roomCode });
    setIsInVoiceChat(false);
    
  }, [roomCode, emit]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log('🎤 Muted:', !audioTrack.enabled);
      }
    }
  }, []);

  // Escuchar eventos del servidor
  useEffect(() => {
    if (!socket || !isInVoiceChat || !myPeerId) {
      return;
    }

    console.log('👂 Listening to WebRTC events');

    const handleExistingPeers = ({ peers: existingPeers }) => {
      console.log('📋 Existing peers:', existingPeers.length);
      
      if (existingPeers.length > 0) {
        setTimeout(() => {
          existingPeers.forEach(({ peerId, peerName }) => {
            if (peerId !== myPeerId) {
              callPeer(peerId, peerName);
            }
          });
        }, 2000);
      }
    };

    const handlePeerJoined = ({ peerId, peerName }) => {
      console.log('👤 Peer joined:', peerName);
      
      if (peerId !== myPeerId && localStreamRef.current) {
        setTimeout(() => {
          callPeer(peerId, peerName);
        }, 2000);
      }
    };

    const handlePeerLeft = ({ socketId }) => {
      console.log('👋 Peer left:', socketId);
      // Buscar peer por socketId y removerlo
      // (limitación: no tenemos mapeo socketId -> peerId perfecto)
    };

    on('webrtc:existing-peers', handleExistingPeers);
    on('webrtc:peer-joined', handlePeerJoined);
    on('webrtc:peer-left', handlePeerLeft);

    return () => {
      off('webrtc:existing-peers', handleExistingPeers);
      off('webrtc:peer-joined', handlePeerJoined);
      off('webrtc:peer-left', handlePeerLeft);
    };
  }, [socket, isInVoiceChat, myPeerId, callPeer, on, off]);

  // Cleanup
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
    peerCount: Object.keys(peers).length,
    isReady: !!myPeerId
  };
};