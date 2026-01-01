import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

const ScoreCard = ({ result, position }) => {
  const getPositionIcon = () => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Award className="w-6 h-6 text-amber-700" />;
    return null;
  };

  const getPositionColor = () => {
    if (position === 1) return 'border-yellow-500 bg-yellow-500/10';
    if (position === 2) return 'border-gray-500 bg-gray-500/10';
    if (position === 3) return 'border-amber-700 bg-amber-700/10';
    return 'border-dark-700 bg-dark-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: position * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        flex items-center gap-4 p-4 rounded-xl border-2
        ${getPositionColor()}
        transition-all duration-200
      `}
    >
      {/* Position */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-dark-900 flex items-center justify-center font-bold text-xl">
        {position <= 3 ? getPositionIcon() : position}
      </div>

      {/* Player Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: result.playerColor }}
          />
          <h3 className="font-bold text-lg">{result.playerName}</h3>
        </div>
        <p className="text-sm text-dark-400">
          Ronda: {result.roundScore} pts • Total: {result.totalScore} pts
        </p>
      </div>

      {/* Score Badge */}
      <div className="flex-shrink-0 text-right">
        <div className="text-3xl font-black text-primary-400">
          {result.roundScore}
        </div>
        <div className="text-xs text-dark-500">puntos</div>
      </div>
    </motion.div>
  );
};

export default ScoreCard;