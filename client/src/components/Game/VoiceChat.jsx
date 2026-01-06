import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  Users,
  AlertCircle,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useGame } from '@/hooks/useGame';
import { useWebRTC } from '@/hooks/useWebRTC';
import Button from '@/components/shared/Button';
import Badge from '@/components/shared/Badge';

const VoiceChat = () => {
  const { roomCode, player } = useGame();
  const {
    joinVoiceChat,
    leaveVoiceChat,
    toggleMute,
    peers,
    isInVoiceChat,
    isMuted,
    error,
    peerCount,
    isReady
  } = useWebRTC(roomCode, player?.name);

  const [isExpanded, setIsExpanded] = useState(false);

  if (!roomCode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      {/* Minimized Button */}
      {!isExpanded && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(true)}
          className={`
            rounded-full p-4 shadow-2xl border-2 transition-all
            ${isInVoiceChat 
              ? 'bg-green-500/20 border-green-500' 
              : 'bg-dark-800 border-dark-600 hover:border-primary-500'
            }
          `}
        >
          <div className="flex items-center gap-2">
            {isInVoiceChat ? (
              <>
                {isMuted ? (
                  <MicOff className="w-6 h-6 text-red-400" />
                ) : (
                  <Mic className="w-6 h-6 text-green-400 animate-pulse" />
                )}
                {peerCount > 0 && (
                  <Badge variant="success" size="sm">
                    {peerCount + 1}
                  </Badge>
                )}
              </>
            ) : (
              <Phone className="w-6 h-6 text-dark-400" />
            )}
          </div>
        </motion.button>
      )}

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-dark-800 border-2 border-dark-600 rounded-2xl shadow-2xl w-80 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-dark-900 p-4 flex items-center justify-between border-b border-dark-700">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold">Chat de Voz</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400 font-semibold mb-1">
                        Error de audio
                      </p>
                      <p className="text-xs text-red-300">{error}</p>
                      <p className="text-xs text-red-300 mt-1">
                        💡 Verifica los permisos del navegador
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Not in voice chat */}
              {!isInVoiceChat && (
                <div className="space-y-4">
                  <div className="bg-dark-900 rounded-xl p-4 border border-dark-700">
                    <p className="text-sm text-dark-300 mb-2">
                      🎙️ Chat de voz gratuito
                    </p>
                    <ul className="text-xs text-dark-400 space-y-1">
                      <li>• Habla con otros jugadores</li>
                      <li>• Solo audio, sin vídeo</li>
                      <li>• Conexión directa P2P</li>
                      <li>• 100% gratis, sin límites</li>
                    </ul>
                  </div>

                  {/* Connection status */}
                  {!isReady && (
                    <div className="flex items-center justify-center gap-2 text-sm text-yellow-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Conectando sistema P2P...</span>
                    </div>
                  )}

                  <Button
                    onClick={joinVoiceChat}
                    disabled={!isReady}
                    className="w-full"
                    icon={isReady ? Phone : Loader2}
                  >
                    {isReady ? 'Unirse al Chat de Voz' : 'Conectando...'}
                  </Button>
                </div>
              )}

              {/* In voice chat */}
              {isInVoiceChat && (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 font-semibold">
                      Conectado al chat de voz
                    </span>
                  </div>

                  {/* Participants */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-dark-400" />
                        <span className="text-sm text-dark-400">
                          En llamada
                        </span>
                      </div>
                      <Badge variant="success" size="sm">
                        {peerCount + 1}
                      </Badge>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {/* Local user */}
                      <div className="flex items-center gap-2 bg-dark-900 rounded-lg p-3 border-2 border-primary-500/50">
                        <div className={`w-2 h-2 rounded-full ${
                          isMuted ? 'bg-red-400' : 'bg-green-400 animate-pulse'
                        }`} />
                        <span className="text-sm flex-1 font-semibold">
                          {player?.name} (Tú)
                        </span>
                        {isMuted ? (
                          <MicOff className="w-4 h-4 text-red-400" />
                        ) : (
                          <Mic className="w-4 h-4 text-green-400" />
                        )}
                      </div>

                      {/* Remote peers */}
                      {peers.map((peer, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-2 bg-dark-900 rounded-lg p-3"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-sm flex-1 truncate">
                            {peer.name || 'Jugador'}
                          </span>
                          <Volume2 className="w-4 h-4 text-green-400" />
                        </motion.div>
                      ))}

                      {/* Empty state */}
                      {peerCount === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-4 bg-dark-900/50 rounded-lg"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-1">
                              <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                className="w-2 h-2 bg-yellow-400 rounded-full"
                              />
                              <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                className="w-2 h-2 bg-yellow-400 rounded-full"
                              />
                              <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                className="w-2 h-2 bg-yellow-400 rounded-full"
                              />
                            </div>
                            <p className="text-xs text-yellow-400 font-semibold">
                              Esperando otros jugadores
                            </p>
                            <p className="text-xs text-dark-500">
                              Los demás deben unirse al chat
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-2">
                    <Button
                      onClick={toggleMute}
                      variant={isMuted ? 'secondary' : 'primary'}
                      className="flex-1"
                      icon={isMuted ? MicOff : Mic}
                    >
                      {isMuted ? 'Activar Mic' : 'Silenciar'}
                    </Button>
                    <Button
                      onClick={leaveVoiceChat}
                      variant="secondary"
                      icon={PhoneOff}
                    >
                      Salir
                    </Button>
                  </div>

                  {/* Audio quality indicator */}
                  {peerCount > 0 && (
                    <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span>Audio conectado con {peerCount} {peerCount === 1 ? 'persona' : 'personas'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tips */}
              <div className="mt-4 pt-4 border-t border-dark-700">
                <div className="space-y-1">
                  <p className="text-xs text-dark-500 text-center">
                    👷‍♂️ Funcion Beta aun en desarrollo..
                  </p>
                  <p className="text-xs text-dark-500 text-center">
                    💡 Tip: Usa auriculares para evitar eco
                  </p>
                  {isInVoiceChat && !isMuted && (
                    <p className="text-xs text-dark-500 text-center">
                      🎤 Tu micrófono está activo
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VoiceChat;