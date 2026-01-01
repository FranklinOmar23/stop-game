import { motion } from 'framer-motion';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  icon: Icon,
  className = '' 
}) => {
  const variants = {
    default: 'bg-dark-700 text-dark-300',
    primary: 'bg-primary-500/20 text-primary-400 border border-primary-500',
    accent: 'bg-accent-500/20 text-accent-400 border border-accent-500',
    success: 'bg-green-500/20 text-green-400 border border-green-500',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500',
    error: 'bg-red-500/20 text-red-400 border border-red-500',
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
      {children}
    </motion.span>
  );
};

export default Badge;