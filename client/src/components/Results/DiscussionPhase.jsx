import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { CATEGORIES, CATEGORY_LABELS } from '../../utils/constants';
import Button from '../shared/Button';
import Card from '../shared/Card';
import Badge from '../shared/Badge';

const DiscussionPhase = () => {
  const {
    allAnswers,
    currentLetter,
    players,
    player,
    isHost,
    calculateResults,
  } = useGame();

  const handleFinishDiscussion = () => {
    calculateResults();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-glow"
            >
              <MessageSquare className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-3xl font-black text-gradient mb-2">
              Fase de Discusión
            </h2>
            <p className="text-dark-400">
              Revisa las respuestas de todos los jugadores
            </p>
            <Badge variant="primary" size="lg" className="mt-3">
              Letra: {currentLetter}
            </Badge>
          </div>

          {/* Answers Grid */}
          <div className="space-y-8">
            {CATEGORIES.map((category, idx) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-dark-900/50 rounded-xl p-6 border border-dark-700"
              >
                <h3 className="text-xl font-bold mb-4 text-primary-400">
                  {CATEGORY_LABELS[category]}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(allAnswers).map(([playerId, data]) => {
                    const playerData = players.find(p => p.id === playerId);
                    const answer = data.answers[category] || '';

                    return (
                      <motion.div
                        key={playerId}
                        whileHover={{ scale: 1.02 }}
                        className={`
                          bg-dark-800 rounded-lg p-4 border-2
                          ${playerId === player?.id ? 'border-primary-500' : 'border-dark-600'}
                        `}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data.playerColor }}
                          />
                          <span className="text-sm font-semibold text-dark-300">
                            {data.playerName}
                          </span>
                        </div>

                        <div className="mb-3">
                          {answer ? (
                            <p className="text-white font-medium">{answer}</p>
                          ) : (
                            <p className="text-dark-500 italic">Sin respuesta</p>
                          )}
                        </div>

                        {/* Validation buttons (opcional) */}
                        {/* <div className="flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs">Válida</span>
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-xs">Inválida</span>
                          </button>
                        </div> */}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          {isHost() && (
            <div className="mt-8 text-center">
              <Button
                onClick={handleFinishDiscussion}
                size="lg"
                icon={ArrowRight}
              >
                Calcular Resultados
              </Button>
            </div>
          )}

          {!isHost() && (
            <div className="mt-8 text-center">
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-dark-400"
              >
                Esperando a que el anfitrión calcule los resultados...
              </motion.p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default DiscussionPhase;