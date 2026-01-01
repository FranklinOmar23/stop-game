export const CATEGORIES = [
  'nombre',
  'apellido',
  'ciudad',
  'pais',
  'animal',
  'artista',
  'novela',
  'fruta',
  'cosa',
];

export const CATEGORY_LABELS = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  ciudad: 'Ciudad',
  pais: 'País',
  animal: 'Animal',
  artista: 'Artista',
  novela: 'Novela',
  fruta: 'Fruta',
  cosa: 'Cosa',
};

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const GAME_STATES = {
  LOBBY: 'lobby',
  SELECTING_LETTER: 'selecting_letter',
  PLAYING: 'playing',
  COUNTDOWN: 'countdown',
  DISCUSSION: 'discussion',
  ROUND_RESULTS: 'round_results',
  FINISHED: 'finished',
};

export const PLAYER_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export const POINTS = {
  UNIQUE: 100,
  REPEATED: 50,
  EMPTY: 0,
};

export const COUNTDOWN_SECONDS = 10;
export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 2;
export const MAX_ROUNDS = 5;