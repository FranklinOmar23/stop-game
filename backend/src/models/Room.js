import { GAME_STATES, GAME_CONFIG } from '../utils/constants.js';

export class Room {
  constructor(code, hostId) {
    this.code = code;
    this.host = hostId;
    this.players = new Map(); // playerId -> Player
    this.gameState = GAME_STATES.LOBBY;
    this.currentRound = 0;
    this.currentLetter = null;
    this.currentTurnPlayer = null;
    this.currentAnswers = new Map(); // playerId -> answers
    this.roundScores = [];
    this.countdownActive = false;
    this.countdownInterval = null;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  addPlayer(player) {
    this.players.set(player.id, player);
    this.updateActivity();
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    this.updateActivity();
    
    // Si el host se va, asignar nuevo host
    if (this.host === playerId && this.players.size > 0) {
      this.host = Array.from(this.players.keys())[0];
    }
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getPlayerCount() {
    return this.players.size;
  }

  canStartGame() {
    return this.players.size >= GAME_CONFIG.MIN_PLAYERS && 
           this.gameState === GAME_STATES.LOBBY;
  }

  resetForNewRound() {
    this.currentAnswers.clear();
    this.currentLetter = null;
    this.countdownActive = false;
    
    this.players.forEach(player => {
      player.reset();
    });
  }

  updateActivity() {
    this.lastActivity = Date.now();
  }

  isEmpty() {
    return this.players.size === 0;
  }

  toJSON() {
    return {
      code: this.code,
      host: this.host,
      players: this.getAllPlayers().map(p => p.toJSON()),
      gameState: this.gameState,
      currentRound: this.currentRound,
      currentLetter: this.currentLetter,
      currentTurnPlayer: this.currentTurnPlayer,
      playerCount: this.getPlayerCount(),
      maxPlayers: GAME_CONFIG.MAX_PLAYERS
    };
  }
}