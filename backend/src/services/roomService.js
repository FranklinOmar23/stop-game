import { Room } from '../models/Room.js';
import { Player } from '../models/Player.js';
import { generateUniqueRoomCode } from '../utils/roomCodeGenerator.js';
import { validatePlayerName, validateRoomCode } from '../utils/validators.js';
import { GAME_CONFIG } from '../utils/constants.js';

class RoomService {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room
    this.roomExpirationTimers = new Map(); // roomCode -> Timer
  }

  createRoom(socketId, playerName) {
    const nameValidation = validatePlayerName(playerName);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }

    const roomCode = generateUniqueRoomCode(this.rooms);
    const player = new Player(socketId, nameValidation.name);
    const room = new Room(roomCode, player.id); // Usar player.id como host
    
    room.addPlayer(player);
    this.rooms.set(roomCode, room);

    console.log(`✅ Room created: ${roomCode} by ${playerName}`.green);
    console.log(`   Player ID: ${player.id}`.gray);
    console.log(`   Socket ID: ${socketId}`.gray);
    
    return { room, player };
  }

  joinRoom(roomCode, socketId, playerName) {
    const codeValidation = validateRoomCode(roomCode);
    if (!codeValidation.valid) {
      throw new Error(codeValidation.error);
    }

    const nameValidation = validatePlayerName(playerName);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }

    const room = this.rooms.get(codeValidation.code);
    
    if (!room) {
      throw new Error('Sala no encontrada');
    }

    // Cancelar timer de expiración si existe
    this.cancelExpirationTimer(codeValidation.code);

    if (room.getPlayerCount() >= GAME_CONFIG.MAX_PLAYERS) {
      throw new Error('Sala llena');
    }

    if (room.gameState !== 'lobby') {
      throw new Error('Juego en progreso');
    }

    // Verificar si el nombre ya existe
    const nameExists = room.getAllPlayers().some(
      p => p.name.toLowerCase() === nameValidation.name.toLowerCase()
    );
    
    if (nameExists) {
      throw new Error('Este nombre ya está en uso en esta sala');
    }

    const player = new Player(socketId, nameValidation.name);
    room.addPlayer(player);

    console.log(`✅ Player joined: ${playerName} -> Room ${roomCode}`.cyan);
    console.log(`   Player ID: ${player.id}`.gray);
    console.log(`   Socket ID: ${socketId}`.gray);

    return { room, player };
  }

  leaveRoom(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    
    if (!room) return null;

    const player = room.getPlayer(playerId);
    room.removePlayer(playerId);

    console.log(`👋 Player left: ${player?.name || playerId} from Room ${roomCode}`.yellow);

    // Si la sala está vacía, programar eliminación en 5 minutos
    if (room.isEmpty()) {
      this.scheduleRoomExpiration(roomCode);
    }

    return room;
  }

  // Programar eliminación de sala vacía
  scheduleRoomExpiration(roomCode) {
    this.cancelExpirationTimer(roomCode);

    const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutos
    
    const timer = setTimeout(() => {
      const room = this.getRoom(roomCode);
      if (room && room.isEmpty()) {
        console.log(`🗑️  Eliminando sala vacía: ${roomCode}`.yellow);
        this.rooms.delete(roomCode);
        this.roomExpirationTimers.delete(roomCode);
      }
    }, EXPIRATION_TIME);

    this.roomExpirationTimers.set(roomCode, timer);
    console.log(`⏰ Sala ${roomCode} se eliminará en 5 minutos si sigue vacía`.yellow);
  }

  // Cancelar timer de expiración
  cancelExpirationTimer(roomCode) {
    const timer = this.roomExpirationTimers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      this.roomExpirationTimers.delete(roomCode);
      console.log(`⏹️  Timer de expiración cancelado para sala ${roomCode}`.cyan);
    }
  }

  // Eliminar sala inmediatamente
  deleteRoom(roomCode) {
    this.cancelExpirationTimer(roomCode);
    this.rooms.delete(roomCode);
    console.log(`🗑️  Room deleted: ${roomCode}`.red);
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  // Buscar sala por player.id
  getRoomByPlayerId(playerId) {
    for (const room of this.rooms.values()) {
      if (room.getPlayer(playerId)) {
        return room;
      }
    }
    return null;
  }

  // NUEVO: Buscar sala por socketId
  getRoomBySocketId(socketId) {
    for (const room of this.rooms.values()) {
      const player = room.getPlayerBySocketId(socketId);
      if (player) {
        return room;
      }
    }
    return null;
  }

  getRoomData(room) {
    return room.toJSON();
  }

  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => room.toJSON());
  }

  getRoomCount() {
    return this.rooms.size;
  }

  // Limpiar salas inactivas
  cleanupInactiveRooms() {
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    for (const [code, room] of this.rooms.entries()) {
      const inactiveTime = now - room.lastActivity;
      
      if (inactiveTime > TWO_HOURS) {
        console.log(`🧹 Limpiando sala inactiva: ${code} (${Math.floor(inactiveTime / 60000)} minutos)`.gray);
        this.deleteRoom(code);
      }
    }
  }

  // Obtener estadísticas
  getStats() {
    let emptyRooms = 0;
    let activeRooms = 0;
    let totalPlayers = 0;

    for (const room of this.rooms.values()) {
      if (room.isEmpty()) {
        emptyRooms++;
      } else {
        activeRooms++;
        totalPlayers += room.getPlayerCount();
      }
    }

    return {
      totalRooms: this.rooms.size,
      activeRooms,
      emptyRooms,
      totalPlayers,
      pendingDeletions: this.roomExpirationTimers.size
    };
  }
}

export const roomService = new RoomService();

// Limpiar salas inactivas cada hora
setInterval(() => {
  console.log('🔍 Iniciando limpieza de salas inactivas...'.cyan);
  roomService.cleanupInactiveRooms();
  
  const stats = roomService.getStats();
  console.log(`📊 Estadísticas: ${stats.activeRooms} salas activas, ${stats.emptyRooms} vacías, ${stats.totalPlayers} jugadores`.cyan);
}, 60 * 60 * 1000); // Cada hora

// Mostrar estadísticas cada 30 minutos
setInterval(() => {
  const stats = roomService.getStats();
  if (stats.totalRooms > 0) {
    console.log(`📊 Salas: ${stats.activeRooms} activas | ${stats.emptyRooms} vacías | ${stats.pendingDeletions} programadas para eliminación`.blue);
  }
}, 30 * 60 * 1000); // Cada 30 minutos