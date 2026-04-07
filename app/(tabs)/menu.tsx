import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, GameUI } from '../../constants/theme';

export default function MenuScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🦖 DINO CRASH</Text>
        <Text style={styles.subtitle}>Ultimate Dinosaur Racing</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonIcon}>🎮</Text>
          <Text style={styles.buttonText}>PLAY SOLO</Text>
          <Text style={styles.buttonDescription}>Classic single-player mode</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/lobby')}
        >
          <Text style={styles.buttonIcon}>🎰</Text>
          <Text style={styles.buttonText}>PLAY ONLINE</Text>
          <Text style={styles.buttonDescription}>Bet & compete against real players</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Test your reflexes • Beat the high score</Text>
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
    padding: GameUI.pagePadding,
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
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  button: {
    backgroundColor: Colors.game.gameBackground,
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.game.accentGold,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  buttonIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  buttonText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 2,
  },
  buttonDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.game.subtitleText,
    textAlign: 'center',
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
