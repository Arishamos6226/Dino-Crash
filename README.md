# Dino-Crash

Ein 1v1 Online-Multiplayer-Spiel mit Echtzeit-Wetteinsätzen, inspiriert vom Chrome Dino Runner. Gebaut mit **Expo (React Native)** — eine einzige Codebasis läuft auf iOS, Android und Web.

---

## Spielbeschreibung

Dino-Crash ist ein kompetitives Endless-Runner-Spiel, bei dem zwei Spieler gleichzeitig gegeneinander antreten. Jeder Spieler sieht seinen eigenen Lane sowie den Lane des Gegners — live synchronisiert über WebSockets.

### Steuerung

| Aktion | Mobile | Web/Desktop |
|---|---|---|
| Springen | Kurzer Tap | Space / ArrowUp |
| Ducken | Halten (200ms+) | ArrowDown (halten) |

### Hindernisse

- **Kleiner Kaktus** — niedrig, Sprung genügt
- **Grosser Kaktus** — höher, Timing wichtiger
- **Pterodactyl** — fliegendes Hindernis auf variabler Höhe, erfordert Ducken oder gezieltes Springen

Die Spielgeschwindigkeit steigt kontinuierlich — je länger das Spiel läuft, desto anspruchsvoller wird es.

### Solo-Modus

Klassischer Endless-Runner: so weit wie möglich kommen, Highscore schlagen.

### Multiplayer-Modus

Beide Spieler spielen mit denselben Hindernissen (deterministisches Seeding). Wer länger überlebt oder mehr Punkte erzielt, gewinnt. Die Gegner-Lane ist live sichtbar — man sieht in Echtzeit, wie der Gegner spielt und wann er crasht.

---

## Gambling-Logik im Multiplayer

Vor jedem Multiplayer-Spiel durchlaufen die Spieler eine **Betting-Phase**, die über ein Challenge-System funktioniert.

### Ablauf

1. **Player 1** wählt einen Einsatz: 1 / 2 / 5 / 10 / 20 Fr.
2. **Player 2** erhält die Challenge und kann **annehmen** oder **ablehnen**
3. Bei Annahme: Der Einsatz wird bei beiden Spielern abgezogen, der Pot (`Einsatz × 2`) ist live sichtbar
4. Das Spiel startet — wer gewinnt, bekommt den Pot

### Gewinner-Bestimmung

- Wer länger überlebt, gewinnt den Pot
- Bei gleichzeitigem Crash: wer mehr Punkte hat, gewinnt
- Bei Disconnect: der verbliebene Spieler gewinnt automatisch

### Bonus-Mechanik

Die Gambling-Logik endet nicht beim Crash des Gegners. Ein **Bonus-System** incentiviert den Überlebenden, nach dem Gegner-Crash weiterzuspielen:

```
Bonus = ⌊(eigener Score − Gegner-Crash-Score) / 500⌋ × Einsatz
```

**Beispiel:**
- Einsatz: 5 Fr. → Pot: 10 Fr.
- Gegner crasht bei Score 1000
- Du spielst weiter bis Score 2500
- Vorsprung: 1500 → 3 Milestones × 5 Fr. = **15 Fr. Bonus**
- Gesamtgewinn: Pot 10 Fr. + Bonus 15 Fr. = **25 Fr.**

Während der Überlebende weiterspielt, zeigt die UI live den aufgelaufenen Bonus an — von "Scoring..." bis "+15 Fr.". Das Game-Over-Screen zeigt die genaue Aufschlüsselung: `Pot + N × Einsatz Bonus`.

Diese Mechanik schafft einen Spannungsbogen, der über den Crash des Gegners hinausgeht: wer nach dem Gegner-Crash aufhört zu spielen, lässt potenzielle Boni liegen.

---

## Warum React Native / Expo?

### Die Entscheidung

Ein Spiel mit Echtzeit-Multiplayer auf Mobile zu bauen stellt spezifische Anforderungen: 60 FPS Game Loop, Netzwerk-Integration, responsives Layout auf verschiedenen Geräten, Cross-Platform-Support. React Native mit Expo war aus folgenden Gründen die richtige Wahl:

**Cross-Platform aus einer Codebasis**
Dieselbe Codebasis läuft auf iOS, Android und im Web-Browser. Ohne Expo würden separate Native-Apps für jede Plattform nötig sein.

**Native Performance — kein WebView**
React Native rendert echte native UI-Komponenten — kein HTML in einer WebView. Das ist entscheidend für einen flüssigen 60-FPS-Game-Loop, der direkt mit dem Display-Refresh-Zyklus des Geräts synchronisiert ist.

**Expo Router — Navigation ohne Konfiguration**
File-based Routing wie Next.js: der Dateiname ist die Route. Keine manuell konfigurierte Navigator-Hierarchie nötig.

**TypeScript Out-of-the-Box**
Typsichere Interfaces zwischen Game Engine, Netzwerk-Layer und UI — ohne Build-Setup-Aufwand.

