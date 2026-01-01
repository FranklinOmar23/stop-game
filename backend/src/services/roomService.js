import { Room } from '../models/Room.js';
import { Player } from '../models/Player.js';
import { generateUniqueRoomCode } from '../utils/roomCodeGenerator.js';
import { validatePlayerName, validateRoomCode } from '../utils/validators.js';
import { GAME_CONFIG } from '../utils/constants.js';

class RoomService {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room
  }

  createRoom(hostId, playerName) {
    const nameValidation = validatePlayerName(playerName);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }

    const roomCode = generateUniqueRoomCode(this.rooms);
    const room = new Room(roomCode, hostId);
    const player = new Player(hostId, nameValidation.name);
    
    room.addPlayer(player);
    this.rooms.set(roomCode, room);

    console.log(`✅ Room created: ${roomCode} by ${playerName}`.green);
    
    return { room, player };
  }

  joinRoom(roomCode, playerId, playerName) {
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

    const player = new Player(playerId, nameValidation.name);
    room.addPlayer(player);

    console.log(`✅ Player joined: ${playerName} -> Room ${roomCode}`.cyan);

    return { room, player };
  }

  leaveRoom(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    
    if (!room) return null;

    const player = room.getPlayer(playerId);
    room.removePlayer(playerId);

    console.log(`👋 Player left: ${player?.name || playerId} from Room ${roomCode}`.yellow);

    // Si la sala está vacía, eliminarla
    if (room.isEmpty()) {
      this.rooms.delete(roomCode);
      console.log(`🗑️  Room deleted: ${roomCode}`.red);
      return null;
    }

    return room;
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  getRoomByPlayerId(playerId) {
    for (const room of this.rooms.values()) {
      if (room.getPlayer(playerId)) {
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

  // Limpiar salas inactivas (más de 2 horas sin actividad)
  cleanupInactiveRooms() {
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;

    for (const [code, room] of this.rooms.entries()) {
      if (now - room.lastActivity > twoHours) {
        this.rooms.delete(code);
        console.log(`🧹 Cleaned up inactive room: ${code}`.gray);
      }
    }
  }
}

export const roomService = new RoomService();

// Limpiar salas inactivas cada hora
setInterval(() => {
  roomService.cleanupInactiveRooms();
}, 60 * 60 * 1000);