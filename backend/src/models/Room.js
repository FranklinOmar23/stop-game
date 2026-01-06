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

    // *** Sistema de validación de respuestas ***
    this.answerValidations = new Map(); // key: "playerId-category" -> { approved: Set, rejected: Set }
    this.invalidatedAnswers = new Set(); // Set de "playerId-category" que fueron rechazadas

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

    // Limpiar validaciones
    this.answerValidations.clear();
    this.invalidatedAnswers.clear();

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

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  /**
   * Genera la clave única para una respuesta (playerId-category)
   */
  getValidationKey(playerId, category) {
    return `${playerId}-${category}`;
  }

  /**
   * Inicializa el sistema de validaciones para todas las respuestas
   */
  initializeValidations() {
    this.answerValidations.clear();
    this.invalidatedAnswers.clear();

    // Inicializar validaciones para cada respuesta
    this.currentAnswers.forEach((answers, playerId) => {
      Object.keys(answers).forEach(category => {
        const answer = answers[category];
        // Solo inicializar si hay respuesta
        if (answer && answer.trim() !== '') {
          const key = this.getValidationKey(playerId, category);
          this.answerValidations.set(key, {
            approved: new Set(),
            rejected: new Set()
          });
        }
      });
    });

    console.log(`📊 Initialized ${this.answerValidations.size} validations`.cyan);
  }

  /**
   * Registra un voto (approve o reject) en una respuesta
   */
  voteOnAnswer(playerId, category, voterId, vote) {
    const key = this.getValidationKey(playerId, category);

    // Crear validación si no existe
    if (!this.answerValidations.has(key)) {
      this.answerValidations.set(key, {
        approved: new Set(),
        rejected: new Set()
      });
    }

    const validation = this.answerValidations.get(key);

    // Remover voto anterior del mismo votante
    validation.approved.delete(voterId);
    validation.rejected.delete(voterId);

    // Agregar nuevo voto
    if (vote === 'approve') {
      validation.approved.add(voterId);
    } else if (vote === 'reject') {
      validation.rejected.add(voterId);
    }
    // Si vote es null, solo se remueve el voto anterior

    // Verificar si se debe invalidar
    this.checkIfInvalidated(playerId, category);

    return validation;
  }

  /**
   * Verifica si una respuesta debe ser invalidada según los votos
   */
  checkIfInvalidated(playerId, category) {
    const key = this.getValidationKey(playerId, category);
    const validation = this.answerValidations.get(key);

    if (!validation) return false;

    const totalVoters = this.players.size - 1; // Excluir al dueño de la respuesta
    const rejectedCount = validation.rejected.size;
    const approvedCount = validation.approved.size;

    // Mayoría simple: más de la mitad de los votantes posibles
    const majorityThreshold = Math.floor(totalVoters / 2);

    const wasInvalidated = this.invalidatedAnswers.has(key);

    if (rejectedCount > majorityThreshold) {
      // Marcar como invalidada
      this.invalidatedAnswers.add(key);

      if (!wasInvalidated) {
        console.log(`❌ Answer INVALIDATED: ${playerId} - ${category} (${rejectedCount} rejects)`.red);
      }
      return true;
    } else {
      // Remover invalidación si tenía
      this.invalidatedAnswers.delete(key);

      if (wasInvalidated) {
        console.log(`✅ Answer VALIDATED: ${playerId} - ${category} (${approvedCount} approves)`.green);
      }
      return false;
    }
  }

  /**
   * Verifica si una respuesta está invalidada
   */
  isAnswerInvalidated(playerId, category) {
    const key = this.getValidationKey(playerId, category);
    return this.invalidatedAnswers.has(key);
  }

  /**
   * Obtiene las estadísticas de validación de una respuesta
   */
  getValidationStats(playerId, category) {
    const key = this.getValidationKey(playerId, category);
    const validation = this.answerValidations.get(key);

    if (!validation) {
      return {
        approved: 0,
        rejected: 0,
        isInvalidated: false,
        approvedBy: [],
        rejectedBy: []
      };
    }

    return {
      approved: validation.approved.size,
      rejected: validation.rejected.size,
      isInvalidated: this.invalidatedAnswers.has(key),
      approvedBy: Array.from(validation.approved),
      rejectedBy: Array.from(validation.rejected)
    };
  }
  getPlayerBySocketId(socketId) {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) {
        return player;
      }
    }
    return null;
  }
  updatePlayerSocketId(playerId, newSocketId) {
    const player = this.players.get(playerId);
    if (player) {
      player.socketId = newSocketId;
      return true;
    }
    return false;
  }

  /**
   * Obtiene todas las estadísticas de validación de la sala
   */
  getAllValidationStats() {
    const allStats = {};

    this.currentAnswers.forEach((answers, playerId) => {
      allStats[playerId] = {};

      Object.keys(answers).forEach(category => {
        allStats[playerId][category] = this.getValidationStats(playerId, category);
      });
    });

    return allStats;
  }

  /**
   * Obtiene el conteo de respuestas invalidadas por jugador
   */
  getInvalidatedCountByPlayer() {
    const counts = {};

    this.invalidatedAnswers.forEach(key => {
      const [playerId] = key.split('-');
      counts[playerId] = (counts[playerId] || 0) + 1;
    });

    return counts;
  }

  // ==================== MÉTODOS EXISTENTES ====================

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
      maxPlayers: GAME_CONFIG.MAX_PLAYERS,
      // Incluir stats de validación si estamos en discusión
      ...(this.gameState === GAME_STATES.DISCUSSION && {
        validationStats: this.getAllValidationStats(),
        invalidatedCount: this.getInvalidatedCountByPlayer()
      })
    };
  }
}