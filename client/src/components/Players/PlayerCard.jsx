import { motion } from 'framer-motion';
import { Crown, Check, Edit3, Trophy } from 'lucide-react';
import PlayerAvatar from './PlayerAvatar';

const PlayerCard = ({ player, isHost = false, rank = null, showScore = false }) => {
  const getRankColor = () => {
    if (rank === 1) return 'from-yellow-500 to-amber-500';
    if (rank === 2) return 'from-gray-400 to-gray-500';
    if (rank === 3) return 'from-amber-700 to-amber-800';
    return 'from-dark-600 to-dark-700';
  };

  const getRankIcon = () => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🎮';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative bg-dark-800 rounded-xl p-4 border-2
        ${isHost ? 'border-accent-500/50' : 'border-dark-700'}
        transition-all duration-200
      `}
    >
      {/* Rank badge */}
      {rank && (
        <div className={`
          absolute -top-3 -right-3 w-8 h-8 rounded-full
          bg-gradient-to-br ${getRankColor()}
          flex items-center justify-center
          shadow-lg text-lg
        `}>
          {getRankIcon()}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <PlayerAvatar
          player={player}
          size="lg"
          isHost={isHost}
          showCrown={isHost}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold truncate">{player.name}</h3>
            {isHost && (
              <Crown className="w-4 h-4 text-accent-400 flex-shrink-0" />
            )}
          </div>

          {/* Score */}
          {showScore && (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent-400" />
              <span className="text-sm text-dark-300">
                {player.totalScore} puntos
              </span>
            </div>
          )}

          {/* Status */}
          {!showScore && (
            <div className="flex items-center gap-2">
              {player.hasSubmitted ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Listo</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Escribiendo</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;