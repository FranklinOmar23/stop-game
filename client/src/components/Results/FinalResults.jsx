import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { useWindowSize } from '../../hooks/useWindowSize';
import { getOrdinal } from '../../utils/helpers';
import Button from '../shared/Button';
import Card from '../shared/Card';
import PlayerList from '../Players/PlayerList';

const FinalResults = () => {
  const { finalScores, isHost, restartGame, leaveRoom } = useGame();
  const { width, height } = useWindowSize();

  const winner = finalScores?.[0];

  const handleRestart = () => {
    if (window.confirm('¿Quieres jugar otra partida?')) {
      restartGame();
    }
  };

  const handleLeave = () => {
    if (window.confirm('¿Seguro que quieres salir?')) {
      leaveRoom();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />

      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-glow"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-black text-gradient mb-4"
              >
                ¡Juego Terminado!
              </motion.h1>
            </div>

            {/* Winner Podium */}
            {winner && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500 rounded-2xl p-8 mb-8"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    👑
                  </motion.div>
                  <h2 className="text-3xl font-black text-gradient mb-2">
                    {winner.name}
                  </h2>
                  <p className="text-yellow-400 font-bold text-xl mb-2">
                    ¡Campeón!
                  </p>
                  <div className="inline-block bg-yellow-500/20 border border-yellow-500 rounded-full px-6 py-2">
                    <span className="text-2xl font-black text-yellow-400">
                      {winner.score} puntos
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Podium */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-center mb-6">
                Clasificación Final
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {finalScores?.slice(0, 3).map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`
                      text-center
                      ${index === 0 ? 'md:order-2' : ''}
                      ${index === 1 ? 'md:order-1' : ''}
                      ${index === 2 ? 'md:order-3' : ''}
                    `}
                  >
                    <div
                      className={`
                        relative bg-dark-800 rounded-2xl p-6 border-2
                        ${index === 0 ? 'border-yellow-500 md:transform md:-translate-y-4' : ''}
                        ${index === 1 ? 'border-gray-500' : ''}
                        ${index === 2 ? 'border-amber-700' : ''}
                      `}
                    >
                      <div className="text-4xl mb-3">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                      </div>
                      <h4 className="font-bold text-lg mb-2">{player.name}</h4>
                      <p className="text-3xl font-black text-primary-400">
                        {player.score}
                      </p>
                      <p className="text-xs text-dark-400">puntos</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Rest of players */}
              {finalScores && finalScores.length > 3 && (
                <div className="space-y-3">
                  {finalScores.slice(3).map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center justify-between bg-dark-800 rounded-xl p-4 border border-dark-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-dark-500">
                          {getOrdinal(index + 4)}
                        </span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="font-semibold">{player.name}</span>
                      </div>
                      <span className="text-xl font-bold text-primary-400">
                        {player.score}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isHost() && (
                <Button
                  onClick={handleRestart}
                  className="flex-1"
                  size="lg"
                  icon={RotateCcw}
                >
                  Jugar de Nuevo
                </Button>
              )}
              <Button
                onClick={handleLeave}
                variant="secondary"
                className="flex-1"
                size="lg"
                icon={Home}
              >
                Salir al Menú
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FinalResults;