**Hot Reload / Fast Refresh**
Während der Entwicklung live Änderungen sehen ohne App-Neustart — kritisch für iteratives Game-Design.

---

## React Native Spezialitäten im Einsatz

### `requestAnimationFrame` — Der Game Loop

```typescript
useEffect(() => {
  let animationFrameId: number;
  const gameLoop = () => {
    engineRef.current.update(FIXED_STEP_MS); // Physik-Tick (16.67ms)
    setRenderState(engineRef.current.getState()); // → React re-render
    animationFrameId = requestAnimationFrame(gameLoop);
  };
  animationFrameId = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(animationFrameId); // Cleanup
}, [engineStarted]);
```

`requestAnimationFrame` ist in React Native nativ implementiert und synchronisiert den Loop mit dem Display-Refresh des Geräts (60 Hz). Das garantiert ruckelfreies Rendering ohne Timer-Drift.

**Warum nicht `setInterval`?** Ein Interval-basierter Loop wird durch den JS-Thread blockiert und ist nicht mit dem Display-Refresh synchronisiert — das führt zu sichtbarem Ruckeln bei einem Spiel.

---

### `useRef` — Engine-Instanz ohne Re-Render

```typescript
const engineRef = useRef<MultiplayerGameEngine | null>(null);
if (!engineRef.current) {
  engineRef.current = new MultiplayerGameEngine(seed, playerId);
}
```

`useRef` hält die Game-Engine-Instanz über alle Re-Renders hinweg am Leben, **ohne** selbst einen Re-Render zu triggern. Mit `useState` würde die Engine bei jedem Frame-Update neu erstellt — der interne Spielzustand (Dino-Position, Hindernisse, Score) ginge verloren.

Auch Netzwerk-Flags (`crashSentRef`, `accumulatorRef`) und Timer-IDs werden als Refs gespeichert, da sie keine UI-Updates benötigen.

---

### `useWindowDimensions` — Responsives Skalieren

```typescript
const { width: windowWidth, height: windowHeight } = useWindowDimensions();
const scale = gameWidth / GAME.WIDTH; // GAME.WIDTH = 600px (fix)
```

Die Spielwelt hat eine feste interne Auflösung (600×150px). `useWindowDimensions` liefert live die echten Bildschirmabmessungen — bei Rotation, Fenstergrössenänderung im Web oder verschiedenen Gerätegrössen reagiert das Spiel sofort.

**Warum wichtig:** Mobile Geräte haben extrem unterschiedliche Bildschirmgrössen (iPhone SE bis iPad Pro). Ohne responsives Scaling würde das Spiel auf grossen Bildschirmen winzig und auf kleinen abgeschnitten aussehen.

---

### `StyleSheet` + `position: absolute` — Sprites ohne Canvas

```typescript
<View style={{
  position: 'absolute',
  bottom: GAME.GROUND_HEIGHT + dino.y,
  left: dino.x,
}}>
  <DinoSprite status={dino.status} />
</View>
```

Statt Canvas/WebGL werden Sprites als absolut positionierte React Native Views gerendert. Die gesamte Spielwelt wird mit einem einzigen `scale`-Transform skaliert:

```typescript
<View style={{ transform: [{ translateX }, { translateY }, { scale }] }}>
  {/* Gesamte Spielwelt — alle Sprites darin */}
</View>
```

**Warum nicht Canvas?** Canvas-API ist in React Native nicht nativ vorhanden (nur via externe Libraries wie Skia). Mit `position: absolute` und CSS-Transforms nutzen wir den nativen Layout-Engine des Betriebssystems — performant, ohne externe Dependencies, und mit vollem Zugriff auf React Native's Styling-System.

---

### `Platform.OS` — Plattformspezifisches Verhalten aus einer Codebasis

```typescript
// Verschiedene Server-URLs je nach Plattform
const SERVER_URL = Platform.OS === 'web'
  ? 'http://localhost:3001'
  : 'http://192.168.1.107:3001';

// Keyboard-Events nur im Web registrieren
useEffect(() => {
  if (Platform.OS !== 'web') return;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };
}, []);
```

Keyboard-Events existieren nur im Web. Mobile nutzt Touch-Events. `Platform.OS` erlaubt denselben Component-Code mit plattformspezifischen Erweiterungen — ohne separate Komponenten für jede Plattform.

---

### `SafeAreaView` — Notch & Dynamic Island

```typescript
<SafeAreaView style={styles.root} edges={['top', 'bottom']}>
```

`SafeAreaView` stellt sicher, dass das UI nicht hinter Notch, Dynamic Island (iPhone 14+) oder Home-Indicator verschwindet — automatisch auf allen Geräten korrekt.

**Warum wichtig:** Ohne SafeAreaView würden Score-Anzeige und UI-Elemente auf neueren iPhones hinter dem Dynamic Island liegen und nicht sichtbar sein.

---

