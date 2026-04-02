# Dino-Crash Multiplayer

A multiplayer implementation of the classic Chrome Dino game with real-time online gameplay and bot opponents.

## Features

- **Solo Mode**: Classic single-player game
- **VS Bot Mode**: Play against an AI opponent with realistic mistakes and reaction delays
- **Online Multiplayer**: Real-time multiplayer using WebSocket (Socket.io)
- **Dual-Lane Layout**: Side-by-side gameplay with independent game instances
- **Deterministic Obstacles**: Both players face identical obstacles using seeded random generation
- **Automatic Matchmaking**: Queue-based system with automatic bot assignment after 5 seconds

## Architecture

### Backend (Node.js + Socket.io)
- **Server-Authoritative**: Server manages game rooms and matchmaking
- **Deterministic RNG**: Same seed generates identical obstacles for both players
- **Queue-based Matchmaking**: Automatic player pairing with bot fallback

### Frontend (React Native + Expo)
- **MultiplayerGameEngine**: Manages two synchronized game instances
- **Split-Screen**: Two independent game views side by side
- **Client-Prediction**: Local inputs applied immediately, server validates
- **Touch Controls**: Left/right screen halves for respective players

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Expo CLI
- iOS/Android development environment (or use Expo Go app)

### 1. Install Client Dependencies

```bash
npm install
```

The following packages are already installed:
- `socket.io-client` - WebSocket client
- `seedrandom` - Deterministic random number generation

### 2. Install Server Dependencies

```bash
cd server
npm install
```

This installs:
- `express` - HTTP server
- `socket.io` - WebSocket server
- `cors` - CORS middleware
- TypeScript and type definitions

### 3. Start the Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3001`

You can check server health at: `http://localhost:3001/health`

### 4. Start the Client

In a new terminal, from the project root:

```bash
npm start
```

Then choose your platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on your device

## How to Play

### Solo Mode
1. Go to "Menu" tab
2. Select "Play Solo"
3. Tap screen to jump, avoid obstacles

### VS Bot Mode
1. Go to "Menu" tab
2. Select "Play vs Bot"
3. You control the left lane, bot controls the right lane
4. First player to crash loses

### Online Multiplayer
1. Go to "Menu" tab
2. Select "Play Online"
3. Wait for matchmaking (max 5 seconds before bot is assigned)
4. When matched, game starts automatically
5. Control your assigned lane (indicated by green border)
6. First player to crash loses

## Game Controls

- **Tap/Click**: Jump
- **Left side of screen**: Player 1 controls
- **Right side of screen**: Player 2 controls

## File Structure

```
Dino-Crash/
├── server/                      # Backend server
│   ├── src/
│   │   ├── index.ts            # Express + Socket.io server
│   │   ├── GameRoom.ts         # Game session management
│   │   ├── MatchmakingQueue.ts # Player pairing logic
│   │   └── BotAI.ts            # Server-side bot AI
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # Shared types (client/server)
│   └── network-types.ts        # Network protocol types
│
├── game/                        # Game logic
│   ├── GameEngine.ts           # Single-player engine (now with seed support)
│   ├── MultiplayerGameEngine.ts # Dual-engine wrapper
│   ├── systems/
│   │   └── SpawnSystem.ts      # Modified for seeded RNG
│   ├── network/
│   │   └── NetworkManager.ts   # Socket.io client wrapper
│   ├── ai/
│   │   └── BotPlayer.ts        # Client-side bot AI
│   └── components/
│       └── PlayerLane.tsx      # Individual player lane UI
│
└── app/                         # UI screens
    ├── (tabs)/
    │   ├── index.tsx           # Solo game screen
    │   └── menu.tsx            # Mode selection screen
    ├── lobby.tsx               # Matchmaking screen
    └── multiplayer.tsx         # Multiplayer game screen
```

## Network Protocol

### Client → Server Events

- `find_match`: Request matchmaking
  ```typescript
  { gameMode: 'SOLO' | 'VS_BOT' | 'VS_ONLINE' }
  ```

- `player_input`: Send player input
  ```typescript
  { roomId: string, input: PlayerInput, timestamp: number }
  ```

