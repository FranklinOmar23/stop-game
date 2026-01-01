import { roomService } from '../services/roomService.js';
import { gameService } from '../services/gameService.js';
import { scoringService } from '../services/scoringService.js';
import { timerService } from '../services/timerService.js';
import { CLIENT_EVENTS, SERVER_EVENTS } from './events.js';

export const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.id}`.green);

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

                // Notificar a todos los jugadores
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

                // Actualizar la respuesta actual del jugador
                player.updateCurrentAnswer(category, value);

                console.log(`📝 ${player.name} updated ${category}: ${value}`.gray);

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

                // *** LOG PARA DEBUG ***
                console.log(`🔍 Player ${player.name} current answers:`, player.currentAnswers);

                // *** VERIFICAR que el jugador tenga al menos alguna respuesta ***
                const hasAnyAnswer = Object.values(player.currentAnswers || {}).some(
                    answer => answer && answer.trim() !== ''
                );

                console.log(`🔍 Has any answer: ${hasAnyAnswer}`);

                if (!hasAnyAnswer) {
                    throw new Error('Debes llenar al menos una categoría antes de presionar STOP');
                }

                // Iniciar countdown
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

                // Si todos enviaron y NO hay countdown activo, iniciar discusión
                if (allSubmitted && !room.countdownActive) {
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

        // ==================== DESAFIAR RESPUESTA ====================
        socket.on(CLIENT_EVENTS.CHALLENGE_ANSWER, ({ roomCode, category, challengedPlayerId }) => {
            try {
                const room = roomService.getRoom(roomCode);

                if (!room) {
                    throw new Error('Sala no encontrada');
                }

                const challengeData = scoringService.challengeAnswer(
                    room,
                    socket.id,
                    category,
                    challengedPlayerId
                );

                io.to(room.code).emit(SERVER_EVENTS.ANSWER_CHALLENGED, {
                    ...challengeData,
                    challengerId: socket.id
                });

            } catch (error) {
                console.error(`❌ Error challenging answer: ${error.message}`.red);
                socket.emit(SERVER_EVENTS.ERROR, {
                    message: error.message
                });
            }
        });

        // ==================== APROBAR RESPUESTA ====================
        socket.on(CLIENT_EVENTS.APPROVE_ANSWER, ({ roomCode, playerId, category }) => {
            try {
                const room = roomService.getRoom(roomCode);

                if (!room) {
                    throw new Error('Sala no encontrada');
                }

                scoringService.approveAnswer(room, playerId, category);

                io.to(room.code).emit(SERVER_EVENTS.ANSWER_APPROVED, {
                    playerId,
                    category
                });

            } catch (error) {
                console.error(`❌ Error approving answer: ${error.message}`.red);
                socket.emit(SERVER_EVENTS.ERROR, {
                    message: error.message
                });
            }
        });

        // ==================== RECHAZAR RESPUESTA ====================
        socket.on(CLIENT_EVENTS.REJECT_ANSWER, ({ roomCode, playerId, category }) => {
            try {
                const room = roomService.getRoom(roomCode);

                if (!room) {
                    throw new Error('Sala no encontrada');
                }

                const rejectionData = scoringService.rejectAnswer(room, playerId, category);

                io.to(room.code).emit(SERVER_EVENTS.ANSWER_REJECTED, {
                    ...rejectionData
                });

            } catch (error) {
                console.error(`❌ Error rejecting answer: ${error.message}`.red);
                socket.emit(SERVER_EVENTS.ERROR, {
                    message: error.message
                });
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

            // Buscar sala del jugador
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

                // Detener countdown si existe
                timerService.clearTimer(roomCode);

                const updatedRoom = roomService.leaveRoom(roomCode, playerId);

                if (!updatedRoom) {
                    // Sala eliminada
                    console.log(`🗑️  Room ${roomCode} was deleted`.gray);
                    return;
                }

                // Notificar a los demás jugadores
                io.to(roomCode).emit(SERVER_EVENTS.PLAYER_LEFT, {
                    playerId,
                    playerName,
                    newHost: updatedRoom.host
                });

                io.to(roomCode).emit(SERVER_EVENTS.ROOM_UPDATED, {
                    room: roomService.getRoomData(updatedRoom)
                });

                // Si el juego estaba en curso y quedan menos de 2 jugadores, resetear
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

    // Logging de estadísticas cada 5 minutos
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