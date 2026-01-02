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
  const peersDataRef = useRef({});
  const retryTimeoutsRef = useRef({}); // ← NUEVO: Para reintentos

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
      if (err.type === 'peer-unavailable') {
        console.log('⚠️ Peer not available, will retry...');
        // No mostrar error al usuario, es normal
      } else {
        setError('Error de conexión P2P');
      }
    });

    return () => {
      peer.destroy();
      // Limpiar reintentos
      Object.values(retryTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Obtener stream local
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
      console.log('🎤 Local stream obtained');
      return stream;
    } catch (err) {
      console.error('❌ Error getting media:', err);
      setError('No se pudo acceder al micrófono');
      throw err;
    }
  }, []);

  // Manejar stream remoto
  const handleRemoteStream = useCallback((peerId, stream) => {
    console.log('🔊 Setting up remote stream for:', peerId);
    
    const peerData = peersDataRef.current[peerId] || {};
    
    setPeers(prev => ({
      ...prev,
      [peerId]: {
        stream,
        name: peerData.name || 'Jugador',
        isMuted: false
      }
    }));

    // Reproducir audio
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play().catch(err => console.error('Error playing:', err));
  }, []);

  // Remover peer
  const removePeer = useCallback((peerId) => {
    console.log('❌ Removing peer:', peerId);
    
    if (callsRef.current[peerId]) {
      callsRef.current[peerId].close();
      delete callsRef.current[peerId];
    }

    // Limpiar timeout de reintento si existe
    if (retryTimeoutsRef.current[peerId]) {
      clearTimeout(retryTimeoutsRef.current[peerId]);
      delete retryTimeoutsRef.current[peerId];
    }

    delete peersDataRef.current[peerId];

    setPeers(prev => {
      const newPeers = { ...prev };
      delete newPeers[peerId];
      return newPeers;
    });
  }, []);

  // Llamar a un peer con reintentos
  const callPeer = useCallback((peerId, peerName, retryCount = 0) => {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000; // 2 segundos

    if (!peerRef.current || !localStreamRef.current) {
      console.log('⚠️ Cannot call peer, missing stream or peer object');
      return;
    }

    // Si ya hay una llamada activa, no reintentar
    if (callsRef.current[peerId]) {
      console.log('ℹ️ Call already exists for peer:', peerId);
      return;
    }

    console.log(`📞 Calling peer (attempt ${retryCount + 1}/${MAX_RETRIES}):`, peerId, peerName);
    
    // Guardar info del peer
    peersDataRef.current[peerId] = { name: peerName };
    
    try {
      const call = peerRef.current.call(peerId, localStreamRef.current);
      
      if (!call) {
        console.error('❌ Failed to create call');
        return;
      }

      let hasReceivedStream = false;

      call.on('stream', (remoteStream) => {
        console.log('✅ Received stream from:', peerId);
        hasReceivedStream = true;
        handleRemoteStream(peerId, remoteStream);
        
        // Limpiar timeout de reintento si existe
        if (retryTimeoutsRef.current[peerId]) {
          clearTimeout(retryTimeoutsRef.current[peerId]);
          delete retryTimeoutsRef.current[peerId];
        }
      });

      call.on('close', () => {
        console.log('Call closed with:', peerId);
        removePeer(peerId);
      });

      call.on('error', (err) => {
        console.error('❌ Call error with', peerId, ':', err);
        
        // Si no hemos recibido stream y aún hay reintentos, intentar de nuevo
        if (!hasReceivedStream && retryCount < MAX_RETRIES) {
          console.log(`🔄 Will retry calling ${peerId} in ${RETRY_DELAY}ms...`);
          
          retryTimeoutsRef.current[peerId] = setTimeout(() => {
            console.log(`🔄 Retrying call to ${peerId}...`);
            delete callsRef.current[peerId];
            callPeer(peerId, peerName, retryCount + 1);
          }, RETRY_DELAY);
        } else if (retryCount >= MAX_RETRIES) {
          console.error(`❌ Max retries reached for ${peerId}`);
          setError(`No se pudo conectar con ${peerName}`);
        }
      });

      callsRef.current[peerId] = call;

      // Timeout de seguridad: si después de 5 segundos no hay stream, reintentar
      setTimeout(() => {
        if (!hasReceivedStream && retryCount < MAX_RETRIES) {
          console.log(`⏰ Timeout waiting for stream from ${peerId}, retrying...`);
          call.close();
          delete callsRef.current[peerId];
          callPeer(peerId, peerName, retryCount + 1);
        }
      }, 5000);

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
      
      // Notificar al servidor con mi peer ID
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

  // Salir del chat de voz
  const leaveVoiceChat = useCallback(() => {
    console.log('🔇 Leaving voice chat');
    
    // Limpiar timeouts de reintento
    Object.values(retryTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current = {};
    
    // Detener stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Cerrar llamadas
    Object.values(callsRef.current).forEach(call => call.close());
    callsRef.current = {};
    peersDataRef.current = {};
    
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

    // Peers existentes cuando me uno
    const handleExistingPeers = ({ peers: existingPeers }) => {
      console.log('📋 Received existing peers:', existingPeers.length);
      
      if (existingPeers.length === 0) {
        console.log('   ℹ️ No existing peers');
        return;
      }
      
      // Esperar 2 segundos antes de empezar a llamar para dar tiempo a que el otro peer esté listo
      setTimeout(() => {
        existingPeers.forEach(({ peerId, peerName }) => {
          if (peerId !== myPeerId) {
            console.log(`   📞 Calling existing peer: ${peerName}`);
            callPeer(peerId, peerName);
          }
        });
      }, 2000);
    };

    // Nuevo peer se une
    const handlePeerJoined = ({ peerId, peerName }) => {
      console.log('👤 New peer joined:', peerName);
      
      if (peerId === myPeerId || !localStreamRef.current) {
        return;
      }

      // Esperar 2 segundos antes de llamar
      setTimeout(() => {
        console.log(`   📞 Calling new peer: ${peerName}`);
        callPeer(peerId, peerName);
      }, 2000);
    };

    // Peer se va
    const handlePeerLeft = ({ socketId }) => {
      console.log('👋 Peer left:', socketId);
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
