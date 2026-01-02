import { roomService } from '../services/roomService.js';
import { gameService } from '../services/gameService.js';
import { scoringService } from '../services/scoringService.js';
import { timerService } from '../services/timerService.js';
import { CLIENT_EVENTS, SERVER_EVENTS } from './events.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`.green);

// ==================== WEBRTC SIGNALING (MEJORADO) ====================

// Almacenar peer IDs por sala
const voiceChatPeers = new Map(); // roomCode -> Map(socketId -> peerId)

socket.on('webrtc:join-voice', ({ roomCode, peerId }) => {
  try {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    // Inicializar Map de peers para esta sala si no existe
    if (!voiceChatPeers.has(roomCode)) {
      voiceChatPeers.set(roomCode, new Map());
    }

    const roomPeers = voiceChatPeers.get(roomCode);

    // Obtener lista de peers actuales (antes de agregar el nuevo)
    const existingPeers = Array.from(roomPeers.entries()).map(([socketId, peerId]) => {
      const p = room.getPlayer(socketId);
      return {
        peerId,
        socketId,
        peerName: p?.name || 'Jugador'
      };
    });

    // Agregar el nuevo peer
    roomPeers.set(socket.id, peerId);

     console.log(`🎤 ${player.name} joined voice (Peer: ${peerId})`.cyan);
    console.log(`   Socket ID: ${socket.id}`.gray);
    console.log(`   Total peers in room before: ${existingPeers.length}`.gray);
    console.log(`   Total peers in room after: ${roomPeers.size}`.gray);
    
    // Log de peers existentes
    if (existingPeers.length > 0) {
      console.log(`   Existing peers:`.yellow);
      existingPeers.forEach(p => {
        console.log(`     - ${p.peerName}: ${p.peerId}`.yellow);
      });
    }

    // 1. Enviar al nuevo jugador la lista de peers existentes
    console.log(`   📤 Sending existing peers to ${player.name}`.cyan);
    socket.emit('webrtc:existing-peers', {
      peers: existingPeers
    });

    // 2. Notificar a los demás sobre el nuevo peer
    console.log(`   📢 Broadcasting new peer to room: ${roomCode}`.cyan);
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
    const peerId = roomPeers.get(socket.id);
    
    roomPeers.delete(socket.id);
    
    console.log(`🔇 Peer ${socket.id} left voice chat`.gray);
    
    // Limpiar Map si está vacío
    if (roomPeers.size === 0) {
      voiceChatPeers.delete(roomCode);
    }
  }

  socket.to(roomCode).emit('webrtc:peer-left', {
    socketId: socket.id
  });
});

