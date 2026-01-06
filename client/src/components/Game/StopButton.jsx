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
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative group"
    >
      {/* Glow effect - Más suave */}
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-r from-primary-600 to-red-600 rounded-2xl blur-xl"
      />

      {/* Button */}
      <div className="relative bg-gradient-to-r from-primary-600 to-red-600 rounded-2xl px-12 py-6 shadow-2xl">
        <div className="flex items-center gap-4">
          {/* Icono de mano - Animación suave */}
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Hand className="w-8 h-8 text-white" />
          </motion.div>

          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              {/* Icono de rayo - Sin animación */}
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

        {/* Pulse effect - Más sutil */}
        <motion.div
          animate={{
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-white rounded-2xl"
        />
      </div>

      {/* Particles - Eliminado (demasiado ruido) */}
    </motion.button>
  );
};

export default StopButton;