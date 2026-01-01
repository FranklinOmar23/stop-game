import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Hash, Loader2, LogIn } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { validatePlayerName, validateRoomCode } from '../../utils/validation';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Card from '../shared/Card';

const JoinRoom = ({ onBack }) => {
  const { joinRoom, connected } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    const nameValidation = validatePlayerName(playerName);
    const codeValidation = validateRoomCode(roomCode);

    const newErrors = {};

    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error;
    }

    if (!codeValidation.valid) {
      newErrors.code = codeValidation.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!connected) {
      setErrors({ general: 'No hay conexión con el servidor' });
      return;
    }

    setIsLoading(true);
    joinRoom(codeValidation.code, nameValidation.name);

    // Timeout de seguridad
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  const handleRoomCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={onBack}
                disabled={isLoading}
                className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-4 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Volver</span>
              </button>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-glow"
                >
                  <LogIn className="w-8 h-8 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold mb-2">Unirse a Sala</h2>
                <p className="text-dark-400 text-sm">
                  Ingresa el código de la sala y tu nombre
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Código de Sala */}
              <div>
                <label className="block text-sm font-semibold text-dark-300 mb-2">
                  Código de Sala
                </label>
                <Input
                  type="text"
                  value={roomCode}
                  onChange={handleRoomCodeChange}
                  placeholder="ABC123"
                  disabled={isLoading}
                  icon={Hash}
                  error={errors.code}
                  maxLength={6}
                  autoFocus
                />
                {errors.code && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 mt-2"
                  >
                    {errors.code}
                  </motion.p>
                )}
              </div>

              {/* Nombre del Jugador */}
              <div>
                <label className="block text-sm font-semibold text-dark-300 mb-2">
                  Tu Nombre
                </label>
                <Input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  disabled={isLoading}
                  icon={User}
                  error={errors.name}
                  maxLength={20}
                />
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 mt-2"
                  >
                    {errors.name}
                  </motion.p>
                )}
              </div>

              {/* Error general */}
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/10 border border-red-500 rounded-xl p-3"
                >
                  <p className="text-sm text-red-400">{errors.general}</p>
                </motion.div>
              )}

              {/* Info */}
              <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-600">
                <p className="text-xs text-dark-300 mb-2">
                  💡 Consejo:
                </p>
                <ul className="text-xs text-dark-400 space-y-1">
                  <li>• El código tiene 6 caracteres</li>
                  <li>• Asegúrate de escribirlo correctamente</li>
                  <li>• Tu nombre debe ser único en la sala</li>
                </ul>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={
                  !playerName.trim() || 
                  !roomCode.trim() || 
                  isLoading || 
                  !connected
                }
                className="w-full"
                icon={isLoading ? Loader2 : LogIn}
              >
                {isLoading ? 'Uniéndose...' : 'Unirse a Sala'}
              </Button>

              {/* Connection status */}
              {!connected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <p className="text-xs text-red-400">
                    ⚠️ No hay conexión con el servidor
                  </p>
                </motion.div>
              )}
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinRoom;