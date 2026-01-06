import { PLAYER_STATES } from '../utils/constants.js';
import { generatePlayerColor } from '../utils/roomCodeGenerator.js';

export class Player {
  constructor(socketId, name) {
    this.id = this.generatePlayerId(); // ID persistente
    this.socketId = socketId; // Socket ID actual (puede cambiar en reconexión)
    this.name = name;
    this.color = generatePlayerColor();
    this.totalScore = 0;
    this.isReady = false;
    this.state = PLAYER_STATES.WAITING;
    this.hasSubmitted = false;
    this.pressedStop = false;
    this.currentAnswers = {}; // Respuestas mientras escribe
    this.joinedAt = Date.now();
  }

  // Generar ID único persistente
  generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  reset() {
    this.isReady = false;
    this.state = PLAYER_STATES.WAITING;
    this.hasSubmitted = false;
    this.pressedStop = false;
    this.currentAnswers = {};
  }

  setAnswers(answers) {
    this.currentAnswers = answers;
    this.hasSubmitted = true;
    this.state = PLAYER_STATES.SUBMITTED;
  }

  // Actualizar respuesta en tiempo real
  updateCurrentAnswer(category, value) {
    this.currentAnswers[category] = value;
  }

  addScore(points) {
    this.totalScore += points;
  }

  toJSON() {
    return {
      id: this.id, // ID persistente
      socketId: this.socketId, // Socket ID actual
      name: this.name,
      color: this.color,
      totalScore: this.totalScore,
      isReady: this.isReady,
      state: this.state,
      hasSubmitted: this.hasSubmitted,
      pressedStop: this.pressedStop
    };
  }
}