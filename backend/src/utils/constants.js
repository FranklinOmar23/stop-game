export const CATEGORIES = [
  'nombre',
  'apellido',
  'ciudad',
  'pais',
  'animal',
  'artista',
  'novela',
  'fruta',
  'cosa'
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const GAME_CONFIG = {
  MIN_PLAYERS: parseInt(process.env.MIN_PLAYERS) || 2,
  MAX_PLAYERS: parseInt(process.env.MAX_PLAYERS) || 6,
  POINTS_UNIQUE: 100,
  POINTS_REPEATED: 50,
  POINTS_EMPTY: 0,
  COUNTDOWN_SECONDS: parseInt(process.env.COUNTDOWN_SECONDS) || 10,
  MAX_ROUNDS: parseInt(process.env.MAX_ROUNDS) || 5,
  ROOM_CODE_LENGTH: 6
};

export const GAME_STATES = {
  LOBBY: 'lobby',
  SELECTING_LETTER: 'selecting_letter',
  PLAYING: 'playing',
  COUNTDOWN: 'countdown',
  DISCUSSION: 'discussion',
  ROUND_RESULTS: 'round_results',
  FINISHED: 'finished'
};

export const PLAYER_STATES = {
  WAITING: 'waiting',
  WRITING: 'writing',
  SUBMITTED: 'submitted',
  READY: 'ready'
};