import { motion } from 'framer-motion';

const ProgressBar = ({ value, max = 100, color = 'primary', showLabel = true }) => {
  const percentage = (value / max) * 100;

  const colors = {
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-dark-300">Progreso</span>
          <span className="text-dark-300 font-semibold">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${colors[color]} rounded-full`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;