// Limpiar peers cuando un jugador se desconecta
socket.on('disconnect', () => {
  // Buscar y limpiar peer de todas las salas
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
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
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
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
      }
    });

    // ==================== INICIAR JUEGO ====================
    socket.on(CLIENT_EVENTS.START_GAME, ({ roomCode }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        if (room.host !== socket.id) {
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
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
      }
    });

    // ==================== SELECCIONAR LETRA ====================
    socket.on(CLIENT_EVENTS.SELECT_LETTER, ({ roomCode, letter }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        const selectedLetter = gameService.selectLetter(room, socket.id, letter);
        const player = room.getPlayer(socket.id);

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
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
      }
    });

    // ==================== ACTUALIZAR RESPUESTA EN TIEMPO REAL ====================
    socket.on('update_current_answer', ({ roomCode, category, value }) => {
      try {
        const room = roomService.getRoom(roomCode);
        if (!room) return;

        const player = room.getPlayer(socket.id);
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

        const player = room.getPlayer(socket.id);

        if (!player) {
          throw new Error('Jugador no encontrado');
        }

        const hasAnyAnswer = Object.values(player.currentAnswers || {}).some(
          answer => answer && answer.trim() !== ''
        );

        if (!hasAnyAnswer) {
          throw new Error('Debes llenar al menos una categoría antes de presionar STOP');
        }

        timerService.startCountdown(room, io, socket.id);

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

      } catch (error) {
        console.error(`❌ Error pressing stop: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
      }
    });

    // ==================== ENVIAR RESPUESTAS ====================
    socket.on(CLIENT_EVENTS.SUBMIT_ANSWERS, ({ roomCode, answers }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        const allSubmitted = gameService.submitAnswers(room, socket.id, answers);
        const player = room.getPlayer(socket.id);

        io.to(room.code).emit(SERVER_EVENTS.PLAYER_SUBMITTED, {
          playerId: socket.id,
          playerName: player.name
        });

        io.to(room.code).emit(SERVER_EVENTS.ROOM_UPDATED, {
          room: roomService.getRoomData(room)
        });

        if (allSubmitted && !room.countdownActive) {
          // *** Inicializar sistema de validaciones ***
          room.initializeValidations();

          io.to(room.code).emit(SERVER_EVENTS.START_DISCUSSION, {
            answers: timerService.getAllAnswers(room)
          });
        }

      } catch (error) {
        console.error(`❌ Error submitting answers: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
      }
    });

    // ==================== VOTAR EN RESPUESTA (NUEVO) ====================
    socket.on('vote_on_answer', ({ roomCode, playerId, category, vote }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        if (room.gameState !== 'discussion') {
          throw new Error('Solo puedes votar durante la fase de discusión');
        }

        const voter = room.getPlayer(socket.id);
        
        if (!voter) {
          throw new Error('Jugador no encontrado');
        }

        if (playerId === socket.id) {
          throw new Error('No puedes votar por tus propias respuestas');
        }

        // Registrar voto
        room.voteOnAnswer(playerId, category, socket.id, vote);

        // Obtener estadísticas actualizadas
        const stats = room.getValidationStats(playerId, category);

        // Notificar a todos
        io.to(room.code).emit('answer_vote_updated', {
          playerId,
          category,
          voterId: socket.id,
          voterName: voter.name,
          vote,
          stats
        });

        console.log(`🗳️  ${voter.name} voted ${vote || 'removed'} on ${playerId}'s ${category}`.cyan);

      } catch (error) {
        console.error(`❌ Error voting on answer: ${error.message}`.red);
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
      }
    });

    // ==================== OBTENER ESTADÍSTICAS DE VALIDACIÓN (NUEVO) ====================
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

        if (room.host !== socket.id) {
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
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
      }
    });

    // ==================== SIGUIENTE RONDA ====================
    socket.on(CLIENT_EVENTS.NEXT_ROUND, ({ roomCode }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        if (room.host !== socket.id) {
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
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
      }
    });

    // ==================== REINICIAR JUEGO ====================
    socket.on(CLIENT_EVENTS.RESTART_GAME, ({ roomCode }) => {
      try {
        const room = roomService.getRoom(roomCode);

        if (!room) {
          throw new Error('Sala no encontrada');
        }

        if (room.host !== socket.id) {
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
        socket.emit(SERVER_EVENTS.ERROR, {
          message: error.message
        });
      }
    });

    // ==================== SALIR DE LA SALA ====================
    socket.on(CLIENT_EVENTS.LEAVE_ROOM, ({ roomCode }) => {
      handlePlayerLeave(socket.id, roomCode);
    });

    // ==================== DISCONNECT ====================
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`.red);

      const room = roomService.getRoomByPlayerId(socket.id);

      if (room) {
        handlePlayerLeave(socket.id, room.code);
      }
    });

    // ==================== FUNCIÓN AUXILIAR: MANEJAR SALIDA ====================
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

  setInterval(() => {
    const roomCount = roomService.getRoomCount();
    let totalPlayers = 0;

    roomService.getAllRooms().forEach(room => {
      totalPlayers += room.playerCount;
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.gray);
    console.log(`📊 Stats: ${roomCount} rooms, ${totalPlayers} players`.cyan);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.gray);
  }, 5 * 60 * 1000);
};