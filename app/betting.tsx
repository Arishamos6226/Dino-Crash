import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';
import NetworkManager from '../game/network/NetworkManager';

const BET_AMOUNTS = [1, 2, 5, 10, 20];

type Phase =
  | 'select'                  // player1: Betrag wählen
  | 'waiting'                 // player1: wartet auf player2
  | 'waiting_for_challenge'   // player2: wartet bis player1 Betrag setzt
  | 'challenged'              // player2: Challenge annehmen/ablehnen
  | 'declined';               // beide: Challenge abgelehnt

export default function BettingScreen() {
  const params = useLocalSearchParams<{ roomId: string; playerId: string; seed: string }>();
  const router = useRouter();
  const isChallenger = params.playerId === 'player1';

  const [selectedBet, setSelectedBet] = useState(BET_AMOUNTS[2]); // default: 5 Fr.
  const [phase, setPhase] = useState<Phase>(isChallenger ? 'select' : 'waiting_for_challenge');
  const [challengeAmount, setChallengeAmount] = useState<number>(0);
  const navigatedRef = useRef(false);

  useEffect(() => {
    const networkManager = NetworkManager.getInstance();

    // Player2: empfängt Challenge von Player1
    if (!isChallenger) {
      networkManager.onBetChallenge((payload) => {
        setChallengeAmount(payload.betAmount);
        setPhase('challenged');
      });
    }

    // Beide: Challenge wurde abgelehnt
    networkManager.onBetDeclined(() => {
      setPhase('declined');
    });

    // Beide: Spiel startet
    networkManager.onBothPlayersReady((payload) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      router.replace({
        pathname: '/multiplayer',
        params: {
          seed: params.seed,
          playerId: params.playerId,
          betAmount: payload.betAmount.toString(),
        }
      });
    });

    // Gegner verlässt Raum
    networkManager.onGameOver(() => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      networkManager.disconnect();
      router.replace('/(tabs)/lobby');
    });
  }, []);

  const handleChallenge = () => {
    const networkManager = NetworkManager.getInstance();
    networkManager.placeBet(params.roomId, selectedBet);
    setPhase('waiting');
  };

  const handleAccept = () => {
    const networkManager = NetworkManager.getInstance();
    networkManager.respondToBet(params.roomId, true);
  };

  const handleDecline = () => {
    const networkManager = NetworkManager.getInstance();
    networkManager.respondToBet(params.roomId, false);
  };

  const handleBackToMenu = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    const networkManager = NetworkManager.getInstance();
    networkManager.disconnect();
    router.replace('/(tabs)/lobby');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* ── Player1: Betrag wählen ── */}
        {phase === 'select' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>DEIN EINSATZ</Text>
              <Text style={styles.subtitle}>Wähle einen Betrag und challenge deinen Gegner</Text>
            </View>

            <View style={styles.betGrid}>
              {BET_AMOUNTS.map((amount) => (
                <Pressable
                  key={amount}
                  style={[styles.betButton, selectedBet === amount && styles.betButtonActive]}
                  onPress={() => setSelectedBet(amount)}
                >
                  <Text style={styles.betAmount}>{amount}</Text>
                  <Text style={styles.betLabel}>Fr.</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.confirmButton} onPress={handleChallenge}>
                <Text style={styles.confirmText}>{selectedBet} Fr. CHALLENGEN</Text>
              </Pressable>
              <Pressable style={styles.backButton} onPress={handleBackToMenu}>
                <Text style={styles.backText}>Abbrechen</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ── Player1: wartet auf Antwort ── */}
        {phase === 'waiting' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>CHALLENGE GESENDET</Text>
            </View>
            <View style={styles.challengeBox}>
              <Text style={styles.challengeAmount}>{selectedBet} Fr.</Text>
              <Text style={styles.challengeLabel}>warten auf Gegner...</Text>
            </View>
            <ActivityIndicator size="large" color={Colors.game.accentGold} style={{ marginVertical: 8 }} />
            <Pressable style={styles.backButton} onPress={handleBackToMenu}>
              <Text style={styles.backText}>Abbrechen</Text>
            </Pressable>
          </>
        )}

        {/* ── Player2: wartet auf Challenge ── */}
        {phase === 'waiting_for_challenge' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>WARTE AUF GEGNER</Text>
              <Text style={styles.subtitle}>Gegner setzt gerade den Einsatz...</Text>
            </View>
            <ActivityIndicator size="large" color={Colors.game.accentGold} style={{ marginVertical: 8 }} />
            <Pressable style={styles.backButton} onPress={handleBackToMenu}>
              <Text style={styles.backText}>Abbrechen</Text>
            </Pressable>
          </>
        )}

        {/* ── Player2: Challenge annehmen/ablehnen ── */}
        {phase === 'challenged' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>CHALLENGE!</Text>
              <Text style={styles.subtitle}>Dein Gegner setzt</Text>
            </View>
            <View style={styles.challengeBox}>
              <Text style={styles.challengeAmount}>{challengeAmount} Fr.</Text>
              <Text style={styles.challengeLabel}>Nimmst du an?</Text>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.acceptButton} onPress={handleAccept}>
                <Text style={styles.acceptText}>ANNEHMEN</Text>
              </Pressable>
              <Pressable style={styles.declineButton} onPress={handleDecline}>
                <Text style={styles.declineText}>ABLEHNEN</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ── Challenge abgelehnt ── */}
        {phase === 'declined' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>ABGELEHNT</Text>
              <Text style={styles.subtitle}>Der Gegner hat die Challenge abgelehnt</Text>
            </View>
            <Pressable style={styles.confirmButton} onPress={handleBackToMenu}>
              <Text style={styles.confirmText}>ZURÜCK ZUM LOBBY</Text>
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
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.game.accentGold,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.game.subtitleText,
    textAlign: 'center',
    opacity: 0.8,
  },
  betGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  betButton: {
    backgroundColor: Colors.game.casinoBlack,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.game.accentGold,
  },
  betButtonActive: {
    backgroundColor: Colors.game.casinoRed,
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
    marginBottom: 2,
  },
  betLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.game.accentGold,
  },
  challengeBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.3)',
    backgroundColor: 'rgba(255,215,0,0.05)',
    width: '100%',
  },
  challengeAmount: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 2,
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  challengeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.game.subtitleText,
    opacity: 0.7,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.game.accentGold,
    backgroundColor: Colors.game.casinoBlack,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1.5,
  },
  acceptButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.game.accentGold,
    backgroundColor: Colors.game.casinoBlack,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  acceptText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1.5,
  },
  declineButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.game.subtitleText,
    opacity: 0.7,
  },
  backButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.game.subtitleText,
    opacity: 0.7,
  },
});
