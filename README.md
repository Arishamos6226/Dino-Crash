# Dino-Crash

Dino-Crash ist ein 1v1 Online-Multiplayer-Spiel mit Echtzeit-Wetteinsätzen, inspiriert vom Chrome Dino Runner. Die Applikation wurde mit **Expo (React Native)** entwickelt und läuft aus einer einzigen Codebasis auf iOS, Android und im Web.

---

## Spielbeschreibung

Dino-Crash ist ein kompetitives Endless-Runner-Spiel, bei dem zwei Spieler gleichzeitig gegeneinander antreten. Jeder Spieler sieht seinen eigenen Spielbereich sowie denjenigen des Gegners, welcher über WebSockets live synchronisiert wird.

### Steuerung

| Aktion | Mobile | Web / Desktop |
|---|---|---|
| Springen | Kurzer Tap | Space / ArrowUp |
| Ducken | Halten (200 ms+) | ArrowDown (halten) |

### Hindernisse

Es gibt drei verschiedene Hindernistypen mit unterschiedlichen Anforderungen:

- **Kleiner Kaktus:** Niedriges Hindernis, ein einfacher Sprung genügt.
- **Grosser Kaktus:** Höheres Hindernis, das genaue Timing ist wichtiger.
- **Pterodactyl:** Fliegendes Hindernis auf variabler Höhe, welches je nach Position Ducken oder ein gezieltes Springen erfordert.

Die Spielgeschwindigkeit steigt kontinuierlich an, weshalb das Spiel mit zunehmender Dauer anspruchsvoller wird.

### Solo-Modus

Im Solo-Modus handelt es sich um einen klassischen Endless-Runner. Der Spieler versucht, so weit wie möglich zu kommen und seinen Highscore zu übertreffen.

### Multiplayer-Modus

Im Multiplayer-Modus spielen beide Spieler mit derselben Hindernissequenz, da ein deterministisches Seeding-Verfahren eingesetzt wird. Wer länger überlebt beziehungsweise mehr Punkte erzielt, gewinnt. Der Spieler kann in Echtzeit beobachten, wie der Gegner spielt und wann er crasht.

---

## Gambling-Logik im Multiplayer

Vor jedem Multiplayer-Spiel durchlaufen die Spieler eine Betting-Phase, die über ein Challenge-System abgewickelt wird.

### Ablauf

1. Player 1 wählt einen Einsatz aus den vorgegebenen Beträgen: 1 / 2 / 5 / 10 / 20 Fr.
2. Player 2 erhält die Challenge und kann diese annehmen oder ablehnen.
3. Bei Annahme wird der Einsatz bei beiden Spielern abgezogen. Der aktuelle Pot (`Einsatz × 2`) ist während des Spiels sichtbar.
4. Das Spiel startet und der Gewinner erhält den Pot.

### Gewinner-Bestimmung

Der Spieler, der länger überlebt, gewinnt den Pot. Crashen beide Spieler gleichzeitig, gewinnt derjenige mit der höheren Punktzahl. Bei einem Verbindungsabbruch gewinnt der verbleibende Spieler automatisch.

### Bonus-Mechanik

Die Gambling-Logik endet nicht beim Crash des Gegners. Ein Bonus-System incentiviert den Überlebenden, nach dem Gegner-Crash weiterzuspielen:

```
Bonus = ⌊(eigener Score − Gegner-Crash-Score) / 500⌋ × Einsatz
```

**Beispiel:** Bei einem Einsatz von 5 Fr. beträgt der Pot 10 Fr. Der Gegner crasht bei Score 1000. Der Überlebende spielt weiter bis Score 2500. Der Vorsprung beträgt 1500 Punkte, was 3 Milestones ergibt: 3 × 5 Fr. = 15 Fr. Bonus. Der Gesamtgewinn beläuft sich somit auf 10 Fr. (Pot) + 15 Fr. (Bonus) = **25 Fr.**

Während des Spiels zeigt die Benutzeroberfläche den aufgelaufenen Bonus live an. Der Game-Over-Screen gibt eine detaillierte Aufschlüsselung der Auszahlung aus.

Diese Mechanik erzeugt eine zusätzliche Spielspannung, die über den Crash des Gegners hinausgeht: Wer nach dem Gegner-Crash aufhört zu spielen, verzichtet auf potenzielle Bonuszahlungen.

---

## Warum React Native und Expo?

Ein Multiplayer-Spiel auf Mobile zu entwickeln stellt spezifische technische Anforderungen: ein flüssiger 60-FPS-Game-Loop, Netzwerk-Integration in Echtzeit, responsives Layout auf verschiedenen Gerätegrössen sowie plattformübergreifender Support. React Native mit Expo erfüllt diese Anforderungen aus folgenden Gründen:

