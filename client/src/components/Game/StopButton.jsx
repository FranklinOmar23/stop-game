import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hand, Zap } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { useToast } from '../../hooks/useToast';

const StopButton = () => {
  const { pressStop, countdownActive, canSubmit } = useGame();
  const { warning } = useToast();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    if (countdownActive || isPressed) return;

    // Verificar que tenga al menos una respuesta
    if (!canSubmit()) {
      warning('Debes llenar al menos una categoría antes de presionar STOP');
      return;
    }

    setIsPressed(true);
    pressStop();
  };

  if (countdownActive || isPressed) {
    return null;
  }

  return (
    <motion.button
      onClick={handlePress}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative group"
    >
      {/* Glow effect */}
      <motion.div
        animate={{
          boxShadow: [
            '0 0 20px rgba(239, 68, 68, 0.5)',
            '0 0 40px rgba(239, 68, 68, 0.8)',
            '0 0 20px rgba(239, 68, 68, 0.5)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-to-r from-primary-600 to-red-600 rounded-2xl blur-xl opacity-50"
      />

      {/* Button */}
      <div className="relative bg-gradient-to-r from-primary-600 to-red-600 rounded-2xl px-12 py-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          >
            <Hand className="w-8 h-8 text-white" />
          </motion.div>

          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="text-3xl font-black text-white tracking-wider">
                STOP
              </span>
            </div>
            <p className="text-xs text-white/80 font-medium">
              Presiona cuando termines
            </p>
          </div>
        </div>

        {/* Pulse effect */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-white rounded-2xl opacity-10"
        />
      </div>

      {/* Particles */}
      <motion.div
        animate={{
          y: [-20, 0],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute -top-8 left-1/2 -translate-x-1/2"
      >
        <Zap className="w-6 h-6 text-yellow-400" />
      </motion.div>
    </motion.button>
  );
};

export default StopButton;