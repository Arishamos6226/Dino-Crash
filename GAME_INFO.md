# Chrome Dino Game - React Native

A faithful recreation of Chrome's offline dinosaur game built with React Native and Expo.

## 🎮 How to Play

### Controls
- **Space / Arrow Up / Tap** - Make the dino jump
- **Arrow Down** - Make the dino duck (to avoid flying pterodactyls)

### Objective
- Jump over or duck under obstacles
- Survive as long as possible
- Beat your high score!

## 🚀 Running the Game

```bash
# Start the development server
npm start

# Then choose your platform:
# Press 'w' for web browser
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
```

## ✨ Features

- ✅ Authentic Chrome dino sprites
- ✅ Animated running dino
- ✅ Jump and duck mechanics
- ✅ Multiple obstacle types:
  - Small cacti (3 variants)
  - Large cacti (3 variants)
  - Flying pterodactyls (appear at higher speeds)
- ✅ Animated pterodactyls with flapping wings
- ✅ Background clouds
- ✅ Progressive difficulty (speed increases over time)
- ✅ Distance-based scoring
- ✅ High score tracking
- ✅ Precise collision detection
- 🔜 Night mode (coming soon)
- 🔜 Sound effects (coming soon)

## 🎯 Game Mechanics

- **Speed**: Starts at 6, increases to max of 13
- **Score**: Based on distance traveled
- **Pterodactyls**: Only appear when speed > 8.5
- **Collision**: Uses precise multi-box collision detection matching the original game

## 📝 Coordinate System

The game uses a coordinate system where:
- `y = 0` is ground level
- `y > 0` is height above ground
- Game area is 600×150 pixels
- Ground is 12 pixels high

## 🐛 Known Issues

If you encounter any issues:
1. Make sure all dependencies are installed: `npm install`
2. Clear the cache: `npx expo start -c`
3. Check that the sprite sheet was downloaded: `assets/images/sprites/sprite.png`

Enjoy the game! 🦖
