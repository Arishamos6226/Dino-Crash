import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import NetworkManager from '../../game/network/NetworkManager';
import { GameMode } from '../../shared/network-types';
import { Colors, GameUI } from '../../constants/theme';

const SERVER_URL = Platform.OS === 'web'
  ? 'http://localhost:3001'
  : 'http://172.20.10.2:3001';

const GAME_START_DELAY_MS = 1000;

type Status = 'idle' | 'connecting' | 'searching' | 'found';

export default function LobbyScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const router = useRouter();
  const navigatedRef = useRef(false);

  useEffect(() => {
    navigatedRef.current = false;
  }, []);

  const handleFindOpponent = async () => {
    if (status !== 'idle') return;
    setStatus('connecting');

    const networkManager = NetworkManager.getInstance();

    try {
      await networkManager.connect(SERVER_URL);
      setStatus('searching');

      networkManager.onMatchmakingStatus(() => {
        setStatus('searching');
      });

      networkManager.findMatch(GameMode.VS_ONLINE, (payload) => {
        if (navigatedRef.current) return;
        navigatedRef.current = true;
        setStatus('found');

        setTimeout(() => {
          router.replace({
            pathname: '/betting',
            params: {
              roomId: payload.roomId,
              seed: payload.seed.toString(),
              playerId: payload.playerId,
            }
          });
        }, GAME_START_DELAY_MS);
      });
    } catch (error) {
      setStatus('idle');
    }
  };

  const handleCancel = () => {
    const networkManager = NetworkManager.getInstance();
    networkManager.disconnect();
    setStatus('idle');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>🦖 DINO CRASH</Text>
        <Text style={styles.subtitle}>Online Matchmaking</Text>
      </View>

      <View style={styles.statusCard}>
        {status === 'idle' && (
          <>
            <Text style={styles.idleText}>Bereit?</Text>
            <Text style={styles.subtleText}>Finde einen Gegner und platziere deinen Einsatz</Text>
          </>
        )}

        {status === 'connecting' && (
          <>
            <ActivityIndicator size="small" color={Colors.game.casinoGold} />
            <Text style={styles.statusText}>Verbinde...</Text>
          </>
        )}

        {status === 'searching' && (
          <>
            <ActivityIndicator size="small" color={Colors.game.casinoGold} />
            <Text style={styles.statusText}>Suche Gegner...</Text>
            <Text style={styles.subtleText}>Warte auf einen anderen Spieler</Text>
          </>
        )}

        {status === 'found' && (
          <>
            <Text style={styles.foundText}>Gegner gefunden!</Text>
            <Text style={styles.subtleText}>Spiel wird vorbereitet...</Text>
          </>
        )}
      </View>

      {status === 'idle' && (
        <Pressable style={styles.findButton} onPress={handleFindOpponent}>
          <Text style={styles.findButtonText}>Gegner finden</Text>
        </Pressable>
      )}

      {(status === 'connecting' || status === 'searching') && (
        <Pressable style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Abbrechen</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.game.pageBackground,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.game.titleText,
    letterSpacing: 2,
    width: '100%',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.game.subtitleText,
    letterSpacing: 1,
    opacity: 0.7,
  },
  statusCard: {
    backgroundColor: Colors.game.gameBackground,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  statusText: {
    fontSize: 16,
    color: Colors.game.accentGold,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subtleText: {
    fontSize: 13,
    color: Colors.game.subtitleText,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.7,
  },
  foundText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.game.accentGold,
    letterSpacing: 1,
  },
  idleText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.game.accentGold,
    letterSpacing: 0.5,
  },
  findButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.game.accentGold,
    backgroundColor: Colors.game.gameBackground,
  },
  findButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.game.accentGold,
    letterSpacing: 1,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.game.subtitleText,
  },
});
