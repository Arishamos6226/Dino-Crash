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
        <Text style={styles.title}>🎰 PLACE YOUR BET 🎰</Text>
        <Text style={styles.subtitle}>Fleischkäulen wetten</Text>

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

        <View style={styles.customBetContainer}>
          <Text style={styles.customLabel}>Custom Bet:</Text>
          <TextInput
            style={styles.customInput}
            value={customBet}
            onChangeText={setCustomBet}
            keyboardType="numeric"
            placeholder="Amount"
            placeholderTextColor={Colors.game.subtitleText}
          />
        </View>

        <Text style={styles.warning}>
          ⚠️ Verlierer schwitzt beim Zuschauen!
        </Text>

        {isWaiting ? (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Waiting for opponent...</Text>
          </View>
        ) : (
          <>
            <Pressable style={styles.confirmButton} onPress={handlePlaceBet}>
              <Text style={styles.confirmText}>
                BET {customBet || selectedBet} KÄULEN
              </Text>
            </Pressable>
            <Pressable style={styles.backButton} onPress={handleBackToMenu}>
              <Text style={styles.backText}>Back to Menu</Text>
            </Pressable>
          </>
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
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 3,
    borderColor: Colors.game.casinoBlack,
    shadowColor: Colors.game.casinoGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.game.accentGold,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.game.subtitleText,
    textAlign: 'center',
    marginBottom: 24,
  },
  betGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  betButton: {
    backgroundColor: Colors.game.casinoBlack,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.game.casinoGold,
  },
  betButtonActive: {
    backgroundColor: Colors.game.casinoRed,
    borderColor: Colors.game.casinoGold,
    borderWidth: 3,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  betAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.game.accentGold,
    marginBottom: 4,
  },
  betLabel: {
    fontSize: 12,
    color: Colors.game.accentGold,
  },
  customBetContainer: {
    marginBottom: 24,
  },
  customLabel: {
    fontSize: 14,
    color: Colors.game.accentGold,
    marginBottom: 8,
    fontWeight: '600',
  },
  customInput: {
    backgroundColor: Colors.game.casinoBlack,
    color: Colors.game.accentGold,
    fontSize: 18,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.game.casinoGold,
    textAlign: 'center',
    fontWeight: '700',
  },
  warning: {
    fontSize: 14,
    color: Colors.game.casinoRed,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: Colors.game.casinoBlack,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.game.casinoGold,
    shadowColor: Colors.game.casinoGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.game.casinoGold,
  },
  waitingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: Colors.game.accentGold,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.game.casinoGold,
    marginTop: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.game.casinoGold,
  },
});
