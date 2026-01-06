import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff } from 'lucide-react';

const ReconnectingOverlay = ({ isReconnecting, isConnected }) => {
  if (!isReconnecting && isConnected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      >
        <div className="bg-dark-800 border-2 border-dark-600 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
          {isConnected ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <Loader2 className="w-full h-full text-primary-400" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">Reconectando...</h3>
              <p className="text-dark-400 text-sm">
                Recuperando tu partida
              </p>
            </>
          ) : (
            <>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <WifiOff className="w-full h-full text-red-400" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2 text-red-400">Desconectado</h3>
              <p className="text-dark-400 text-sm mb-4">
                Intentando reconectar...
              </p>
              <div className="flex items-center justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 bg-red-400 rounded-full"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReconnectingOverlay;