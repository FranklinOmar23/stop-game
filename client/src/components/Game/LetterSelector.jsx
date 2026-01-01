import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shuffle, Check, X } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { ALPHABET } from '../../utils/constants';
import Button from '../shared/Button';
import Card from '../shared/Card';

const LetterSelector = () => {
  const { selectLetter, isMyTurn, currentTurnPlayer, getPlayerById, room } = useGame();
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [usedLetters, setUsedLetters] = useState(new Set());

  const turnPlayer = getPlayerById(currentTurnPlayer);

  // *** NUEVO: Obtener letras usadas del room/game ***
  useEffect(() => {
    // Aquí deberías obtener las letras usadas del backend
    // Por ahora usaremos un estado local
    // Cuando el backend envíe la info del juego, actualízalo aquí
  }, [room]);

  const handleSelectLetter = (letter) => {
    if (!usedLetters.has(letter)) {
      setSelectedLetter(letter);
    }
  };

  const handleConfirm = () => {
    if (selectedLetter) {
      selectLetter(selectedLetter);
    }
  };

  const handleRandomize = () => {
    setIsRandomizing(true);
    let iterations = 0;
    const maxIterations = 20;

    // Filtrar letras disponibles
    const availableLetters = ALPHABET.filter(l => !usedLetters.has(l));
    
    if (availableLetters.length === 0) {
      setIsRandomizing(false);
      return;
    }

    const interval = setInterval(() => {
      const randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
      setSelectedLetter(randomLetter);
      iterations++;

      if (iterations >= maxIterations) {
        clearInterval(interval);
        setIsRandomizing(false);
      }
    }, 100);
  };

  if (!isMyTurn()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-6"
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">Esperando...</h2>
          <p className="text-dark-300">
            <span className="text-accent-400 font-semibold">
              {turnPlayer?.name}
            </span>{' '}
            está seleccionando la letra
          </p>

          <motion.div
            className="flex gap-2 justify-center mt-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-3 h-3 bg-accent-500 rounded-full" />
            <div className="w-3 h-3 bg-accent-500 rounded-full" />
            <div className="w-3 h-3 bg-accent-500 rounded-full" />
          </motion.div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-3xl font-black text-gradient mb-2">
              ¡Es tu turno!
            </h2>
            <p className="text-dark-300">
              Selecciona la letra para esta ronda
            </p>
          </div>

          {/* Letra Seleccionada */}
          <AnimatePresence mode="wait">
            {selectedLetter && (
              <motion.div
                key={selectedLetter}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-glow">
                  <span className="text-7xl font-black text-white">
                    {selectedLetter}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alfabeto */}
          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-2 mb-8">
            {ALPHABET.map((letter, index) => {
              const isUsed = usedLetters.has(letter);
              const isSelected = selectedLetter === letter;
              
              return (
                <motion.button
                  key={letter}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={!isUsed && !isRandomizing ? { scale: 1.1 } : {}}
                  whileTap={!isUsed && !isRandomizing ? { scale: 0.95 } : {}}
                  onClick={() => handleSelectLetter(letter)}
                  disabled={isRandomizing || isUsed}
                  className={`
                    aspect-square rounded-xl font-bold text-xl
                    transition-all duration-200 relative
                    ${
                      isSelected
                        ? 'bg-primary-500 text-white shadow-glow scale-110 z-10'
                        : isUsed
                        ? 'bg-dark-900 text-dark-600 cursor-not-allowed opacity-40'
                        : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {letter}
                  {isUsed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <X className="w-6 h-6 text-red-500" strokeWidth={3} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Leyenda */}
          {usedLetters.size > 0 && (
            <div className="flex items-center justify-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-dark-900 rounded border border-dark-600"></div>
                <span className="text-dark-400">Ya usada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-dark-700 rounded"></div>
                <span className="text-dark-400">Disponible</span>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleRandomize}
              disabled={isRandomizing || usedLetters.size >= ALPHABET.length}
              variant="secondary"
              icon={Shuffle}
              className="flex-1"
            >
              {isRandomizing ? 'Aleatorizando...' : 'Letra Aleatoria'}
            </Button>

            <Button
              onClick={handleConfirm}
              disabled={!selectedLetter || isRandomizing}
              icon={Check}
              className="flex-1"
            >
              Confirmar Letra
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default LetterSelector;