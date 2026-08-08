// Screens/Home.tsx
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function Home() {
  const navigation = useNavigation<HomeNavigationProp>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.titulo}>Bem-vindo ao AgroPlus</Text>
      <Text style={styles.subtitulo}>Gerencie sua produção com facilidade</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Propriedades')}>
          <Ionicons name="map-outline" size={22} color="#fff" />
          <Text style={styles.cardText}>Propriedades</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Plantios')}>
          <Ionicons name="leaf-outline" size={22} color="#fff" />
          <Text style={styles.cardText}>Plantios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Despesas')}>
          <Ionicons name="cash-outline" size={22} color="#fff" />
          <Text style={styles.cardText}>Despesas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Resumo')}>
          <Ionicons name="bar-chart-outline" size={22} color="#fff" />
          <Text style={styles.cardText}>Resumo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '500',
  },
  subtitulo: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '47%',
    backgroundColor: '#3B6D11',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  cardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
});