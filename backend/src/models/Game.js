import { ALPHABET, GAME_CONFIG } from '../utils/constants.js';

export class Game {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.rounds = [];
    this.currentRoundNumber = 0;
    this.usedLetters = new Set(); // *** IMPORTANTE: trackear letras usadas ***
    this.startedAt = null;
    this.finishedAt = null;
  }

  start() {
    this.startedAt = Date.now();
    this.currentRoundNumber = 1;
    this.usedLetters.clear(); // Limpiar letras al inicio
  }

  getRandomLetter() {
    const availableLetters = ALPHABET.filter(
      letter => !this.usedLetters.has(letter)
    );
    
    // Si no hay letras disponibles, reiniciar (por si juegan más de 26 rondas)
    if (availableLetters.length === 0) {
      this.usedLetters.clear();
      return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    
    const randomLetter = availableLetters[
      Math.floor(Math.random() * availableLetters.length)
    ];
    
    // *** Marcar letra como usada ***
    this.usedLetters.add(randomLetter);
    
    return randomLetter;
  }

  addRound(roundData) {
    this.rounds.push({
      number: this.currentRoundNumber,
      letter: roundData.letter,
      results: roundData.results,
      timestamp: Date.now()
    });
  }

  nextRound() {
    this.currentRoundNumber++;
    return this.currentRoundNumber;
  }

  isFinished() {
    return this.currentRoundNumber > GAME_CONFIG.MAX_ROUNDS;
  }

  finish() {
    this.finishedAt = Date.now();
  }

  getDuration() {
    if (!this.startedAt) return 0;
    const endTime = this.finishedAt || Date.now();
    return Math.floor((endTime - this.startedAt) / 1000);
  }

  getUsedLetters() {
    return Array.from(this.usedLetters);
  }

  toJSON() {
    return {
      roomCode: this.roomCode,
      currentRound: this.currentRoundNumber,
      totalRounds: GAME_CONFIG.MAX_ROUNDS,
      rounds: this.rounds,
      usedLetters: this.getUsedLetters(),
      duration: this.getDuration(),
      isFinished: this.isFinished()
    };
  }
}