import { Server, Socket } from 'socket.io';
import { GameMode } from '../../shared/network-types';
import { GameRoom } from './GameRoom';

interface QueuedPlayer {
  socket: Socket;
  gameMode: GameMode;
  queuedAt: number;
}

export class MatchmakingQueue {
  private io: Server;
  private waitingPlayers: Map<string, QueuedPlayer> = new Map();
  private activeRooms: Map<string, GameRoom> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  addPlayer(socket: Socket, gameMode: GameMode) {
    console.log(`Player ${socket.id} joined queue for ${gameMode}`);

    // For online mode, try to pair with waiting player
    if (gameMode === GameMode.VS_ONLINE) {
      const pairedRoom = this.tryPairPlayers(socket);

      if (pairedRoom) {
        console.log(`Paired ${socket.id} with another player`);
        pairedRoom.start();
        return;
      }

      // No pair found, add to queue
      const queuedPlayer: QueuedPlayer = {
        socket,
        gameMode,
        queuedAt: Date.now()
      };

      this.waitingPlayers.set(socket.id, queuedPlayer);

      // Notify player they're in queue
      socket.emit('matchmaking_status', { status: 'searching' });
    }
  }

  private tryPairPlayers(newPlayer: Socket): GameRoom | null {
    // Find first waiting player
    for (const [socketId, queuedPlayer] of this.waitingPlayers.entries()) {
      if (queuedPlayer.gameMode === GameMode.VS_ONLINE) {
        // Remove from queue
        this.waitingPlayers.delete(socketId);

        // Create game room
        const room = new GameRoom(this.io, queuedPlayer.socket, newPlayer);
        this.activeRooms.set(room.getRoomId(), room);

        return room;
      }
    }

    return null;
  }

  removePlayer(socket: Socket) {
    const queuedPlayer = this.waitingPlayers.get(socket.id);

    if (queuedPlayer) {
      this.waitingPlayers.delete(socket.id);
      console.log(`Player ${socket.id} removed from queue`);
    }
  }

  getActiveRoomCount(): number {
    return this.activeRooms.size;
  }

  getQueueSize(): number {
    return this.waitingPlayers.size;
  }
}
