import { motion } from 'framer-motion';

const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl
          ${Icon ? 'pl-12' : ''}
          bg-dark-800 border-2 transition-all duration-200
          text-white placeholder-dark-400
          focus:outline-none focus:ring-2 focus:ring-primary-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500' : 'border-dark-600 focus:border-primary-500'}
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

export default Input;