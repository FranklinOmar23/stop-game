import { GAME_CONFIG, CATEGORIES } from './constants.js';

export const validatePlayerName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nombre requerido' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { valid: false, error: 'Nombre debe tener al menos 2 caracteres' };
  }
  
  if (trimmedName.length > 20) {
    return { valid: false, error: 'Nombre debe tener máximo 20 caracteres' };
  }
  
  return { valid: true, name: trimmedName };
};

export const validateRoomCode = (code) => {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Código de sala requerido' };
  }
  
  const trimmedCode = code.trim().toUpperCase();
  
  if (trimmedCode.length !== GAME_CONFIG.ROOM_CODE_LENGTH) {
    return { 
      valid: false, 
      error: `Código debe tener ${GAME_CONFIG.ROOM_CODE_LENGTH} caracteres` 
    };
  }
  
  return { valid: true, code: trimmedCode };
};

export const validateAnswers = (answers) => {
  if (!answers || typeof answers !== 'object') {
    return { valid: false, error: 'Respuestas inválidas' };
  }
  
  // Verificar que todas las categorías estén presentes
  for (const category of CATEGORIES) {
    if (!(category in answers)) {
      return { 
        valid: false, 
        error: `Falta categoría: ${category}` 
      };
    }
  }
  
  return { valid: true };
};

export const validateLetter = (letter) => {
  if (!letter || typeof letter !== 'string') {
    return { valid: false, error: 'Letra requerida' };
  }
  
  const upperLetter = letter.toUpperCase();
  
  if (upperLetter.length !== 1) {
    return { valid: false, error: 'Debe ser una sola letra' };
  }
  
  if (!/^[A-Z]$/.test(upperLetter)) {
    return { valid: false, error: 'Debe ser una letra válida (A-Z)' };
  }
  
  return { valid: true, letter: upperLetter };
};