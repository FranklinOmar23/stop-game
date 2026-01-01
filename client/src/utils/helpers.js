/**
 * Obtiene las iniciales de un nombre
 */
export const getInitials = (name) => {
  if (!name) return '?';
  
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
};

/**
 * Formatea el tiempo en MM:SS
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Copia texto al portapapeles
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Normaliza una respuesta (lowercase, sin acentos)
 */
export const normalizeAnswer = (answer) => {
  if (!answer) return '';
  
  return answer
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Valida si una respuesta comienza con la letra
 */
export const startsWithLetter = (answer, letter) => {
  if (!answer || !letter) return false;
  
  const normalized = normalizeAnswer(answer);
  return normalized.startsWith(letter.toLowerCase());
};

/**
 * Genera un color aleatorio
 */
export const getRandomColor = () => {
  const colors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Obtiene el ordinal (1º, 2º, 3º)
 */
export const getOrdinal = (n) => {
  if (n === 1) return '1º';
  if (n === 2) return '2º';
  if (n === 3) return '3º';
  return `${n}º`;
};

/**
 * Clasifica a los jugadores por puntuación
 */
export const rankPlayers = (players) => {
  return [...players].sort((a, b) => b.totalScore - a.totalScore);
};

/**
 * Calcula el porcentaje de progreso
 */
export const getProgressPercentage = (current, total) => {
  return Math.round((current / total) * 100);
};

/**
 * Obtiene el mensaje de posición
 */
export const getPositionMessage = (position) => {
  switch (position) {
    case 1:
      return '¡Ganador! 🏆';
    case 2:
      return '¡Segundo lugar! 🥈';
    case 3:
      return '¡Tercer lugar! 🥉';
    default:
      return `Posición ${position}`;
  }
};

/**
 * Genera un nombre de jugador aleatorio
 */
export const generateRandomName = () => {
  const adjectives = ['Rápido', 'Inteligente', 'Creativo', 'Veloz', 'Astuto'];
  const nouns = ['Jugador', 'Maestro', 'Campeón', 'Experto', 'As'];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  
  return `${adj}${noun}${num}`;
};

/**
 * Trunca un texto largo
 */
export const truncate = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};