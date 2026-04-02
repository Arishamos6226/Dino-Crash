import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, GameUI } from '../../constants/theme';

export default function MenuScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dino-Crash</Text>
      <Text style={styles.subtitle}>Choose Your Mode</Text>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonText}>Play Solo</Text>
          <Text style={styles.buttonDescription}>Classic single-player mode</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/multiplayer?mode=bot')}
        >
          <Text style={styles.buttonText}>Play vs Bot</Text>
          <Text style={styles.buttonDescription}>Challenge an AI opponent</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/lobby')}
        >
          <Text style={styles.buttonText}>Play Online</Text>
          <Text style={styles.buttonDescription}>Compete against real players</Text>
        </Pressable>
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
    padding: GameUI.pagePadding,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.game.titleText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.game.subtitleText,
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  button: {
    backgroundColor: Colors.game.borderColor,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.game.textColor,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.game.textColor,
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: Colors.game.subtitleText,
  },
});
