import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import Button from '@/components/shared/Button';

const AudioUnlocker = () => {
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.pendingAudioStreams && window.pendingAudioStreams.size > 0) {
        setNeedsUnlock(true);
        setPendingCount(window.pendingAudioStreams.size);
      } else {
        setNeedsUnlock(false);
        setPendingCount(0);
      }
    }, 500); // Revisar más frecuentemente

    return () => clearInterval(interval);
  }, []);

  const handleUnlock = async () => {
    if (!window.pendingAudioStreams) return;

    console.log('🔓 Unlocking audio for', window.pendingAudioStreams.size, 'peers');

    const unlockPromises = [];
    
    window.pendingAudioStreams.forEach(({ audio, peerName }) => {
      console.log('  - Unlocking:', peerName);
      unlockPromises.push(
        audio.play()
          .then(() => console.log('✅ Unlocked:', peerName))
          .catch(err => console.error('❌ Failed:', peerName, err))
      );
    });

    await Promise.allSettled(unlockPromises);
    
    window.pendingAudioStreams.clear();
    setNeedsUnlock(false);
  };

  return (
    <AnimatePresence>
      {needsUnlock && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4"
        >
          <div className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-500 rounded-full p-2">
                <VolumeX className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Audio bloqueado</p>
                <p className="text-sm text-yellow-100">
                  {pendingCount} {pendingCount === 1 ? 'jugador esperando' : 'jugadores esperando'}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleUnlock}
              className="w-full bg-yellow-500 hover:bg-yellow-600 border-yellow-600"
              icon={Volume2}
            >
              🔊 Activar Audio
            </Button>
            
            <p className="text-xs text-yellow-100 text-center mt-2">
              Toca para escuchar a los demás jugadores
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AudioUnlocker;