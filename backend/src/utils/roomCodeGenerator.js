import { GAME_CONFIG } from './constants.js';

/**
 * Genera un código único para la sala
 * Usa caracteres sin ambigüedad (sin I, O, 0, 1)
 */
export const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  
  for (let i = 0; i < GAME_CONFIG.ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars.charAt(randomIndex);
  }
  
  return code;
};

/**
 * Genera un código único que no exista en el mapa de salas
 */
export const generateUniqueRoomCode = (existingRooms) => {
  let code;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateRoomCode();
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('No se pudo generar un código único de sala');
    }
  } while (existingRooms.has(code));
  
  return code;
};

/**
 * Genera un color aleatorio para el jugador
 */
export const generatePlayerColor = () => {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};