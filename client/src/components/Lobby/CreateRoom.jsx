import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Loader2, Plus } from 'lucide-react';
import { useGame } from '../../hooks/useGame';
import { validatePlayerName } from '../../utils/validation';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Card from '../shared/Card';

const CreateRoom = ({ onBack }) => {
  const { createRoom, connected } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (!connected) {
      setError('No hay conexión con el servidor');
      return;
    }

    setIsLoading(true);
    createRoom(validation.name);

    // Timeout de seguridad
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
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
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow"
                >
                  <Plus className="w-8 h-8 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold mb-2">Crear Sala</h2>
                <p className="text-dark-400 text-sm">
                  Ingresa tu nombre para crear una nueva sala
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-dark-300 mb-2">
                  Tu nombre
                </label>
                <Input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  disabled={isLoading}
                  icon={User}
                  error={error}
                  maxLength={20}
                  autoFocus
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 mt-2"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Info */}
              <div className="bg-dark-700/50 rounded-xl p-4 border border-dark-600">
                <p className="text-xs text-dark-300 mb-2">
                  ℹ️ Al crear la sala:
                </p>
                <ul className="text-xs text-dark-400 space-y-1">
                  <li>• Recibirás un código de 6 caracteres</li>
                  <li>• Serás el anfitrión de la sala</li>
                  <li>• Podrás iniciar el juego cuando estén listos</li>
                  <li>• Máximo 6 jugadores por sala</li>
                </ul>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={!playerName.trim() || isLoading || !connected}
                className="w-full"
                icon={isLoading ? Loader2 : Plus}
              >
                {isLoading ? 'Creando sala...' : 'Crear Sala'}
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

export default CreateRoom;