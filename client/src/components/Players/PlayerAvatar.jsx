import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

const PlayerAvatar = ({ 
  player, 
  size = 'md', 
  isHost = false, 
  showCrown = false,
  animate = true 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
  };

  const crownSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? {
        initial: { scale: 0 },
        animate: { scale: 1 },
        whileHover: { scale: 1.1 },
      }
    : {};

  return (
    <div className="relative inline-block">
      <Wrapper
        {...wrapperProps}
        className={`
          ${sizeClasses[size]}
          rounded-full
          flex items-center justify-center
          font-bold text-white
          shadow-lg
          ${isHost ? 'ring-2 ring-accent-400 ring-offset-2 ring-offset-dark-800' : ''}
        `}
        style={{
          background: `linear-gradient(135deg, ${player.color}, ${player.color}dd)`,
        }}
      >
        {getInitials(player.name)}
      </Wrapper>

      {/* Crown para el host */}
      {showCrown && isHost && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-1 -right-1 bg-accent-500 rounded-full p-1 shadow-lg"
        >
          <Crown className={`${crownSizes[size]} text-white`} />
        </motion.div>
      )}

      {/* Indicador de estado */}
      {player.hasSubmitted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-800"
        />
      )}
    </div>
  );
};

export default PlayerAvatar;