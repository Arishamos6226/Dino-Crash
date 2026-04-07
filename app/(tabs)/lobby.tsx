import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import NetworkManager from '../../game/network/NetworkManager';
import { GameMode } from '../../shared/network-types';
import { Colors, GameUI } from '../../constants/theme';

const SERVER_URL = Platform.OS === 'web'
  ? 'http://localhost:3001'
  : 'http://192.168.1.107:3001';

const GAME_START_DELAY_MS = 1000;

export default function LobbyScreen() {
  const [status, setStatus] = useState<'connecting' | 'searching' | 'found'>('connecting');
  const router = useRouter();

  useEffect(() => {
    const networkManager = NetworkManager.getInstance();

    const connectAndSearch = async () => {
      try {
        await networkManager.connect(SERVER_URL);
        setStatus('searching');

        networkManager.onMatchmakingStatus(() => {
          setStatus('searching');
        });

        networkManager.findMatch(GameMode.VS_ONLINE, (payload) => {
          setStatus('found');

          setTimeout(() => {
            router.replace({
              pathname: '/multiplayer',
              params: {
                seed: payload.seed.toString(),
                playerId: payload.playerId,
              }
            });
          }, GAME_START_DELAY_MS);
        });
      } catch (error) {
        setStatus('searching');
      }
    };

    connectAndSearch();
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dino-Crash</Text>

      {status === 'connecting' && (
        <>
          <ActivityIndicator size="large" color={Colors.game.accentSecondary} />
          <Text style={styles.statusText}>Connecting to server...</Text>
        </>
      )}

      {status === 'searching' && (
        <>
          <ActivityIndicator size="large" color={Colors.game.accentPrimary} />
          <Text style={styles.statusText}>Finding opponent...</Text>
          <Text style={styles.subtleText}>Waiting for another player to join</Text>
        </>
      )}

      {status === 'found' && (
        <>
          <Text style={styles.foundText}>✓ Opponent Found!</Text>
          <Text style={styles.statusText}>Starting game...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.game.pageBackground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: GameUI.pagePadding,
    gap: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.game.titleText,
    marginBottom: 32,
  },
  statusText: {
    fontSize: 20,
    color: Colors.game.textColor,
  },
  subtleText: {
    fontSize: 14,
    color: Colors.game.subtitleText,
    marginTop: 8,
  },
  foundText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.game.accentSecondary,
    marginBottom: 16,
  },
});