**Cross-Platform aus einer einzigen Codebasis:** Dieselbe Codebasis läuft auf iOS, Android und im Web-Browser. Ohne diesen Ansatz wären separate native Applikationen für jede Plattform notwendig.

**Native Performance ohne WebView:** React Native rendert echte native UI-Komponenten und verwendet keine HTML-basierte WebView. Dies ist entscheidend für einen stabilen 60-FPS-Game-Loop, der direkt mit dem Display-Refresh-Zyklus des Geräts synchronisiert ist.

**Expo Router für strukturierte Navigation:** Das file-basierte Routing von Expo Router funktioniert analog zu Next.js. Der Dateiname definiert die Route, ohne dass eine manuelle Navigationskonfiguration erforderlich ist.

**TypeScript ohne zusätzlichen Konfigurationsaufwand:** Typsichere Interfaces zwischen Game Engine, Netzwerk-Layer und UI sind ohne separates Build-Setup verfügbar.

**Fast Refresh für schnelle Entwicklungsiterationen:** Änderungen sind während der Entwicklung live sichtbar, ohne die Applikation neu starten zu müssen.

---

## Einsatz von React Native Spezialitäten

### `requestAnimationFrame` für den Game Loop

```typescript
useEffect(() => {
  let animationFrameId: number;
  const gameLoop = () => {
    engineRef.current.update(FIXED_STEP_MS);
    setRenderState(engineRef.current.getState());
    animationFrameId = requestAnimationFrame(gameLoop);
  };
  animationFrameId = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(animationFrameId);
}, [engineStarted]);
```

`requestAnimationFrame` ist in React Native nativ implementiert und synchronisiert den Game Loop mit dem Display-Refresh des Geräts (60 Hz). Ein `setInterval`-basierter Loop wäre nicht mit dem Display-Refresh synchronisiert und würde durch den JavaScript-Thread blockiert, was zu sichtbarem Ruckeln führen würde.

### `useRef` für die Engine-Instanz

```typescript
const engineRef = useRef<MultiplayerGameEngine | null>(null);
if (!engineRef.current) {
  engineRef.current = new MultiplayerGameEngine(seed, playerId);
}
```

`useRef` hält die Game-Engine-Instanz über alle Re-Renders hinweg aufrecht, ohne selbst einen Re-Render auszulösen. Mit `useState` würde die Engine bei jeder Zustandsänderung neu erstellt und der gesamte interne Spielzustand (Dino-Position, Hindernisse, Score) würde verloren gehen. Auch Netzwerk-Flags und Timer-IDs werden als Refs gespeichert, da sie keine Benutzeroberflächen-Updates auslösen müssen.

### `useWindowDimensions` für responsives Skalieren

```typescript
const { width: windowWidth, height: windowHeight } = useWindowDimensions();
const scale = gameWidth / GAME.WIDTH; // GAME.WIDTH = 600 px (fix)
```

Die Spielwelt hat eine feste interne Auflösung von 600 × 150 Pixeln. `useWindowDimensions` liefert die aktuellen Bildschirmabmessungen in Echtzeit und reagiert auf Gerätedrehung, Fenstergrössenänderungen im Web sowie verschiedene Gerätegrössen. Ohne diesen Mechanismus würde das Spiel auf einem iPad zu gross und auf einem kleinen iPhone unvollständig dargestellt.

### `StyleSheet` mit `position: absolute` für Sprites

```typescript
<View style={{
  position: 'absolute',
  bottom: GAME.GROUND_HEIGHT + dino.y,
  left: dino.x,
}}>
  <DinoSprite status={dino.status} />
</View>
```

Anstelle von Canvas oder WebGL werden Sprites als absolut positionierte React Native Views gerendert. Die gesamte Spielwelt wird mit einem einzigen `scale`-Transform skaliert:

```typescript
<View style={{ transform: [{ translateX }, { translateY }, { scale }] }}>
  {/* Alle Sprites der Spielwelt */}
</View>
```

Die Canvas-API steht in React Native nativ nicht zur Verfügung. Mit `position: absolute` und CSS-Transforms wird stattdessen der native Layout-Engine des Betriebssystems genutzt, was performant ist und keine externen Abhängigkeiten erfordert.

### `Platform.OS` für plattformspezifisches Verhalten

