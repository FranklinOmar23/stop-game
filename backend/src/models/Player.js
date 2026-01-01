import { PLAYER_STATES } from '../utils/constants.js';
import { generatePlayerColor } from '../utils/roomCodeGenerator.js';

export class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.color = generatePlayerColor();
    this.totalScore = 0;
    this.isReady = false;
    this.state = PLAYER_STATES.WAITING;
    this.hasSubmitted = false;
    this.pressedStop = false;  // *** NUEVO ***
    this.currentAnswers = {};  // *** NUEVO: Almacenar respuestas mientras escribe ***
    this.joinedAt = Date.now();
  }

  reset() {
    this.isReady = false;
    this.state = PLAYER_STATES.WAITING;
    this.hasSubmitted = false;
    this.pressedStop = false;  // *** NUEVO ***
    this.currentAnswers = {};
  }

  setAnswers(answers) {
    this.currentAnswers = answers;
    this.hasSubmitted = true;
    this.state = PLAYER_STATES.SUBMITTED;
  }

  // *** NUEVO: Actualizar respuesta en tiempo real ***
  updateCurrentAnswer(category, value) {
    this.currentAnswers[category] = value;
  }

  addScore(points) {
    this.totalScore += points;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      totalScore: this.totalScore,
      isReady: this.isReady,
      state: this.state,
      hasSubmitted: this.hasSubmitted,
      pressedStop: this.pressedStop  // *** NUEVO ***
    };
  }
}