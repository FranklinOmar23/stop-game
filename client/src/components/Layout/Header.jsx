import { motion } from 'framer-motion';
import { Gamepad2, LogOut, Users, Trophy } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import Button from '../shared/Button';
import Badge from '../shared/Badge';

const Header = () => {
  const { roomCode, players, currentRound, maxRounds, leaveRoom, isHost } = useGame();

  const handleLeave = () => {
    if (window.confirm('¿Seguro que quieres salir de la sala?')) {
      leaveRoom();
    }
  };

  return (
    <header className="bg-dark-900/80 backdrop-blur-md border-b border-dark-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gradient">STOP</h1>
              {roomCode && (
                <p className="text-xs text-dark-400">Sala: {roomCode}</p>
              )}
            </div>
          </motion.div>

          {/* Info */}
          {roomCode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden sm:flex items-center gap-4"
            >
              <Badge variant="accent" icon={Users}>
                {players.length} jugadores
              </Badge>

              {currentRound > 0 && (
                <Badge variant="primary" icon={Trophy}>
                  Ronda {currentRound}/{maxRounds}
                </Badge>
              )}
            </motion.div>
          )}

          {/* Actions */}
          {roomCode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button
                onClick={handleLeave}
                variant="secondary"
                size="sm"
                icon={LogOut}
              >
                Salir
              </Button>
            </motion.div>
          )}
        </div>

        {/* Mobile Info */}
        {roomCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="sm:hidden flex items-center gap-3 mt-3"
          >
            <Badge variant="accent" icon={Users} size="sm">
              {players.length}
            </Badge>

            {currentRound > 0 && (
              <Badge variant="primary" icon={Trophy} size="sm">
                {currentRound}/{maxRounds}
              </Badge>
            )}
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;