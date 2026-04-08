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
        <Text style={styles.title}>🦖 DINO CRASH</Text>
        <Text style={styles.subtitle}>Online Matchmaking</Text>
      </View>

      <View style={styles.statusCard}>
        {status === 'idle' && (
          <>
            <Text style={styles.idleIcon}>🎮</Text>
            <Text style={styles.idleText}>Ready to Race?</Text>
            <Text style={styles.subtleText}>Find an opponent and place your bet</Text>
          </>
        )}

        {status === 'connecting' && (
          <>
            <ActivityIndicator size="large" color={Colors.game.casinoGold} />
            <Text style={styles.statusText}>Connecting to server...</Text>
            <Text style={styles.subtleText}>Establishing connection</Text>
          </>
        )}

        {status === 'searching' && (
          <>
            <ActivityIndicator size="large" color={Colors.game.casinoGold} />
            <Text style={styles.statusText}>Finding opponent...</Text>
            <Text style={styles.subtleText}>Waiting for another player to join</Text>
          </>
        )}

        {status === 'found' && (
          <>
            <Text style={styles.foundIcon}>✓</Text>
            <Text style={styles.foundText}>Opponent Found!</Text>
            <Text style={styles.statusText}>Preparing game...</Text>
          </>
        )}
      </View>

      {status === 'idle' && (
        <Pressable style={styles.findButton} onPress={handleFindOpponent}>
          <Text style={styles.findButtonText}>Find Opponent</Text>
        </Pressable>
      )}

      {(status === 'connecting' || status === 'searching') && (
        <Pressable style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Get ready to race • Place your bet</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.game.pageBackground,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.game.titleText,
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.game.subtitleText,
    letterSpacing: 1,
  },
  statusCard: {
    backgroundColor: Colors.game.gameBackground,
    borderRadius: 20,
    padding: 40,
    minWidth: 320,
    alignItems: 'center',
    gap: 20,
    borderWidth: 4,
    borderColor: Colors.game.accentGold,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  foundIcon: {
    fontSize: 64,
    color: Colors.game.accentGold,
  },
  statusText: {
    fontSize: 20,
    color: Colors.game.accentGold,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtleText: {
    fontSize: 14,
    color: Colors.game.subtitleText,
    fontWeight: '500',
  },
  foundText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 2,
  },
  idleIcon: {
    fontSize: 64,
  },
  idleText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1,
  },
  findButton: {
    backgroundColor: Colors.game.casinoBlack,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.game.accentGold,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  findButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1.5,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.game.accentGold,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.game.accentGold,
  },
  footer: {
    alignItems: 'center',
    opacity: 0.6,
  },
  footerText: {
    fontSize: 12,
    color: Colors.game.accentGold,
    fontWeight: '500',
  },
});
