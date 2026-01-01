import { Heart, Github } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-900/80 backdrop-blur-md border-t border-dark-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <span>© {currentYear} STOP Game</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Hecho con <Heart className="w-4 h-4 text-red-500" /> por Franklin
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-dark-400 hover:text-primary-400 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
