import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Clock } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { CATEGORIES } from '../../utils/constants';
import CategoryInput from './CategoryInput';
import CountdownTimer from './CountdownTimer';
import StopButton from './StopButton';
import PlayerStatus from './PlayerStatus';
import Button from '../shared/Button';
import Badge from '../shared/Badge';

const GameBoard = () => {
  const {
    currentLetter,
    myAnswers,
    updateAnswer,
    submitAnswers,
    canSubmit,
    gameState,
    countdownActive,
    countdownSeconds,
    players,
    player,
  } = useGame();

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // *** CAMBIO: Solo bloquear inputs si ya envié o si estamos en discussion ***
  const isInputsLocked = gameState === 'discussion' || hasSubmitted;

  useEffect(() => {
    // Reset cuando cambia la ronda
    setHasSubmitted(false);
    setShowValidation(false);
  }, [currentLetter]);

  const handleSubmit = () => {
    setShowValidation(true);
    
    if (canSubmit()) {
      submitAnswers();
      setHasSubmitted(true);
    }
  };

  const submittedPlayers = players.filter(p => p.hasSubmitted);
  const totalPlayers = players.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Countdown Timer */}
      <CountdownTimer 
        seconds={countdownSeconds} 
        isActive={countdownActive} 
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-black text-gradient mb-2">
              ¡A Jugar!
            </h2>
            {currentLetter && (
              <p className="text-dark-300">
                Escribe palabras que empiecen con:{' '}
                <span className="text-primary-400 font-bold text-2xl">
                  {currentLetter}
                </span>
              </p>
            )}
          </div>

          <div className="text-right">
            <Badge variant="primary" size="lg">
              {submittedPlayers.length} / {totalPlayers} enviaron
            </Badge>
            
            {/* Mostrar countdown activo */}
            {countdownActive && !hasSubmitted && (
              <div className="mt-2">
                <Badge variant="warning" size="sm" icon={Clock}>
                  ¡Apúrate! {countdownSeconds}s
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Player Status */}
        <PlayerStatus />
      </div>

      {/* Formulario de Categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {CATEGORIES.map((category, index) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <CategoryInput
              category={category}
              value={myAnswers[category]}
              onChange={updateAnswer}
              letter={currentLetter}
              disabled={isInputsLocked}
              showValidation={showValidation}
            />
          </motion.div>
        ))}
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        {/* Botón STOP - Solo visible si NO hay countdown activo y NO has enviado */}
        {!countdownActive && !hasSubmitted && gameState === 'playing' && (
          <StopButton />
        )}

        {/* Botón Enviar - Visible durante el juego y countdown, oculto si ya envió */}
        {(gameState === 'playing' || gameState === 'countdown') && !hasSubmitted && (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="w-full sm:w-auto min-w-[200px]"
            icon={Send}
          >
            Enviar Respuestas
          </Button>
        )}

        {/* Mensaje de enviado */}
        {hasSubmitted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-6 py-3 bg-green-500/20 border-2 border-green-500 rounded-xl"
          >
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold">
              ¡Respuestas enviadas! Espera a los demás...
            </span>
          </motion.div>
        )}

        {/* Mensaje bloqueado */}
        {gameState === 'discussion' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-6 py-3 bg-yellow-500/20 border-2 border-yellow-500 rounded-xl"
          >
            <span className="text-yellow-400 font-semibold">
              Tablero bloqueado - Fase de discusión
            </span>
          </motion.div>
        )}
      </div>

      {/* Mensajes de ayuda */}
      {gameState === 'playing' && !hasSubmitted && !countdownActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-dark-400 text-sm">
            💡 Llena todas las categorías que puedas. Presiona{' '}
            <span className="text-primary-400 font-bold">STOP</span> cuando termines
            para iniciar la cuenta regresiva de 10 segundos.
          </p>
        </motion.div>
      )}

      {countdownActive && !hasSubmitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-yellow-400 text-sm font-semibold animate-pulse">
            ⚡ ¡Cuenta regresiva activa! Termina de escribir y envía tus respuestas
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default GameBoard;