### `Pressable` mit `onPressIn`/`onPressOut` — Präzises Input-Timing

```typescript
<Pressable
  onPressIn={handleTouchStart}    // feuert sofort bei Finger-Berührung
  onPressOut={handleTouchEnd}     // feuert sofort beim Loslassen
  disabled={isLocalCrashed}
>
```

```typescript
const handleTouchStart = () => {
  pressStartTimeRef.current = Date.now();
  // Nach 200ms → Ducken starten
  pressTimerRef.current = setTimeout(handleDuckStart, 200);
};

const handleTouchEnd = () => {
  const duration = Date.now() - pressStartTimeRef.current;
  clearTimeout(pressTimerRef.current);
  if (duration < 200) handleJump();  // Kurzer Tap = Springen
  else handleDuckEnd();              // Langes Halten = Ducken beenden
};
```

`onPressIn` feuert sofort bei Berührung ohne Delay. `onPress` hätte einen internen Delay für die Scroll-Gesten-Erkennung von React Native — bei einem Geschicklichkeitsspiel, wo Millisekunden entscheiden, ist das nicht akzeptabel.

---

## Architektur

```
┌──────────────────────────────────────────────────┐
│  UI-Layer (React Native Komponenten)             │
│  DinoSprite, ObstacleSprite, CloudSprite,        │
│  PlayerLane, Screen-Komponenten                  │
├──────────────────────────────────────────────────┤
│  Navigation (Expo Router)                        │
│  app/(tabs)/index   → Solo                       │
│  app/(tabs)/lobby   → Matchmaking                │
│  app/betting        → Einsatz-Phase              │
│  app/multiplayer    → Spielbildschirm            │
├──────────────────────────────────────────────────┤
│  Netzwerk-Layer (Socket.io)                      │
│  NetworkManager (Singleton)                      │
│  Matchmaking → Betting → Handshake → Game        │
├──────────────────────────────────────────────────┤
│  Game Engine (reines TypeScript, kein React)     │
│  GameEngine / MultiplayerGameEngine              │
│  Entities: Dino, Obstacle, Cloud                 │
│  Systems: Physics, Collision, Spawn, Score       │
└──────────────────────────────────────────────────┘
```

Die Game Engine hat **keine React-Abhängigkeit** — sie ist reines TypeScript. React Native rendert ausschliesslich den `RenderState`, den die Engine zurückgibt. Diese Trennung macht die Spiellogik testbar und unabhängig vom UI-Framework.

### Multiplayer-Synchronisation

```
Gerät A                  Server                Gerät B
  │── find_match ────────→│                      │
  │                       │←──── find_match ─────│
  │←── game_start ────────│───── game_start ────→│
  │── player_game_ready ──→│                      │
  │                       │←── player_game_ready ─│
  │←── game_start_now ────│───── game_start_now ─→│  ← beide Engines starten gleichzeitig
  │── player_input ───────→│───── opponent_input ─→│
  │── player_state (50ms)─→│───── opponent_state ─→│
```

**Deterministisches Seeding:** Beide Geräte erhalten denselben `seed`. Die `seedrandom`-Library generiert daraus eine identische Hindernisfolge — ohne dass der Server Hindernisse schicken muss.

**Handshake-Start:** Der Server schickt `game_start_now` erst wenn **beide** Clients bereit sind. Damit starten beide Engines innerhalb eines Netzwerk-Round-Trips (~20–50ms) gleichzeitig — unabhängig von Uhren-Differenzen zwischen den Geräten.

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Expo 54 + React Native 0.81 |
| Navigation | Expo Router (file-based) |
| Sprache | TypeScript 5.9 |
| Echtzeit-Netzwerk | Socket.io 4.8 (Client + Server) |
| Server | Node.js + Express |
| Deterministisches RNG | seedrandom 3.0 |
| Physik | Fixed Timestep (16.67ms / 60 fps) |
| Styling | React Native StyleSheet |

---

## Projektstruktur

```
Dino-Crash/
├── app/                    # Expo Router Screens
│   ├── (tabs)/
│   │   ├── index.tsx       # Solo-Spiel
│   │   └── lobby.tsx       # Multiplayer-Matchmaking
│   ├── betting.tsx         # Einsatz-Phase
│   └── multiplayer.tsx     # Spielbildschirm
├── game/                   # Game Engine (framework-agnostisch)
│   ├── GameEngine.ts
│   ├── MultiplayerGameEngine.ts
│   ├── entities/           # Dino, Obstacle, Cloud
│   ├── systems/            # Physics, Collision, Spawn, Score
│   ├── components/         # React Native Sprite-Komponenten
│   └── network/            # NetworkManager (Socket.io Client)
├── server/                 # Node.js Server
│   └── src/
│       ├── index.ts
│       ├── GameRoom.ts
│       └── MatchmakingQueue.ts
├── shared/                 # Geteilte Typen (Client + Server)
│   └── network-types.ts
└── constants/              # Theme, Farben
```