- `player_crash`: Notify when player crashes
  ```typescript
  { roomId: string, playerId: string, timestamp: number }
  ```

### Server → Client Events

- `game_start`: Game begins
  ```typescript
  {
    roomId: string,
    seed: number,
    playerId: 'player1' | 'player2',
    opponentId: string,
    isBot: boolean
  }
  ```

- `opponent_input`: Opponent made an action
  ```typescript
  { input: PlayerInput, timestamp: number }
  ```

- `game_over`: Game ended
  ```typescript
  {
    winnerId: 'player1' | 'player2',
    player1Score: number,
    player2Score: number,
    reason: 'CRASH' | 'DISCONNECT'
  }
  ```

## Bot AI Behavior

The bot has intentional imperfections to make it beatable:

- **Reaction Delay**: 300-600ms delay before reacting
- **Mistake Chance**: 15% chance to not react to an obstacle
- **Decision Interval**: Makes decisions every 200ms
- **Strategy**: 80% prefer ducking for pterodactyls, 20% attempt jump

## Deterministic Obstacle Generation

Both players see identical obstacles using seeded random number generation:

1. Server generates a random seed when game starts
2. Seed is sent to both clients in `game_start` event
3. Both `GameEngine` instances use the same seed
4. `SpawnSystem` uses `seedrandom` library instead of `Math.random()`
5. All random decisions (obstacle type, position, gaps) are deterministic

## Testing

### Local Testing (VS Bot)

1. Start the client only (no server needed)
2. Navigate to Menu → Play vs Bot
3. Game starts immediately with local bot

### Online Testing (Two Players)

1. Start the server: `cd server && npm run dev`
2. Open two browser tabs or two devices
3. Both navigate to Menu → Play Online
4. Wait for automatic pairing (should be instant)
5. Game starts with synced obstacles

### Bot Fallback Testing

1. Start server
2. Open one client
3. Navigate to Play Online
4. After 5 seconds, a bot is automatically assigned
5. Game starts as VS Bot mode

## Configuration

### Server Port

Change server port in `server/src/index.ts`:
```typescript
const PORT = process.env.PORT || 3001;
```

### Client Server URL

Change server URL in `app/lobby.tsx`:
```typescript
const SERVER_URL = 'http://localhost:3001';
```

For production, use your deployed server URL.

### Bot Difficulty

Adjust bot parameters in `game/ai/BotPlayer.ts`:
```typescript
private reactionDelay: number = 400;  // ms (300-600)
private mistakeChance: number = 0.15; // 15%
```

### Matchmaking Timeout

Change bot assignment delay in `server/src/MatchmakingQueue.ts`:
```typescript
private botAssignmentDelay: number = 5000; // 5 seconds
```

## Deployment

### Server Deployment

Deploy to platforms like:
- **Render.com**: Easy WebSocket support
- **Railway.app**: Good for real-time apps
- **Heroku**: With websocket support
- **AWS EC2**: Full control

Update client `SERVER_URL` to your deployed server.

### Client Deployment

Build for production:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Run `lsof -i :3001` and kill the process
- Or change the port in server configuration

### Client can't connect to server
- Ensure server is running (`cd server && npm run dev`)
- Check SERVER_URL matches your server address
- For mobile devices, use your computer's IP instead of localhost

### Obstacles don't match between players
- Verify both clients received the same seed (check logs)
- Ensure SpawnSystem is using seeded RNG, not Math.random()

### Bot doesn't respond
- Check BotPlayer is initialized in MultiplayerGameEngine
- Verify `isBot` flag is set correctly
- Check browser console for errors

## Known Limitations

- Online multiplayer requires server to be running
- No reconnection handling (disconnect = loss)
- No spectator mode
- Maximum 2 players per game

## Future Enhancements

- Friend invitation system (room codes)
- Multiple bot difficulty levels
- Leaderboard and statistics
- Power-ups and special abilities
- Multiple obstacle themes
- Lobby chat
- Replay system

## License

MIT

## Credits

Based on the Chrome Dino game (T-Rex Runner) by Google Chrome team.
