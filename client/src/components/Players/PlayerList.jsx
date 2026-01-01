import { motion } from 'framer-motion';
import { useGame } from '../../hooks/useGame';
import PlayerCard from './PlayerCard';

const PlayerList = ({ showScore = false, ranked = false }) => {
  const { players, host } = useGame();

  const sortedPlayers = ranked
    ? [...players].sort((a, b) => b.totalScore - a.totalScore)
    : players;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sortedPlayers.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <PlayerCard
            player={player}
            isHost={player.id === host}
            rank={ranked ? index + 1 : null}
            showScore={showScore}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default PlayerList;