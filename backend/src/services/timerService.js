import { GAME_CONFIG, GAME_STATES } from '../utils/constants.js';

class TimerService {
  constructor() {
    this.timers = new Map(); // roomCode -> interval
  }

  startCountdown(room, io, playerWhoPressed) {
    if (room.countdownActive) {
      throw new Error('Countdown ya está activo');
    }

    room.countdownActive = true;
    room.gameState = GAME_STATES.COUNTDOWN;
    
    let timeLeft = GAME_CONFIG.COUNTDOWN_SECONDS;

    const playerWhoStoppedData = room.getPlayer(playerWhoPressed);

    console.log(`⏱️  Countdown started in room ${room.code} by ${playerWhoStoppedData?.name}`.yellow);

    // *** NUEVO: Marcar al jugador que presionó STOP pero NO enviar sus respuestas aún ***
    // Solo marcamos que él presionó STOP
    if (playerWhoStoppedData) {
      playerWhoStoppedData.pressedStop = true;
    }

    // Emitir inicio del countdown
    io.to(room.code).emit('countdown_started', {
      seconds: timeLeft,
      triggeredBy: playerWhoStoppedData?.name,
      triggeredById: playerWhoPressed
    });

    const interval = setInterval(() => {
      timeLeft--;

      // Emitir tick del countdown
      io.to(room.code).emit('countdown_tick', {
        seconds: timeLeft
      });

      if (timeLeft <= 0) {
        this.stopCountdown(room.code);
        
        // Bloquear inputs
        room.gameState = GAME_STATES.DISCUSSION;
        
        io.to(room.code).emit('inputs_locked', {
          message: 'Tiempo agotado! Los tableros están bloqueados'
        });

        // *** AHORA SÍ: Auto-enviar respuestas de TODOS los jugadores que no enviaron ***
        const CATEGORIES = ['nombre', 'apellido', 'ciudad', 'pais', 'animal', 'artista', 'novela', 'fruta', 'cosa'];
        
        room.getAllPlayers().forEach(player => {
          if (!player.hasSubmitted) {
            const answers = {};
            
            CATEGORIES.forEach(cat => {
              answers[cat] = player.currentAnswers?.[cat] || '';
            });
            
            player.setAnswers(answers);
            room.currentAnswers.set(player.id, answers);

            // Notificar que este jugador "envió" (auto-enviado)
            io.to(room.code).emit('player_submitted', {
              playerId: player.id,
              playerName: player.name,
              autoSubmitted: true
            });
          }
        });

        console.log(`⏰ Countdown finished in room ${room.code}`.green);

        // Pequeño delay antes de la fase de discusión para que se vean las notificaciones
        setTimeout(() => {
          io.to(room.code).emit('start_discussion', {
            answers: this.getAllAnswers(room)
          });
        }, 500);
      }
    }, 1000);

    this.timers.set(room.code, interval);
  }

  stopCountdown(roomCode) {
    const interval = this.timers.get(roomCode);
    
    if (interval) {
      clearInterval(interval);
      this.timers.delete(roomCode);
      console.log(`⏹️  Countdown stopped in room ${roomCode}`.gray);
    }
  }

  getAllAnswers(room) {
    const allAnswers = {};
    
    room.currentAnswers.forEach((answers, playerId) => {
      const player = room.getPlayer(playerId);
      allAnswers[playerId] = {
        playerName: player.name,
        playerColor: player.color,
        answers
      };
    });

    return allAnswers;
  }

  clearTimer(roomCode) {
    this.stopCountdown(roomCode);
  }

  clearAllTimers() {
    this.timers.forEach((interval, roomCode) => {
      this.stopCountdown(roomCode);
    });
  }
}

export const timerService = new TimerService();