import { ComponentProps, useState, useCallback } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { listarPropriedades } from '../Services/propriedades';
import { listarDespesasPorPropriedade, totalDespesasMes, totalDespesasAno, Despesa } from '../Services/despesas';
import { listarPlantiosPorPropriedade, estimativaColheita, textoEstimativa, Plantio } from '../Services/plantios';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Cabecalho, Carregando, Cartao, EstadoVazio, Tela } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type IconeFeather = ComponentProps<typeof Feather>['name'];

// Cartão pequeno com um número (usado na grade do topo)
function CartaoNumero({ icone, valor, label, onPress }: { icone: IconeFeather; valor: string; label: string; onPress: () => void }) {
  return (
    <Cartao interativo flexBasis="46%" flexGrow={1} gap={4} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${valor}`}>
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack width={36} height={36} borderRadius="lg" backgroundColor="verdeSuave" alignItems="center" justifyContent="center">
          <Feather name={icone} size={18} color={cores.verde} />
        </YStack>
        <Feather name="chevron-right" size={18} color={cores.textoTerc} />
      </XStack>
      <Text fontSize={18} fontWeight="700" color="texto" marginTop={8} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text fontSize={13} color="textoSec">
        {label}
      </Text>
    </Cartao>
  );
}

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
  const [atualizando, setAtualizando] = useState(false);
  const [totalPropriedades, setTotalPropriedades] = useState(0);
  const [areaTotal, setAreaTotal] = useState(0);
  const [gastoMes, setGastoMes] = useState(0);
  const [gastoAno, setGastoAno] = useState(0);
  const [plantiosAtivos, setPlantiosAtivos] = useState(0);
  const [proximaColheita, setProximaColheita] = useState<ProximaColheita | null>(null);

  async function carregar(opts?: { silent?: boolean }) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      if (!opts?.silent) setCarregando(true);
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
    } catch (error) {
      console.log('Erro ao carregar resumo:', error);
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar o resumo.'));
    } finally {
      if (!opts?.silent) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  async function handleAtualizar() {
    setAtualizando(true);
    await carregar({ silent: true });
    setAtualizando(false);
  }

  const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Tela edges={['top', 'left', 'right']}>
      <Cabecalho titulo="Resumo" subtitulo="Toque em um cartão para ver os detalhes" />

      {carregando ? (
        <Carregando />
      ) : totalPropriedades === 0 ? (
        <EstadoVazio
          icone="bar-chart-2"
          titulo="Ainda não há o que resumir"
          texto="Cadastre uma propriedade e lance plantios e despesas. Os números aparecem aqui automaticamente."
          acao={{ titulo: 'Cadastrar propriedade', onPress: () => navigation.navigate('PropriedadeForm') }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={handleAtualizar} colors={[cores.verde]} tintColor={cores.verde} />}
        >
          <XStack flexWrap="wrap" gap={12}>
            <CartaoNumero icone="map-pin" valor={String(totalPropriedades)} label="Propriedades" onPress={() => navigation.navigate('Propriedades')} />
            <CartaoNumero icone="maximize" valor={`${areaTotal} ha`} label="Área total" onPress={() => navigation.navigate('Propriedades')} />
            <CartaoNumero icone="calendar" valor={formatarMoeda(gastoMes)} label="Gasto no mês" onPress={() => navigation.navigate('ResumoDespesas', { periodo: 'mes' })} />
            <CartaoNumero icone="trending-up" valor={formatarMoeda(gastoAno)} label="Gasto no ano" onPress={() => navigation.navigate('ResumoDespesas', { periodo: 'ano' })} />
          </XStack>

          <Cartao
            tom="verde"
            interativo
            marginTop={12}
            flexDirection="row"
            alignItems="center"
            gap={14}
            onPress={() => navigation.navigate('Plantios')}
            accessibilityRole="button"
          >
            <YStack width={44} height={44} borderRadius="full" backgroundColor="rgba(255,255,255,0.18)" alignItems="center" justifyContent="center">
              <Feather name="feather" size={22} color={cores.sobreVerde} />
            </YStack>
            <YStack flex={1}>
              <Text fontSize={24} fontWeight="700" color="sobreVerde">
                {plantiosAtivos}
              </Text>
              <Text fontSize={13} color="sobreVerdeSuave">
                {plantiosAtivos === 1 ? 'Plantio ativo' : 'Plantios ativos'}
              </Text>
            </YStack>
            <Feather name="chevron-right" size={20} color={cores.sobreVerdeSuave} />
          </Cartao>

          {proximaColheita && (
            <Cartao interativo marginTop={12} onPress={() => navigation.navigate('ResumoColheitas')} accessibilityRole="button">
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize={13} fontWeight="600" color="textoSec" textTransform="uppercase" letterSpacing={0.6}>
                  Próxima colheita
                </Text>
                <Feather name="chevron-right" size={18} color={cores.textoTerc} />
              </XStack>
              <Text fontSize={16} fontWeight="600" color="texto" marginTop={6}>
                {proximaColheita.tipoNome} · {proximaColheita.propriedadeNome}
              </Text>
              <Text fontSize={14} fontWeight="700" color={proximaColheita.diasRestantes <= 0 ? 'alerta' : 'verde'} marginTop={4}>
                {proximaColheita.texto}
              </Text>
            </Cartao>
          )}
        </ScrollView>
      )}
    </Tela>
  );
}
