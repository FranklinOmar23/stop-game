import { motion } from 'framer-motion';
import { Check, Edit3, Clock } from 'lucide-react';
import { useGame } from '../../hooks/useGame';

const PlayerStatus = () => {
  const { players, player } = useGame();

  const getStatusIcon = (p) => {
    if (p.hasSubmitted) {
      return <Check className="w-4 h-4" />;
    }
    return <Edit3 className="w-4 h-4" />;
  };

  const getStatusColor = (p) => {
    if (p.hasSubmitted) {
      return 'bg-green-500/20 border-green-500 text-green-400';
    }
    return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
  };

  const getStatusText = (p) => {
    if (p.hasSubmitted) {
      return 'Listo';
    }
    return 'Escribiendo';
  };

  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-dark-400" />
        <h3 className="text-sm font-semibold text-dark-300">
          Estado de jugadores
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {players.map((p, index) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border-2
              ${getStatusColor(p)}
              ${p.id === player?.id ? 'ring-2 ring-primary-500' : ''}
            `}
          >
            {getStatusIcon(p)}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {p.name}
                {p.id === player?.id && (
                  <span className="ml-1 text-primary-400">(Tú)</span>
                )}
              </p>
              <p className="text-xs opacity-75">{getStatusText(p)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlayerStatus;