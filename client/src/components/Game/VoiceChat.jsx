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
  ChevronUp
} from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { useWebRTC } from '../../hooks/useWebRTC';
import Button from '../shared/Button';
import Badge from '../shared/Badge';

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
    peerCount
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
                    </ul>
                  </div>

                  <Button
                    onClick={joinVoiceChat}
                    className="w-full"
                    icon={Phone}
                  >
                    Unirse al Chat de Voz
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
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-dark-400" />
                      <span className="text-sm text-dark-400">
                        {peerCount + 1} en llamada
                      </span>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {/* Local user */}
                      <div className="flex items-center gap-2 bg-dark-900 rounded-lg p-3">
                        <div className={`w-2 h-2 rounded-full ${
                          isMuted ? 'bg-red-400' : 'bg-green-400 animate-pulse'
                        }`} />
                        <span className="text-sm flex-1 font-semibold">
                          {player?.name} (Tú)
                        </span>
                        {isMuted && (
                          <MicOff className="w-4 h-4 text-red-400" />
                        )}
                      </div>

                      {/* Remote peers */}
                      {peers.map((peer, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 bg-dark-900 rounded-lg p-3"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-sm flex-1 truncate">
                            {peer.name || 'Jugador'}
                          </span>
                          <Volume2 className="w-4 h-4 text-green-400" />
                        </motion.div>
                      ))}

                      {peerCount === 0 && (
                        <p className="text-xs text-dark-500 text-center py-4">
                          Esperando otros jugadores...
                        </p>
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
                </div>
              )}

              {/* Tips */}
              <div className="mt-4 pt-4 border-t border-dark-700">
                <p className="text-xs text-dark-500 text-center">
                  💡 Tip: Usa auriculares para evitar eco
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VoiceChat;