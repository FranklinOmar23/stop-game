import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { useSocket } from '../../hooks/useSocket';
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
    roomCode,
  } = useGame();

  const { emit, on, off } = useSocket();
  const [validationStats, setValidationStats] = useState({});
  const [myVotes, setMyVotes] = useState({});

  useEffect(() => {
    const handleVoteUpdate = (data) => {
      setValidationStats(prev => ({
        ...prev,
        [`${data.playerId}-${data.category}`]: data.stats
      }));
    };

    on('answer_vote_updated', handleVoteUpdate);

    return () => {
      off('answer_vote_updated', handleVoteUpdate);
    };
  }, [on, off]);

  const handleVote = (playerId, category, vote) => {
    const voteKey = `${playerId}-${category}`;
    
    // Si ya voté lo mismo, remover voto
    if (myVotes[voteKey] === vote) {
      vote = null;
    }

    emit('vote_on_answer', {
      roomCode,
      playerId,
      category,
      vote
    });

    setMyVotes(prev => ({
      ...prev,
      [voteKey]: vote
    }));
  };

  const getVoteStats = (playerId, category) => {
    const key = `${playerId}-${category}`;
    return validationStats[key] || { approved: 0, rejected: 0, isInvalidated: false };
  };

  const getMyVote = (playerId, category) => {
    const key = `${playerId}-${category}`;
    return myVotes[key];
  };

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
            <p className="text-dark-400 mb-4">
              Revisa y valida las respuestas de todos los jugadores
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Badge variant="primary" size="lg">
                Letra: {currentLetter}
              </Badge>
              <Badge variant="accent" size="lg" icon={Users}>
                {players.length} jugadores
              </Badge>
            </div>

            {/* Instrucciones */}
            <div className="mt-6 bg-blue-500/10 border border-blue-500 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-blue-400 font-semibold mb-1">
                    ¿Cómo funciona la validación?
                  </p>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>• Vota <span className="text-green-400 font-bold">✓</span> si la respuesta es válida</li>
                    <li>• Vota <span className="text-red-400 font-bold">✗</span> si es inválida (no existe, está mal, etc.)</li>
                    <li>• Si la mayoría rechaza una respuesta, no suma puntos</li>
                    <li>• No puedes votar en tus propias respuestas</li>
                    <li>• Click en el mismo botón para quitar tu voto</li>
                  </ul>
                </div>
              </div>
            </div>
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
                    const answer = data.answers[category] || '';
                    const isMyAnswer = playerId === player?.id;
                    const stats = getVoteStats(playerId, category);
                    const myVote = getMyVote(playerId, category);

                    return (
                      <motion.div
                        key={playerId}
                        whileHover={!isMyAnswer ? { scale: 1.02 } : {}}
                        className={`
                          bg-dark-800 rounded-lg p-4 border-2 transition-all
                          ${isMyAnswer ? 'border-primary-500' : 'border-dark-600'}
                          ${stats.isInvalidated ? 'opacity-60' : ''}
                        `}
                      >
                        {/* Player name */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: data.playerColor }}
                            />
                            <span className="text-sm font-semibold text-dark-300">
                              {data.playerName}
                              {isMyAnswer && (
                                <span className="text-primary-400 ml-1">(Tú)</span>
                              )}
                            </span>
                          </div>

                          {/* Status badge */}
                          {stats.isInvalidated && (
                            <Badge variant="error" size="sm">
                              Rechazada
                            </Badge>
                          )}
                        </div>

                        {/* Answer */}
                        <div className="mb-3 min-h-[3rem] flex items-center">
                          {answer ? (
                            <p className={`text-white font-medium ${stats.isInvalidated ? 'line-through' : ''}`}>
                              {answer}
                            </p>
                          ) : (
                            <p className="text-dark-500 italic">Sin respuesta</p>
                          )}
                        </div>

                        {/* Voting buttons */}
                        {!isMyAnswer && answer && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVote(playerId, category, 'approve')}
                                className={`
                                  flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg 
                                  transition-all font-semibold text-sm
                                  ${myVote === 'approve'
                                    ? 'bg-green-500 text-white shadow-lg scale-105'
                                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                  }
                                `}
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span>{stats.approved}</span>
                              </button>
                              
                              <button
                                onClick={() => handleVote(playerId, category, 'reject')}
                                className={`
                                  flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg 
                                  transition-all font-semibold text-sm
                                  ${myVote === 'reject'
                                    ? 'bg-red-500 text-white shadow-lg scale-105'
                                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                  }
                                `}
                              >
                                <ThumbsDown className="w-4 h-4" />
                                <span>{stats.rejected}</span>
                              </button>
                            </div>

                            {/* Vote indicator */}
                            {myVote && (
                              <div className="flex items-center justify-center gap-2 text-xs">
                                {myVote === 'approve' && (
                                  <span className="text-green-400 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Aprobaste esta respuesta
                                  </span>
                                )}
                                {myVote === 'reject' && (
                                  <span className="text-red-400 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Rechazaste esta respuesta
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* My answer indicator */}
                        {isMyAnswer && (
                          <div className="text-center text-xs text-dark-500 italic">
                            No puedes votar en tus propias respuestas
                          </div>
                        )}
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
              <p className="text-xs text-dark-500 mt-2">
                Las respuestas rechazadas por la mayoría no sumarán puntos
              </p>
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