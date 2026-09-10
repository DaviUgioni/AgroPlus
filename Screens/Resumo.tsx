import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { auth } from '../FirebaseConfig';
import { listarPropriedades } from '../Services/propriedades';
import { listarDespesasPorPropriedade, totalDespesasMes, totalDespesasAno, Despesa } from '../Services/despesas';
import { listarPlantiosPorPropriedade, estimativaColheita, textoEstimativa, Plantio } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { COLORS, RADIUS } from '../constants/theme';
import BotaoVoltar from '../Components/BotaoVoltar';

type ResumoNavigationProp = NavigationProp<RootStackParamList, 'Resumo'>;

interface ProximaColheita {
  propriedadeNome: string;
  tipoNome: string;
  diasRestantes: number;
  texto: string;
}

export default function Resumo() {
  const navigation = useNavigation<ResumoNavigationProp>();
  const [carregando, setCarregando] = useState(true);
  const [totalPropriedades, setTotalPropriedades] = useState(0);
  const [areaTotal, setAreaTotal] = useState(0);
  const [gastoMes, setGastoMes] = useState(0);
  const [gastoAno, setGastoAno] = useState(0);
  const [plantiosAtivos, setPlantiosAtivos] = useState(0);
  const [proximaColheita, setProximaColheita] = useState<ProximaColheita | null>(null);

  async function carregar() {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      setCarregando(true);
      const propriedades = await listarPropriedades(userId);
      setTotalPropriedades(propriedades.length);
      setAreaTotal(propriedades.reduce((s, p) => s + (p.areaTotal || 0), 0));

      const agora = new Date();
      const anoAtual = agora.getFullYear();
      const mesAtual = agora.getMonth();

      let todasDespesas: Despesa[] = [];
      let todosPlantios: (Plantio & { propriedadeNome: string })[] = [];

      for (const prop of propriedades) {
        const [despesas, plantios] = await Promise.all([
          listarDespesasPorPropriedade(prop.id!),
          listarPlantiosPorPropriedade(prop.id!),
        ]);
        todasDespesas = todasDespesas.concat(despesas);
        todosPlantios = todosPlantios.concat(plantios.map((p) => ({ ...p, propriedadeNome: prop.nome })));
      }

      const despesasAteAgora = todasDespesas.filter((d) => (d.data?.toMillis?.() ?? 0) <= agora.getTime());
      setGastoMes(totalDespesasMes(despesasAteAgora, anoAtual, mesAtual));
      setGastoAno(totalDespesasAno(despesasAteAgora, anoAtual));
      setPlantiosAtivos(todosPlantios.length);

      let maisProxima: ProximaColheita | null = null;
      let menorDias = Infinity;
      for (const plantio of todosPlantios) {
        const estimativa = estimativaColheita(plantio.dataPlantio, plantio.diasParaColheita);
        if (estimativa.diasRestantes < menorDias) {
          menorDias = estimativa.diasRestantes;
          maisProxima = {
            propriedadeNome: plantio.propriedadeNome,
            tipoNome: plantio.tipoNome,
            diasRestantes: estimativa.diasRestantes,
            texto: textoEstimativa(estimativa),
          };
        }
      }
      setProximaColheita(maisProxima);
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BotaoVoltar />
        <Text style={styles.titulo}>Resumo</Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={COLORS.verde} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Propriedades')}>
              <Feather name="map-pin" size={20} color={COLORS.verde} />
              <Text style={styles.cardValor}>{totalPropriedades}</Text>
              <Text style={styles.cardLabel}>Propriedades</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Propriedades')}>
              <Feather name="maximize" size={20} color={COLORS.verde} />
              <Text style={styles.cardValor}>{areaTotal} ha</Text>
              <Text style={styles.cardLabel}>Área total</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ResumoDespesas', { periodo: 'mes' })}
            >
              <Feather name="calendar" size={20} color={COLORS.verde} />
              <Text style={styles.cardValor}>{formatarMoeda(gastoMes)}</Text>
              <Text style={styles.cardLabel}>Gasto no mês</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ResumoDespesas', { periodo: 'ano' })}
            >
              <Feather name="trending-up" size={20} color={COLORS.verde} />
              <Text style={styles.cardValor}>{formatarMoeda(gastoAno)}</Text>
              <Text style={styles.cardLabel}>Gasto no ano</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.destaqueCard} onPress={() => navigation.navigate('Plantios')}>
            <Feather name="feather" size={20} color="#fff" />
            <Text style={styles.destaqueValor}>{plantiosAtivos}</Text>
            <Text style={styles.destaqueLabel}>{plantiosAtivos === 1 ? 'Plantio ativo' : 'Plantios ativos'}</Text>
          </TouchableOpacity>

          {proximaColheita && (
            <TouchableOpacity style={styles.proximaCard} onPress={() => navigation.navigate('ResumoColheitas')}>
              <Text style={styles.proximaTitulo}>Próxima colheita</Text>
              <Text style={styles.proximaNome}>
                {proximaColheita.tipoNome} · {proximaColheita.propriedadeNome}
              </Text>
              <Text style={styles.proximaTexto}>{proximaColheita.texto}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 4,
  },
  cardValor: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 6,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
  },
  destaqueCard: {
    backgroundColor: COLORS.verde,
    borderRadius: RADIUS.md,
    padding: 16,
    marginTop: 10,
    gap: 4,
  },
  destaqueValor: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  destaqueLabel: {
    fontSize: 13,
    color: '#EAF3DE',
  },
  proximaCard: {
    backgroundColor: COLORS.bege,
    borderRadius: RADIUS.md,
    padding: 16,
    marginTop: 10,
  },
  proximaTitulo: {
    fontSize: 12,
    color: '#666',
  },
  proximaNome: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  proximaTexto: {
    fontSize: 13,
    color: COLORS.verde,
    fontWeight: '500',
    marginTop: 4,
  },
});
