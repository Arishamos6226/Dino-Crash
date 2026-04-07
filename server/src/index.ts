import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MatchmakingQueue } from './MatchmakingQueue';
import { FindMatchPayload } from '../../shared/network-types';

const app = express();
const httpServer = createServer(app);

app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const matchmakingQueue = new MatchmakingQueue(io);
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: matchmakingQueue.getActiveRoomCount(),
    queueSize: matchmakingQueue.getQueueSize()
  });
});

io.on('connection', (socket) => {
  socket.on('find_match', (payload: FindMatchPayload) => {
    matchmakingQueue.addPlayer(socket, payload.gameMode);
  });

  socket.on('disconnect', () => {
    matchmakingQueue.removePlayer(socket);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Dino-Crash Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});
