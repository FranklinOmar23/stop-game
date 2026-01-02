import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import VoiceChat from '../Game/VoiceChat';
import AudioUnlocker from '@/components/Game/AudioUnlocker';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-accent-500/10 to-transparent rounded-full blur-3xl"
        />
      </div>

      <Header />
      
      <main className="flex-1 relative z-10">
        {children}
      </main>
      
      <Footer />
      <VoiceChat />
       <AudioUnlocker />
      
    </div>
  );
};

export default Layout;