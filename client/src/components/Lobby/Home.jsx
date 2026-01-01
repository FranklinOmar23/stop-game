import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Users, Plus, LogIn } from 'lucide-react';
import CreateRoom from './CreateRoom';
import JoinRoom from './JoinRoom';
import Button from '../shared/Button';
import Card from '../shared/Card';

const Home = () => {
  const [mode, setMode] = useState(null); // null, 'create', 'join'

  if (mode === 'create') {
    return <CreateRoom onBack={() => setMode(null)} />;
  }

  if (mode === 'join') {
    return <JoinRoom onBack={() => setMode(null)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Logo animado */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl blur-2xl opacity-50"
              />
              <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-glow">
                <Gamepad2 className="w-12 h-12 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-black text-gradient mb-4"
          >
            STOP
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-dark-300 mb-2"
          >
            El clásico juego de palabras
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-dark-400"
          >
            También conocido como Basta, Tutti Frutti o Mercadito
          </motion.p>
        </motion.div>

        {/* Opciones */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Crear Sala */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full hover:border-primary-500/50 transition-all duration-300 cursor-pointer group">
              <div className="text-center p-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow"
                >
                  <Plus className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold mb-2">Crear Sala</h2>
                <p className="text-dark-400 mb-6">
                  Inicia una nueva partida y comparte el código con tus amigos
                </p>

                <Button
                  onClick={() => setMode('create')}
                  className="w-full"
                  icon={Plus}
                >
                  Crear Nueva Sala
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Unirse a Sala */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full hover:border-accent-500/50 transition-all duration-300 cursor-pointer group">
              <div className="text-center p-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow"
                >
                  <LogIn className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold mb-2">Unirse a Sala</h2>
                <p className="text-dark-400 mb-6">
                  Ingresa el código de sala que te compartió tu amigo
                </p>

                <Button
                  onClick={() => setMode('join')}
                  variant="secondary"
                  className="w-full"
                  icon={LogIn}
                >
                  Unirse con Código
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Información del juego */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12"
        >
          <Card>
            <div className="text-center">
              <Users className="w-8 h-8 text-primary-400 mx-auto mb-3" />
              <h3 className="font-bold mb-2">¿Cómo jugar?</h3>
              <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm text-dark-300">
                <div>
                  <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-primary-400">1</span>
                  </div>
                  <p>Un jugador selecciona la letra</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-primary-400">2</span>
                  </div>
                  <p>Todos llenan las categorías</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-primary-400">3</span>
                  </div>
                  <p>El primero presiona STOP</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;