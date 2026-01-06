import { roomService } from '../services/roomService.js';
import { gameService } from '../services/gameService.js';
import { scoringService } from '../services/scoringService.js';
import { timerService } from '../services/timerService.js';
import { CLIENT_EVENTS, SERVER_EVENTS } from './events.js';

export const setupSocketHandlers = (io) => {
  // Almacenar peer IDs por sala (fuera del scope de connection para persistir)
  const voiceChatPeers = new Map(); // roomCode -> Map(socketId -> peerId)

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`.green);

    // ==================== WEBRTC SIGNALING ====================
    socket.on('webrtc:join-voice', ({ roomCode, peerId }) => {
      try {
        const room = roomService.getRoom(roomCode);
        if (!room) return;

        const player = room.getPlayerBySocketId(socket.id);
        if (!player) return;

        if (!voiceChatPeers.has(roomCode)) {
          voiceChatPeers.set(roomCode, new Map());
        }

        const roomPeers = voiceChatPeers.get(roomCode);

        const existingPeers = Array.from(roomPeers.entries()).map(([socketId, peerId]) => {
          const p = room.getPlayerBySocketId(socketId);
          return {
            peerId,
            socketId,
            peerName: p?.name || 'Jugador'
          };
        });

        roomPeers.set(socket.id, peerId);

        console.log(`🎤 ${player.name} joined voice (Peer: ${peerId})`.cyan);

        socket.emit('webrtc:existing-peers', { peers: existingPeers });
        socket.to(roomCode).emit('webrtc:peer-joined', {
          peerId,
          peerName: player.name,
          socketId: socket.id
        });

      } catch (error) {
        console.error('Error joining voice:', error.message);
      }
    });

    socket.on('webrtc:leave-voice', ({ roomCode }) => {
      if (voiceChatPeers.has(roomCode)) {
        const roomPeers = voiceChatPeers.get(roomCode);
        roomPeers.delete(socket.id);

        if (roomPeers.size === 0) {
          voiceChatPeers.delete(roomCode);
        }
      }

      socket.to(roomCode).emit('webrtc:peer-left', { socketId: socket.id });
    });

    // ==================== RECONEXIÓN ====================
    socket.on('rejoin_room', ({ roomCode, playerId, playerName }) => {
      try {
        console.log(`🔄 ${playerName} intentando reconectar a ${roomCode}`.cyan);
        console.log(`   Player ID: ${playerId}`.gray);
        console.log(`   New Socket ID: ${socket.id}`.gray);

        const room = roomService.getRoom(roomCode);

        if (!room) {
          console.log(`❌ Sala ${roomCode} no encontrada`.red);
          socket.emit('room_not_found');
          return;
        }

        const existingPlayer = room.getPlayer(playerId);

        if (existingPlayer) {
          const oldSocketId = existingPlayer.socketId;
          existingPlayer.socketId = socket.id;

          roomService.cancelExpirationTimer(roomCode);
          socket.join(roomCode);

          console.log(`✅ ${playerName} reconectado a ${roomCode}`.green);
          console.log(`   Old Socket ID: ${oldSocketId}`.gray);

          socket.emit('reconnected', {
            roomCode,
            player: existingPlayer.toJSON(),
            room: {
              code: roomCode,
              players: room.getAllPlayers().map(p => p.toJSON()),
              host: room.host,
              gameState: room.gameState,
              currentRound: room.currentRound,
              currentLetter: room.currentLetter,
            }
          });

          socket.to(roomCode).emit('player_reconnected', {
            playerId,
            playerName,
          });

          room.updateActivity();

        } else {
          console.log(`⚠️ Jugador ${playerId} no encontrado`.yellow);
          socket.emit('room_not_found');
        }

      } catch (error) {
        console.error('❌ Error en rejoin_room:', error);
        socket.emit('error', { message: 'Error al reconectar a la sala' });
      }
    });

    // ==================== CREAR SALA ====================
    socket.on(CLIENT_EVENTS.CREATE_ROOM, ({ playerName }) => {
      try {
        const { room, player } = roomService.createRoom(socket.id, playerName);

        socket.join(room.code);

        socket.emit(SERVER_EVENTS.ROOM_CREATED, {
          roomCode: room.code,
          player: player.toJSON(),
          room: roomService.getRoomData(room)
        });

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

      } catch (error) {
        console.error(`❌ Error creating room: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== UNIRSE A SALA ====================
    socket.on(CLIENT_EVENTS.JOIN_ROOM, ({ roomCode, playerName }) => {
      try {
        const { room, player } = roomService.joinRoom(roomCode, socket.id, playerName);

        socket.join(room.code);

        socket.emit(SERVER_EVENTS.ROOM_JOINED, {
          roomCode: room.code,
          player: player.toJSON(),
          room: roomService.getRoomData(room)
        });

        io.to(room.code).emit(SERVER_EVENTS.PLAYER_JOINED, {
          player: player.toJSON()
        });

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

      } catch (error) {
        console.error(`❌ Error joining room: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== INICIAR JUEGO ====================
    socket.on(CLIENT_EVENTS.START_GAME, ({ roomCode }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        const player = room.getPlayerBySocketId(socket.id);

        if (!player) {
          throw new Error('Jugador no encontrado');
        }

        if (room.host !== player.id) {
          throw new Error('Solo el host puede iniciar el juego');
        }

        const game = gameService.startGame(room);

        io.to(room.code).emit(SERVER_EVENTS.GAME_STARTED, {
          round: room.currentRound,
          maxRounds: game.toJSON().totalRounds,
          turnPlayer: room.currentTurnPlayer,
          turnPlayerName: room.getPlayer(room.currentTurnPlayer).name
        });

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

      } catch (error) {
        console.error(`❌ Error starting game: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== SELECCIONAR LETRA ====================
    socket.on(CLIENT_EVENTS.SELECT_LETTER, ({ roomCode, letter }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        const player = room.getPlayerBySocketId(socket.id);

        if (!player) {
          throw new Error('Jugador no encontrado');
        }

        const selectedLetter = gameService.selectLetter(room, player.id, letter);

        io.to(room.code).emit(SERVER_EVENTS.LETTER_SELECTED, {
          letter: selectedLetter,
          selectedBy: player.name,
          round: room.currentRound
        });

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

      } catch (error) {
        console.error(`❌ Error selecting letter: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== ACTUALIZAR RESPUESTA ====================
    socket.on('update_current_answer', ({ roomCode, category, value }) => {
      try {
        const room = roomService.getRoom(roomCode);
        if (!room) return;

        const player = room.getPlayerBySocketId(socket.id);
        if (!player) return;

        player.updateCurrentAnswer(category, value);

      } catch (error) {
        console.error(`❌ Error updating answer: ${error.message}`.red);
      }
    });

    // ==================== PRESIONAR STOP ====================
    socket.on(CLIENT_EVENTS.STOP_PRESSED, ({ roomCode }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        if (room.countdownActive) {
          throw new Error('El countdown ya está activo');
        }

        const player = room.getPlayerBySocketId(socket.id);

        if (!player) {
          throw new Error('Jugador no encontrado');
        }

        const hasAnyAnswer = Object.values(player.currentAnswers || {}).some(
          answer => answer && answer.trim() !== ''
        );

        if (!hasAnyAnswer) {
          throw new Error('Debes llenar al menos una categoría antes de presionar STOP');
        }

        timerService.startCountdown(room, io, player.id);

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

      } catch (error) {
        console.error(`❌ Error pressing stop: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== ENVIAR RESPUESTAS ====================
    socket.on(CLIENT_EVENTS.SUBMIT_ANSWERS, ({ roomCode, answers }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        const player = room.getPlayerBySocketId(socket.id);

        if (!player) {
          throw new Error('Jugador no encontrado');
        }

        const allSubmitted = gameService.submitAnswers(room, player.id, answers);

        io.to(room.code).emit(SERVER_EVENTS.PLAYER_SUBMITTED, {
          playerId: player.id,
          playerName: player.name
        });

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

        if (allSubmitted && !room.countdownActive) {
          room.initializeValidations();

          io.to(room.code).emit(SERVER_EVENTS.START_DISCUSSION, {
            answers: timerService.getAllAnswers(room)
          });
        }

      } catch (error) {
        console.error(`❌ Error submitting answers: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== VOTAR EN RESPUESTA ====================
    socket.on('vote_on_answer', ({ roomCode, playerId, category, vote }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        if (room.gameState !== 'discussion') {
          throw new Error('Solo puedes votar durante la fase de discusión');
        }

        const voter = room.getPlayerBySocketId(socket.id);

        if (!voter) {
          throw new Error('Jugador no encontrado');
        }

        if (playerId === voter.id) {
          throw new Error('No puedes votar por tus propias respuestas');
        }

        room.voteOnAnswer(playerId, category, voter.id, vote);

        const stats = room.getValidationStats(playerId, category);

        io.to(room.code).emit('answer_vote_updated', {
          playerId,
          category,
          voterId: voter.id,
          voterName: voter.name,
          vote,
          stats
        });

        console.log(`🗳️  ${voter.name} voted ${vote || 'removed'} on ${playerId}'s ${category}`.cyan);

      } catch (error) {
        console.error(`❌ Error voting on answer: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== OBTENER ESTADÍSTICAS ====================
    socket.on('get_validation_stats', ({ roomCode }) => {
      try {
        const room = roomService.getRoom(roomCode);
        if (!room) return;

        const allStats = room.getAllValidationStats();
        socket.emit('validation_stats', { stats: allStats });

      } catch (error) {
        console.error(`❌ Error getting validation stats: ${error.message}`.red);
      }
    });

    // ==================== CALCULAR RESULTADOS ====================
    socket.on('calculate_results', ({ roomCode }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        const player = room.getPlayerBySocketId(socket.id);

        if (!player) {
          throw new Error('Jugador no encontrado');
        }

        if (room.host !== player.id) {
          throw new Error('Solo el host puede calcular resultados');
        }

        const results = scoringService.calculateScores(room);

        room.gameState = 'round_results';

        io.to(room.code).emit(SERVER_EVENTS.ROUND_RESULTS, {
          results,
          round: room.currentRound,
          letter: room.currentLetter
        });

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

      } catch (error) {
        console.error(`❌ Error calculating results: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== SIGUIENTE RONDA ====================
    socket.on(CLIENT_EVENTS.NEXT_ROUND, ({ roomCode }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        const player = room.getPlayerBySocketId(socket.id);

        if (!player) {
          throw new Error('Jugador no encontrado');
        }

        if (room.host !== player.id) {
          throw new Error('Solo el host puede avanzar a la siguiente ronda');
        }

        const result = gameService.nextRound(room);

        if (result.finished) {
          io.to(room.code).emit(SERVER_EVENTS.GAME_FINISHED, {
            finalScores: result.finalScores,
            duration: result.duration
          });
        } else {
          io.to(room.code).emit(SERVER_EVENTS.NEW_ROUND, {
            round: result.round,
            nextPlayer: result.nextPlayer,
            nextPlayerName: room.getPlayer(result.nextPlayer).name
          });
        }

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

      } catch (error) {
        console.error(`❌ Error next round: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== REINICIAR JUEGO ====================
    socket.on(CLIENT_EVENTS.RESTART_GAME, ({ roomCode }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        const player = room.getPlayerBySocketId(socket.id);

        if (!player) {
          throw new Error('Jugador no encontrado');
        }

        if (room.host !== player.id) {
          throw new Error('Solo el host puede reiniciar el juego');
        }

        gameService.restartGame(room);

        io.to(room.code).emit('game_restarted', {
          room: roomService.getRoomData(room)
        });

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

      } catch (error) {
        console.error(`❌ Error restarting game: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
      }
    });

    // ==================== SALIR DE LA SALA ====================
    socket.on(CLIENT_EVENTS.LEAVE_ROOM, ({ roomCode }) => {
      const room = roomService.getRoom(roomCode);
      if (!room) return;

      const player = room.getPlayerBySocketId(socket.id);
      if (player) {
        handlePlayerLeave(player.id, roomCode);
      }
    });

    // ==================== DISCONNECT ====================
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`.red);

      const room = roomService.getRoomBySocketId(socket.id);

      if (room) {
        const player = room.getPlayerBySocketId(socket.id);
        if (player) {
          console.log(`📴 ${player.name} desconectado de sala ${room.code} (esperando reconexión...)`.yellow);
        }
      }

      // Limpiar peers de voice chat
      voiceChatPeers.forEach((roomPeers, roomCode) => {
        if (roomPeers.has(socket.id)) {
          roomPeers.delete(socket.id);

          io.to(roomCode).emit('webrtc:peer-left', {
            socketId: socket.id
          });

          if (roomPeers.size === 0) {
            voiceChatPeers.delete(roomCode);
          }
        }
      });
    });

    // ==================== FUNCIÓN AUXILIAR ====================
    function handlePlayerLeave(playerId, roomCode) {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) return;

        const player = room.getPlayer(playerId);
        const playerName = player?.name || 'Unknown';

        timerService.clearTimer(roomCode);

        const updatedRoom = roomService.leaveRoom(roomCode, playerId);

        if (!updatedRoom) {
          console.log(`🗑️  Room ${roomCode} was deleted`.gray);
          return;
        }

        io.to(roomCode).emit(SERVER_EVENTS.PLAYER_LEFT, {
          playerId,
          playerName,
          newHost: updatedRoom.host
        });

        io.to(roomCode).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(updatedRoom)
        });

        if (updatedRoom.gameState !== 'lobby' && updatedRoom.getPlayerCount() < 2) {
          gameService.restartGame(updatedRoom);

          io.to(roomCode).emit('game_cancelled', {
            message: 'Juego cancelado: no hay suficientes jugadores'
          });

          io.to(roomCode).emit(SERVER_EVENTS.ROOM_UPDATED, {
            room: roomService.getRoomData(updatedRoom)
          });
        }

      } catch (error) {
        console.error(`❌ Error handling player leave: ${error.message}`.red);
      }
    }
  });

  // ==================== ESTADÍSTICAS PERIÓDICAS ====================
  setInterval(() => {
    const stats = roomService.getStats();
    if (stats.totalRooms > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.gray);
      console.log(`📊 ${stats.activeRooms} salas activas | ${stats.totalPlayers} jugadores`.cyan);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.gray);
    }
  }, 5 * 60 * 1000);
};