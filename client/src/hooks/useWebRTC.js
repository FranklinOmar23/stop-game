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
  const audioElementsRef = useRef({});
  const retryTimeoutsRef = useRef({});

  // Inicializar PeerJS con ExpressTURN
  useEffect(() => {
    console.log('🔧 Initializing PeerJS with ExpressTURN...');

    const peer = new Peer({
      config: {
        iceServers: [
          // STUN servers (ayudan a descubrir IP pública)
          {
            urls: 'stun:stun.l.google.com:19302'
          },
          {
            urls: 'stun:stun1.l.google.com:19302'
          },
          {
            urls: 'stun:stun2.l.google.com:19302'
          },

          // TURN server de ExpressTURN (relay cuando STUN no es suficiente)
          {
            urls: [
              'turn:free.expressturn.com:3478',
              'turn:free.expressturn.com:3478?transport=tcp',
              'turn:free.expressturn.com:3478?transport=udp'
            ],
            username: '000000002083070262',
            credential: '5+iwCn8l23WEfRzSONL6IQRrhII='
          },

          // Backup TURN (por si ExpressTURN llega al límite)
          {
            urls: [
              'turn:openrelay.metered.ca:80',
              'turn:openrelay.metered.ca:443',
              'turn:openrelay.metered.ca:443?transport=tcp'
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceTransportPolicy: 'all', // Usar todos los métodos disponibles
        iceCandidatePoolSize: 10
      },
      debug: 2 // Logs detallados
    });

    peer.on('open', (id) => {
      console.log('✅ Peer ID:', id);
      console.log('🌐 Using ExpressTURN server');
      setMyPeerId(id);
      peerRef.current = peer;
    });

    peer.on('call', (call) => {
      console.log('📞 Receiving call from:', call.peer);

      if (localStreamRef.current) {
        call.answer(localStreamRef.current);

        call.on('stream', (remoteStream) => {
          console.log('📻 Stream received from:', call.peer);
          handleRemoteStream(call.peer, remoteStream);
        });

        call.on('close', () => {
          console.log('📴 Call closed from:', call.peer);
          removePeer(call.peer);
        });

        call.on('error', (err) => {
          console.error('❌ Call error:', err);
        });

        callsRef.current[call.peer] = call;
      }
    });

    peer.on('error', (err) => {
      console.error('❌ PeerJS error:', err);

      if (err.type === 'peer-unavailable') {
        console.log('⚠️ Peer unavailable, retrying...');
      } else if (err.type === 'network') {
        setError('Error de red - verifica tu conexión');
      } else if (err.type === 'disconnected') {
        console.log('📴 Desconectado del servidor PeerJS');
      } else {
        setError('Error de conexión P2P');
      }
    });

    peer.on('disconnected', () => {
      console.log('📴 Peer disconnected');

      if (!peer.destroyed) {
        console.log('🔄 Reconnecting to PeerJS...');
        peer.reconnect();
      }
    });

    peer.on('close', () => {
      console.log('❌ Peer connection closed');
    });

    return () => {
      console.log('🧹 Cleaning up peer');
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
          readyState: audioTrack.readyState,
          label: audioTrack.label
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

  // Manejar stream remoto
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

    // Verificar que el stream tenga tracks de audio
    const audioTracks = stream.getAudioTracks();
    console.log('🎧 Remote audio tracks:', audioTracks.length);
    
    if (audioTracks.length === 0) {
      console.warn('⚠️ No audio tracks in remote stream');
      return;
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
        audio
      }
    }));
  }, []);

  // Remover peer
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

  // Llamar a un peer con reintentos
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
        } else if (!hasReceivedStream) {
          console.error(`❌ Max retries reached for ${peerName}`);
        }
      });

      callsRef.current[peerId] = call;

      // Timeout: si no hay stream en 10 segundos, reintentar
      streamTimeout = setTimeout(() => {
        if (!hasReceivedStream && retryCount < MAX_RETRIES) {
          console.log(`⏰ Timeout for ${peerName}, retrying...`);
          call.close();
          delete callsRef.current[peerId];
          callPeer(peerId, peerName, retryCount + 1);
        } else if (!hasReceivedStream) {
          console.error(`⏰ Max retries reached for ${peerName} (timeout)`);
        }
      }, 10000);

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

  // Salir del chat de voz
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
      // Nota: Mapeo socketId -> peerId es limitado
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