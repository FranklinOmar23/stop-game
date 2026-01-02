import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Play, Users, Crown } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { copyToClipboard } from '../../utils/helpers';
import { MIN_PLAYERS } from '../../utils/constants';
import Button from '../shared/Button';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import PlayerList from '../Players/PlayerList';

const WaitingRoom = () => {
  const { roomCode, players, isHost, startGame } = useGame();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = () => {
    if (players.length >= MIN_PLAYERS) {
      startGame();
    }
  };

  const canStart = players.length >= MIN_PLAYERS;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow"
              >
                <Users className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-3xl font-black text-gradient mb-2">
                Sala de Espera
              </h2>
              <p className="text-dark-400">
                Esperando jugadores para comenzar
              </p>
            </div>

            {/* Room Code */}
            <div className="mb-8">
              <div className="bg-dark-900/50 rounded-2xl p-4 sm:p-6 border-2 border-dark-700">
                <p className="text-sm text-dark-400 text-center mb-3 sm:mb-2">
                  Código de Sala
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-3xl xs:text-4xl sm:text-5xl font-black text-gradient tracking-wider break-all text-center"
                  >
                    {roomCode}
                  </motion.span>
                  <Button
                    onClick={handleCopyCode}
                    variant="secondary"
                    size="sm"
                    icon={copied ? Check : Copy}
                    className="w-full sm:w-auto"
                  >
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                </div>
                <p className="text-xs text-dark-500 text-center mt-3">
                  Comparte este código con tus amigos
                </p>
              </div>
            </div>

            {/* Players Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-400" />
                  <h3 className="font-bold">Jugadores</h3>
                </div>
                <Badge variant="primary">
                  {players.length} / 6
                </Badge>
              </div>

              <PlayerList />
            </div>

            {/* Host Info */}
            {isHost() && (
              <div className="mb-6">
                <div className="bg-accent-500/10 border border-accent-500 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-accent-400" />
                    <span className="font-semibold text-accent-400">
                      Eres el Anfitrión
                    </span>
                  </div>
                  <p className="text-sm text-dark-300">
                    Puedes iniciar el juego cuando todos estén listos
                    {!canStart && ` (mínimo ${MIN_PLAYERS} jugadores)`}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {isHost() && (
                <Button
                  onClick={handleStartGame}
                  disabled={!canStart}
                  className="w-full"
                  icon={Play}
                  size="lg"
                >
                  {canStart
                    ? 'Iniciar Juego'
                    : `Esperando jugadores (${players.length}/${MIN_PLAYERS})`}
                </Button>
              )}

              {!isHost() && (
                <div className="text-center">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center justify-center gap-2 text-dark-400"
                  >
                    <div className="w-2 h-2 bg-accent-500 rounded-full" />
                    <span className="text-sm">
                      Esperando a que el anfitrión inicie el juego...
                    </span>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Game Rules */}
            <div className="mt-8 pt-6 border-t border-dark-700">
              <h4 className="font-semibold mb-3 text-center">
                Reglas del Juego
              </h4>
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🔤</span>
                  </div>
                  <p className="text-xs text-dark-300">
                    Un jugador selecciona la letra
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">✍️</span>
                  </div>
                  <p className="text-xs text-dark-300">
                    Todos llenan las categorías
                  </p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <p className="text-xs text-dark-300">
                    Presiona STOP y cuenta regresiva de 10s
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WaitingRoom;