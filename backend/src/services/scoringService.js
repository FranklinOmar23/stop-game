import { CATEGORIES, GAME_CONFIG } from '../utils/constants.js';

class ScoringService {
  calculateScores(room) {
    const results = [];
    const answersByCategory = this.groupAnswersByCategory(room.currentAnswers);

    room.currentAnswers.forEach((playerAnswers, playerId) => {
      const player = room.getPlayer(playerId);
      const scores = {};
      let roundScore = 0;

      CATEGORIES.forEach(category => {
        const answer = this.normalizeAnswer(playerAnswers[category]);

        if (!answer) {
          scores[category] = {
            points: GAME_CONFIG.POINTS_EMPTY,
            status: 'empty'
          };
        } else {
          const categoryAnswers = answersByCategory[category];
          const occurrences = categoryAnswers.filter(a => a === answer).length;

          if (occurrences === 1) {
            scores[category] = {
              points: GAME_CONFIG.POINTS_UNIQUE,
              status: 'unique'
            };
          } else {
            scores[category] = {
              points: GAME_CONFIG.POINTS_REPEATED,
              status: 'repeated'
            };
          }
        }

        roundScore += scores[category].points;
      });

      // Actualizar score del jugador
      player.addScore(roundScore);

      results.push({
        playerId,
        playerName: player.name,
        playerColor: player.color,
        answers: playerAnswers,
        scores,
        roundScore,
        totalScore: player.totalScore
      });
    });

    // Ordenar por puntuación de la ronda (mayor a menor)
    results.sort((a, b) => b.roundScore - a.roundScore);

    // Guardar resultados en la sala
    room.roundScores.push({
      round: room.currentRound,
      letter: room.currentLetter,
      results,
      timestamp: Date.now()
    });

    return results;
  }

  groupAnswersByCategory(answersMap) {
    const grouped = {};

    CATEGORIES.forEach(category => {
      grouped[category] = [];
    });

    answersMap.forEach((playerAnswers) => {
      CATEGORIES.forEach(category => {
        const answer = this.normalizeAnswer(playerAnswers[category]);
        if (answer) {
          grouped[category].push(answer);
        }
      });
    });

    return grouped;
  }

  normalizeAnswer(answer) {
    if (!answer || typeof answer !== 'string') {
      return '';
    }

    return answer
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
  }

  challengeAnswer(room, playerId, category, challengedPlayerId) {
    const roundScore = room.roundScores[room.roundScores.length - 1];
    
    if (!roundScore) {
      throw new Error('No hay resultados para desafiar');
    }

    const challengedResult = roundScore.results.find(
      r => r.playerId === challengedPlayerId
    );

    if (!challengedResult) {
      throw new Error('Jugador no encontrado en resultados');
    }

    return {
      category,
      answer: challengedResult.answers[category],
      challengedBy: room.getPlayer(playerId).name,
      challengedPlayer: challengedResult.playerName
    };
  }

  approveAnswer(room, playerId, category) {
    // No hacer nada, la respuesta ya está aprobada
    console.log(`✅ Answer approved: ${category} for player ${playerId}`.green);
  }

  rejectAnswer(room, playerId, category) {
    const player = room.getPlayer(playerId);
    const roundScore = room.roundScores[room.roundScores.length - 1];
    
    if (!roundScore) {
      throw new Error('No hay resultados');
    }

    const playerResult = roundScore.results.find(r => r.playerId === playerId);
    
    if (!playerResult) {
      throw new Error('Resultado del jugador no encontrado');
    }

    // Restar los puntos de esa categoría
    const categoryScore = playerResult.scores[category];
    const pointsToDeduct = categoryScore.points;

    player.totalScore -= pointsToDeduct;
    playerResult.roundScore -= pointsToDeduct;
    playerResult.totalScore = player.totalScore;

    // Marcar como rechazada
    categoryScore.points = 0;
    categoryScore.status = 'rejected';

    console.log(`❌ Answer rejected: ${category} for ${player.name} (-${pointsToDeduct} points)`.red);

    return {
      playerId,
      category,
      deductedPoints: pointsToDeduct,
      newTotalScore: player.totalScore
    };
  }
}

export const scoringService = new ScoringService();