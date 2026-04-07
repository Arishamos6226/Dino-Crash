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
    if (gameMode !== GameMode.VS_ONLINE) return;

    const pairedRoom = this.tryPairPlayers(socket);

    if (pairedRoom) {
      pairedRoom.start();
      return;
    }

    const queuedPlayer: QueuedPlayer = {
      socket,
      gameMode,
      queuedAt: Date.now()
    };

    this.waitingPlayers.set(socket.id, queuedPlayer);
    socket.emit('matchmaking_status', { status: 'searching' });
  }

  private tryPairPlayers(newPlayer: Socket): GameRoom | null {
    for (const [socketId, queuedPlayer] of this.waitingPlayers.entries()) {
      if (queuedPlayer.gameMode === GameMode.VS_ONLINE) {
        this.waitingPlayers.delete(socketId);

        const room = new GameRoom(this.io, queuedPlayer.socket, newPlayer);
        this.activeRooms.set(room.getRoomId(), room);

        return room;
      }
    }

    return null;
  }

  removePlayer(socket: Socket) {
    this.waitingPlayers.delete(socket.id);
  }

  getActiveRoomCount(): number {
    return this.activeRooms.size;
  }

  getQueueSize(): number {
    return this.waitingPlayers.size;
  }
}
