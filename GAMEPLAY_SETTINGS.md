# Gameplay Settings

## Current Game Balance

### Speed Progression
- **Initial Speed**: 4 (slow start, easy to learn)
- **Max Speed**: 13 (challenging late game)
- **Acceleration**: 0.0008 per frame (gradual increase)
- **Time to Max Speed**: ~2-3 minutes of gameplay

### Obstacle Spacing
- **Base Gap**: 500px (very generous)
- **Minimum Gap**: 350px (always safe to react)
- **Random Variation**: 20-80% extra space
- **Speed-Based**: Slower speeds = larger gaps

At speed 4: Gaps average ~1000-1250px
At speed 7: Gaps average ~700-900px
At speed 13: Gaps average ~350-550px

### Obstacle Types

#### Cacti (Always Available)
- **Small Cactus**: 17px wide, 35px tall
  - 3 visual variants
- **Large Cactus**: 25-75px wide, 50px tall
  - 3 visual variants

#### Pterodactyls (Birds)
- **When They Appear**: Speed ≥ 7.0
  - This happens after ~15-20 seconds of gameplay
- **Spawn Chance**: 50% when speed threshold is met
- **Flying Heights**: 3 different heights (low, medium, high)
- **Size**: 46px wide, 40px tall
- **Animation**: Wing flapping at 6 FPS

### Game Start
- **Initial Delay**: 1 second before first obstacle
- **No Obstacles**: Clean screen when you start
- **First Obstacle**: Appears after 1-2 seconds

### Difficulty Curve

**Early Game (0-20 seconds)**
- Speed: 4-6
- Only cacti
- Very large gaps
- Easy to learn controls

**Mid Game (20-60 seconds)**
- Speed: 6-9
- Cacti + pterodactyls start appearing
- Moderate gaps
- Need to start using duck

**Late Game (60+ seconds)**
- Speed: 9-13
- All obstacle types
- Tighter gaps
- Requires quick reflexes
- Pterodactyls appear frequently

## Performance
- **FPS**: 60 (using requestAnimationFrame)
- **Max Obstacles on Screen**: 3
- **Physics Updates**: Every frame with delta time

## Tips for Players
1. Jump early rather than late
2. Duck under high-flying pterodactyls
3. Watch the rhythm of obstacles
4. Speed increases gradually - adapt as you play
5. Pterodactyls appear after ~15-20 seconds

## Future Enhancements
- [ ] Night mode (color inversion every 700 points)
- [ ] Sound effects (jump, score, crash)
- [ ] Achievement milestones (every 100 points)
- [ ] Moon phases during night mode
- [ ] More obstacle variety
