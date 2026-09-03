// Screens/Resumo.tsx
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../constants/theme';

export default function Resumo() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Resumo</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '600',
  },
});