```typescript
const SERVER_URL = Platform.OS === 'web'
  ? 'http://localhost:3001'
  : 'http://192.168.1.107:3001';

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

Tastatur-Events existieren ausschliesslich im Web, während Mobile-Geräte Touch-Events verwenden. `Platform.OS` ermöglicht plattformspezifisches Verhalten innerhalb desselben Komponenten-Codes, ohne separate Implementierungen für jede Plattform zu benötigen.

### `SafeAreaView` für Notch und Dynamic Island

```typescript
<SafeAreaView style={styles.root} edges={['top', 'bottom']}>
```

`SafeAreaView` stellt sicher, dass Inhalte nicht hinter der Notch, dem Dynamic Island (iPhone 14 und neuer) oder dem Home-Indicator verborgen werden. Ohne diese Komponente würden UI-Elemente auf neueren iPhone-Modellen nicht vollständig sichtbar sein.

### `Pressable` mit `onPressIn` und `onPressOut` für präzises Input-Timing

```typescript
<Pressable
  onPressIn={handleTouchStart}
  onPressOut={handleTouchEnd}
  disabled={isLocalCrashed}
>
```

```typescript
const handleTouchStart = () => {
  pressStartTimeRef.current = Date.now();
  pressTimerRef.current = setTimeout(handleDuckStart, 200);
};

const handleTouchEnd = () => {
  const duration = Date.now() - pressStartTimeRef.current;
  clearTimeout(pressTimerRef.current);
  if (duration < 200) handleJump();
  else handleDuckEnd();
};
```

`onPressIn` löst sofort bei Berührung aus, ohne den internen Delay, den `onPress` für die Scroll-Gesten-Erkennung von React Native besitzt. Bei einem Geschicklichkeitsspiel, in dem Millisekunden spielentscheidend sein können, ist diese Präzision unerlässlich.

---

## Architektur

Die Applikation ist in vier klar voneinander getrennte Schichten unterteilt:

```
┌──────────────────────────────────────────────────┐
│  UI-Layer (React Native Komponenten)             │
│  DinoSprite, ObstacleSprite, CloudSprite,        │
│  PlayerLane, Screen-Komponenten                  │
├──────────────────────────────────────────────────┤
│  Navigation (Expo Router)                        │
│  app/(tabs)/index   →  Solo-Modus                │
│  app/(tabs)/lobby   →  Matchmaking               │
│  app/betting        →  Einsatz-Phase             │
│  app/multiplayer    →  Spielbildschirm           │
├──────────────────────────────────────────────────┤
│  Netzwerk-Layer (Socket.io)                      │
│  NetworkManager (Singleton)                      │
│  Matchmaking → Betting → Handshake → Spiel       │
├──────────────────────────────────────────────────┤
│  Game Engine (reines TypeScript, kein React)     │
│  GameEngine / MultiplayerGameEngine              │
│  Entities: Dino, Obstacle, Cloud                 │
│  Systems: Physics, Collision, Spawn, Score       │
└──────────────────────────────────────────────────┘
```

Die Game Engine besitzt keine Abhängigkeit zu React. React Native rendert ausschliesslich den `RenderState`, den die Engine zurückgibt. Diese Trennung macht die Spiellogik unabhängig vom UI-Framework und ermöglicht eine isolierte Testbarkeit.

### Multiplayer-Synchronisation

```
Gerät A                  Server                Gerät B
  │── find_match ────────→│                      │
  │                       │←──── find_match ─────│
  │←── game_start ────────│───── game_start ────→│
  │── player_game_ready ──→│                      │
  │                       │←── player_game_ready ─│
  │←── game_start_now ────│───── game_start_now ─→│
  │── player_input ───────→│───── opponent_input ─→│
  │── player_state (50ms)─→│───── opponent_state ─→│
```

Beide Geräte erhalten denselben `seed`. Die `seedrandom`-Library generiert daraus eine identische Hindernissequenz, ohne dass der Server Hindernisdaten übertragen muss. Der Server sendet `game_start_now` erst dann, wenn beide Clients ihre Bereitschaft gemeldet haben. Dadurch starten beide Engines innerhalb eines Netzwerk-Round-Trips (ca. 20–50 ms) gleichzeitig, unabhängig von Uhrzeitdifferenzen zwischen den Geräten.

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Expo 54 und React Native 0.81 |
| Navigation | Expo Router (file-based) |
| Sprache | TypeScript 5.9 |
| Echtzeit-Netzwerk | Socket.io 4.8 (Client und Server) |
| Server | Node.js mit Express |
| Deterministisches RNG | seedrandom 3.0 |
| Physik | Fixed Timestep (16.67 ms / 60 fps) |
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
├── shared/                 # Geteilte Typen für Client und Server
│   └── network-types.ts
└── constants/              # Theme und Farben
```
