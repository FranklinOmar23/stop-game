import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, AlertTriangle } from 'lucide-react';

const CountdownTimer = ({ seconds, isActive }) => {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (seconds <= 3 && seconds > 0) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const getColor = () => {
    if (seconds <= 3) return 'text-red-500';
    if (seconds <= 5) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBackgroundColor = () => {
    if (seconds <= 3) return 'bg-red-500/10 border-red-500';
    if (seconds <= 5) return 'bg-yellow-500/10 border-yellow-500';
    return 'bg-green-500/10 border-green-500';
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed top-24 right-4 z-50" // *** CAMBIO: top-24 en lugar de top-4 ***
    >
      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        className={`
          flex items-center gap-3 px-6 py-4 rounded-2xl border-2
          ${getBackgroundColor()}
          backdrop-blur-md shadow-2xl
        `}
      >
        {seconds <= 3 ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            <AlertTriangle className={`w-6 h-6 ${getColor()}`} />
          </motion.div>
        ) : (
          <Timer className={`w-6 h-6 ${getColor()}`} />
        )}

        <div className="text-center">
          <motion.p
            key={seconds}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-4xl font-black ${getColor()}`}
          >
            {seconds}
          </motion.p>
          <p className="text-xs text-dark-300 font-semibold">
            {seconds === 1 ? 'segundo' : 'segundos'}
          </p>
        </div>
      </motion.div>

      {/* Mensaje de advertencia */}
      <AnimatePresence>
        {seconds <= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-center"
          >
            <p className="text-sm font-bold text-red-400 animate-pulse">
              ¡Apúrate!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CountdownTimer;