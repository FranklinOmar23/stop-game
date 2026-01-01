import { Game } from '../models/Game.js';
import { GAME_STATES, GAME_CONFIG } from '../utils/constants.js';
import { validateLetter, validateAnswers } from '../utils/validators.js';

class GameService {
    constructor() {
        this.games = new Map(); // roomCode -> Game
    }

    selectLetter(room, playerId, letter) {
        if (room.currentTurnPlayer !== playerId) {
            throw new Error('No es tu turno para seleccionar letra');
        }

        const letterValidation = validateLetter(letter);
        if (!letterValidation.valid) {
            throw new Error(letterValidation.error);
        }

        const game = this.games.get(room.code);

        // *** Verificar si la letra ya fue usada ***
        if (game && game.usedLetters.has(letterValidation.letter)) {
            throw new Error('Esta letra ya fue usada en una ronda anterior');
        }

        room.currentLetter = letterValidation.letter;
        room.gameState = GAME_STATES.PLAYING;

        // *** Marcar letra como usada ***
        if (game) {
            game.usedLetters.add(letterValidation.letter);
        }

        console.log(`🔤 Letter selected: ${letterValidation.letter} in room ${room.code}`.cyan);

        return letterValidation.letter;
    }

    // Modificar startGame para enviar letras usadas
    startGame(room) {
        if (!room.canStartGame()) {
            throw new Error('No se puede iniciar el juego');
        }

        const game = new Game(room.code);
        game.start();

        this.games.set(room.code, game);

        room.gameState = GAME_STATES.SELECTING_LETTER;
        room.currentRound = 1;
        room.currentTurnPlayer = room.host;

        console.log(`🎮 Game started in room: ${room.code}`.green);

        return game;
    }

    submitAnswers(room, playerId, answers) {
        const player = room.getPlayer(playerId);

        if (!player) {
            throw new Error('Jugador no encontrado');
        }

        if (player.hasSubmitted) {
            throw new Error('Ya enviaste tus respuestas');
        }

        const answersValidation = validateAnswers(answers);
        if (!answersValidation.valid) {
            throw new Error(answersValidation.error);
        }

        player.setAnswers(answers);
        room.currentAnswers.set(playerId, answers);

        console.log(`📝 Answers submitted by ${player.name} in room ${room.code}`.yellow);

        return this.checkAllSubmitted(room);
    }

    checkAllSubmitted(room) {
        const allSubmitted = room.getAllPlayers().every(p => p.hasSubmitted);

        if (allSubmitted) {
            room.gameState = GAME_STATES.DISCUSSION;
            console.log(`💬 All players submitted in room ${room.code}`.green);
        }

        return allSubmitted;
    }

    getNextTurnPlayer(room) {
        const playerIds = Array.from(room.players.keys());
        const currentIndex = playerIds.indexOf(room.currentTurnPlayer);
        const nextIndex = (currentIndex + 1) % playerIds.length;

        return playerIds[nextIndex];
    }

    nextRound(room) {
        const game = this.games.get(room.code);

        if (!game) {
            throw new Error('Juego no encontrado');
        }

        room.currentRound++;

        if (room.currentRound > GAME_CONFIG.MAX_ROUNDS) {
            return this.finishGame(room, game);
        }

        room.resetForNewRound();
        room.gameState = GAME_STATES.SELECTING_LETTER;
        room.currentTurnPlayer = this.getNextTurnPlayer(room);

        console.log(`➡️  Next round ${room.currentRound} in room ${room.code}`.blue);

        return {
            finished: false,
            round: room.currentRound,
            nextPlayer: room.currentTurnPlayer
        };
    }

    finishGame(room, game) {
        game.finish();
        room.gameState = GAME_STATES.FINISHED;

        const finalScores = this.getFinalScores(room);

        console.log(`🏁 Game finished in room ${room.code}`.green);

        return {
            finished: true,
            finalScores,
            duration: game.getDuration()
        };
    }

    getFinalScores(room) {
        return room.getAllPlayers()
            .map(player => ({
                id: player.id,
                name: player.name,
                score: player.totalScore,
                color: player.color
            }))
            .sort((a, b) => b.score - a.score);
    }

    restartGame(room) {
        const game = this.games.get(room.code);

        if (game) {
            this.games.delete(room.code);
        }

        room.currentRound = 0;
        room.roundScores = [];
        room.resetForNewRound();
        room.gameState = GAME_STATES.LOBBY;

        room.players.forEach(player => {
            player.totalScore = 0;
            player.reset();
        });

        console.log(`🔄 Game restarted in room ${room.code}`.magenta);
    }

    getGame(roomCode) {
        return this.games.get(roomCode);
    }
}

export const gameService = new GameService();