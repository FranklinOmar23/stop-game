import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check } from 'lucide-react';
import { CATEGORY_LABELS } from '../../utils/constants';
import { validateAnswer } from '../../utils/validation';

const CategoryInput = ({ 
  category, 
  value, 
  onChange, 
  letter, 
  disabled = false,
  showValidation = false 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (showValidation && value) {
      const validation = validateAnswer(value, letter);
      setError(validation.valid ? '' : validation.error);
    } else {
      setError('');
    }
  }, [value, letter, showValidation]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(category, newValue);
  };

  const isValid = value && !error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <label className="block text-sm font-semibold text-dark-300 mb-2">
        {CATEGORY_LABELS[category]}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={`Escribe un ${category}...`}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-dark-800 border-2 transition-all duration-200
            text-white placeholder-dark-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isFocused ? 'border-primary-500' : 'border-dark-600'}
            ${error && showValidation ? 'border-red-500' : ''}
            ${isValid && showValidation ? 'border-green-500' : ''}
          `}
          maxLength={50}
        />

        {/* Indicador de validación */}
        {showValidation && value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && showValidation && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-xs text-red-400 mt-1 ml-1"
        >
          {error}
        </motion.p>
      )}

      {/* Contador de caracteres */}
      {isFocused && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-dark-400 mt-1 ml-1"
        >
          {value?.length || 0}/50
        </motion.p>
      )}
    </motion.div>
  );
};

export default CategoryInput;