import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import NetworkManager from '../game/network/NetworkManager';
import { GameMode } from '../shared/network-types';
import { Colors, GameUI } from '../constants/theme';

const SERVER_URL = 'http://localhost:3001';

export default function LobbyScreen() {
  const [status, setStatus] = useState<'connecting' | 'searching' | 'found'>('connecting');
  const router = useRouter();

  useEffect(() => {
    const networkManager = NetworkManager.getInstance();

    const connectAndSearch = async () => {
      try {
        // Connect to server
        await networkManager.connect(SERVER_URL);
        setStatus('searching');

        // Listen for matchmaking status
        networkManager.onMatchmakingStatus((statusPayload) => {
          console.log('Matchmaking status:', statusPayload);
        });

        // Find match
        networkManager.findMatch(GameMode.VS_ONLINE, (payload) => {
          setStatus('found');
          console.log('Match found:', payload);

          // Navigate to multiplayer game
          setTimeout(() => {
            router.replace({
              pathname: '/multiplayer',
              params: {
                seed: payload.seed.toString(),
                playerId: payload.playerId,
                isBot: payload.isBot.toString(),
              }
            });
          }, 2000);
        });
      } catch (error) {
        console.error('Failed to connect:', error);
        setStatus('searching');
      }
    };

    connectAndSearch();

    return () => {
      // Clean up on unmount
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dino-Crash</Text>

      {status === 'connecting' && (
        <>
          <ActivityIndicator size="large" color={Colors.game.textColor} />
          <Text style={styles.statusText}>Connecting to server...</Text>
        </>
      )}

      {status === 'searching' && (
        <>
          <ActivityIndicator size="large" color={Colors.game.textColor} />
          <Text style={styles.statusText}>Finding opponent...</Text>
          <Text style={styles.subtleText}>You'll be matched with a bot after 5 seconds</Text>
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
    color: '#4CAF50',
    marginBottom: 16,
  },
});
