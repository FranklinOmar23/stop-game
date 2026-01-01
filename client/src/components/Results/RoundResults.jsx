import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { useWindowSize } from '../../hooks/useWindowSize';
import { CATEGORY_LABELS } from '../../utils/constants';
import Button from '../shared/Button';
import Card from '../shared/Card';
import Badge from '../shared/Badge';
import ScoreCard from './ScoreCard';

const RoundResults = () => {
  const { roundResults, currentRound, maxRounds, isHost, nextRound } = useGame();
  const { width, height } = useWindowSize();

  const winner = roundResults?.[0];
  const isLastRound = currentRound >= maxRounds;

  const handleNextRound = () => {
    nextRound();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {winner && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center shadow-glow"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-4xl font-black text-gradient mb-2">
                Resultados - Ronda {currentRound}
              </h2>
              <p className="text-dark-400">
                {isLastRound ? '¡Última ronda!' : `Quedan ${maxRounds - currentRound} rondas`}
              </p>
            </div>

            {/* Winner Highlight */}
            {winner && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-accent-500/20 to-primary-500/20 border-2 border-accent-500 rounded-2xl p-6 mb-8"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">
                    🏆 Ganador de la Ronda
                  </h3>
                  <p className="text-3xl font-black text-gradient mb-2">
                    {winner.playerName}
                  </p>
                  <Badge variant="accent" size="lg">
                    {winner.roundScore} puntos
                  </Badge>
                </div>
              </motion.div>
            )}

            {/* Results Table */}
            <div className="space-y-4 mb-8">
              {roundResults?.map((result, index) => (
                <ScoreCard
                  key={result.playerId}
                  result={result}
                  position={index + 1}
                />
              ))}
            </div>

            {/* Category Breakdown */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-center">
                Desglose por Categoría
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left p-3 text-dark-300">Jugador</th>
                      {Object.keys(CATEGORY_LABELS).map((cat) => (
                        <th key={cat} className="text-center p-3 text-dark-300">
                          {CATEGORY_LABELS[cat]}
                        </th>
                      ))}
                      <th className="text-center p-3 text-dark-300">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roundResults?.map((result) => (
                      <tr
                        key={result.playerId}
                        className="border-b border-dark-800 hover:bg-dark-700/50"
                      >
                        <td className="p-3 font-semibold">{result.playerName}</td>
                        {Object.keys(CATEGORY_LABELS).map((cat) => {
                          const score = result.scores[cat];
                          return (
                            <td key={cat} className="text-center p-3">
                              <span
                                className={`
                                  inline-block px-2 py-1 rounded text-xs font-bold
                                  ${score.points === 100 ? 'bg-green-500/20 text-green-400' : ''}
                                  ${score.points === 50 ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                  ${score.points === 0 ? 'bg-red-500/20 text-red-400' : ''}
                                `}
                              >
                                {score.points}
                              </span>
                            </td>
                          );
                        })}
                        <td className="text-center p-3">
                          <span className="font-bold text-primary-400">
                            {result.roundScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            {isHost() && (
              <div className="text-center">
                <Button
                  onClick={handleNextRound}
                  size="lg"
                  icon={isLastRound ? Trophy : ArrowRight}
                >
                  {isLastRound ? 'Ver Resultados Finales' : 'Siguiente Ronda'}
                </Button>
              </div>
            )}

            {!isHost() && (
              <div className="text-center">
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-dark-400"
                >
                  Esperando a que el anfitrión continúe...
                </motion.p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RoundResults;