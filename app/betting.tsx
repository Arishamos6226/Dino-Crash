import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';
import NetworkManager from '../game/network/NetworkManager';

const BET_AMOUNTS = [10, 25, 50, 100, 250];

export default function BettingScreen() {
  const params = useLocalSearchParams<{ roomId: string; playerId: string; seed: string }>();
  const router = useRouter();
  const [selectedBet, setSelectedBet] = useState(50);
  const [customBet, setCustomBet] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);

  const handlePlaceBet = () => {
    const betAmount = customBet ? parseInt(customBet) : selectedBet;

    if (betAmount < 1) return;

    setIsWaiting(true);
    const networkManager = NetworkManager.getInstance();

    networkManager.placeBet(params.roomId, betAmount);

    networkManager.onBothPlayersReady(() => {
      router.replace({
        pathname: '/multiplayer',
        params: {
          seed: params.seed,
          playerId: params.playerId,
          betAmount: betAmount.toString(),
        }
      });
    });
  };

  const handleBackToMenu = () => {
    const networkManager = NetworkManager.getInstance();
    networkManager.disconnect();
    router.replace('/(tabs)/lobby');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>🎰 PLACE YOUR BET 🎰</Text>
          <Text style={styles.subtitle}>Fleischkäulen wetten</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.betGrid}>
            {BET_AMOUNTS.map((amount) => (
              <Pressable
                key={amount}
                style={[
                  styles.betButton,
                  selectedBet === amount && !customBet && styles.betButtonActive
                ]}
                onPress={() => {
                  setSelectedBet(amount);
                  setCustomBet('');
                }}
              >
                <Text style={styles.betAmount}>{amount}</Text>
                <Text style={styles.betLabel}>Käulen</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.customBetContainer}>
            <Text style={styles.customLabel}>Custom Bet</Text>
            <TextInput
              style={styles.customInput}
              value={customBet}
              onChangeText={setCustomBet}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={Colors.game.subtitleText}
            />
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warning}>⚠️ Verlierer schwitzt beim Zuschauen!</Text>
          </View>
        </View>

        {isWaiting ? (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Waiting for opponent...</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <Pressable style={styles.confirmButton} onPress={handlePlaceBet}>
              <Text style={styles.confirmText}>
                BET {customBet || selectedBet} KÄULEN
              </Text>
            </Pressable>
            <Pressable style={styles.backButton} onPress={handleBackToMenu}>
              <Text style={styles.backText}>Back to Menu</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.game.pageBackground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.game.gameBackground,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 500,
    borderWidth: 4,
    borderColor: Colors.game.accentGold,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.game.accentGold,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.game.subtitleText,
    textAlign: 'center',
  },
  content: {
    gap: 20,
  },
  betGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  betButton: {
    backgroundColor: Colors.game.casinoBlack,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.game.accentGold,
  },
  betButtonActive: {
    backgroundColor: Colors.game.casinoRed,
    borderColor: Colors.game.accentGold,
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  betAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.game.accentGold,
    marginBottom: 4,
  },
  betLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.game.accentGold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.game.accentGold,
    opacity: 0.2,
  },
  customBetContainer: {
    gap: 10,
  },
  customLabel: {
    fontSize: 15,
    color: Colors.game.accentGold,
    fontWeight: '700',
    textAlign: 'center',
  },
  customInput: {
    backgroundColor: Colors.game.casinoBlack,
    color: Colors.game.accentGold,
    fontSize: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.game.accentGold,
    textAlign: 'center',
    fontWeight: '900',
  },
  warningBox: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.game.casinoRed,
  },
  warning: {
    fontSize: 14,
    color: Colors.game.casinoRed,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actions: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: Colors.game.casinoBlack,
    paddingVertical: 18,
    paddingHorizontal: 32,
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
  confirmText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1.5,
  },
  waitingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 18,
    color: Colors.game.accentGold,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.game.accentGold,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.game.accentGold,
  },
});
