import { useState, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Text, XStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { listarPropriedades } from '../Services/propriedades';
import { listarDespesasPorPropriedade, totalDespesasMes, totalDespesasAno, CategoriaDespesa, LABELS_CATEGORIA } from '../Services/despesas';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Cabecalho, Cartao, Chip, EstadoVazio, GraficoBarras, ItemLista, ListaEsqueleto, Tela, TituloSecao, toast } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type ResumoDespesasRouteProp = RouteProp<RootStackParamList, 'ResumoDespesas'>;
type NavProp = NavigationProp<RootStackParamList>;

interface LinhaPropriedade {
  propriedadeId: string;
  nome: string;
  valor: number;
}

export default function ResumoDespesas() {
  const route = useRoute<ResumoDespesasRouteProp>();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [periodo, setPeriodo] = useState<'mes' | 'ano'>(route.params?.periodo ?? 'mes');

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [total, setTotal] = useState(0);
  const [porPropriedade, setPorPropriedade] = useState<LinhaPropriedade[]>([]);
  const [porCategoria, setPorCategoria] = useState<{ categoria: CategoriaDespesa; valor: number }[]>([]);

  async function carregar(opts?: { silent?: boolean }) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      if (!opts?.silent) setCarregando(true);
      const propriedades = await listarPropriedades(userId);
      const agora = new Date();
      const anoAtual = agora.getFullYear();
      const mesAtual = agora.getMonth();

      const linhas: LinhaPropriedade[] = [];
      const categorias: Record<CategoriaDespesa, number> = { insumo: 0, mao_de_obra: 0, maquinario: 0, outros: 0 };
      let somaTotal = 0;

      for (const prop of propriedades) {
        const despesas = (await listarDespesasPorPropriedade(prop.id!)).filter(
          (d) => (d.data?.toMillis?.() ?? 0) <= agora.getTime()
        );
        const valor = periodo === 'mes'
          ? totalDespesasMes(despesas, anoAtual, mesAtual)
          : totalDespesasAno(despesas, anoAtual);
        if (valor > 0) linhas.push({ propriedadeId: prop.id!, nome: prop.nome, valor });
        somaTotal += valor;

        const filtradas = despesas.filter((d) => {
          const dt = d.data?.toDate?.();
          if (!dt) return false;
          return periodo === 'mes'
            ? dt.getFullYear() === anoAtual && dt.getMonth() === mesAtual
            : dt.getFullYear() === anoAtual;
        });
        for (const d of filtradas) {
          categorias[d.categoria] = (categorias[d.categoria] || 0) + d.valor;
        }
      }

      linhas.sort((a, b) => b.valor - a.valor);
      setPorPropriedade(linhas);
      setTotal(somaTotal);
      setPorCategoria(
        (Object.keys(categorias) as CategoriaDespesa[])
          .map((c) => ({ categoria: c, valor: categorias[c] }))
          .filter((c) => c.valor > 0)
          .sort((a, b) => b.valor - a.valor)
      );
    } catch (error) {
      toast.erro(mensagemErro(error, 'Não foi possível carregar os gastos.'));
    } finally {
      if (!opts?.silent) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [periodo])
  );

  async function handleAtualizar() {
    setAtualizando(true);
    await carregar({ silent: true });
    setAtualizando(false);
  }

  const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Tela edges={['top', 'left', 'right']}>
      <Cabecalho titulo="Gastos por propriedade" />

      <XStack gap={8} marginBottom={16}>
        <Chip texto="Este mês" ativo={periodo === 'mes'} onPress={() => setPeriodo('mes')} />
        <Chip texto="Este ano" ativo={periodo === 'ano'} onPress={() => setPeriodo('ano')} />
      </XStack>

      {carregando ? (
        <ListaEsqueleto quantidade={3} />
      ) : (
        <FlatList
          data={porPropriedade}
          keyExtractor={(item) => item.propriedadeId}
          contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          ListHeaderComponent={
            <>
              <Cartao tom="verde" marginBottom={16}>
                <Text fontSize={13} color="sobreVerdeSuave">
                  Total {periodo === 'mes' ? 'do mês' : 'do ano'}
                </Text>
                <Text fontSize={28} fontWeight="700" color="sobreVerde" marginTop={2}>
                  {formatarMoeda(total)}
                </Text>
              </Cartao>

              {porCategoria.length > 0 && (
                <Cartao marginBottom={20}>
                  <TituloSecao>Por categoria</TituloSecao>
                  <GraficoBarras
                    formatar={formatarMoeda}
                    dados={porCategoria.map((c) => ({ rotulo: LABELS_CATEGORIA[c.categoria], valor: c.valor }))}
                  />
                </Cartao>
              )}

              {porPropriedade.length > 0 && <TituloSecao>Por propriedade</TituloSecao>}
            </>
          }
          ListEmptyComponent={<EstadoVazio icone="dollar-sign" texto="Nenhuma despesa nesse período." marginTop={16} />}
          renderItem={({ item }) => (
            <ItemLista
              icone="map"
              titulo={item.nome}
              onPress={() => navigation.navigate('DespesasLista', { propriedadeId: item.propriedadeId })}
              direita={
                <XStack alignItems="center" gap={6}>
                  <Text fontSize={14} fontWeight="600" color="verde">
                    {formatarMoeda(item.valor)}
                  </Text>
                  <Feather name="chevron-right" size={18} color={cores.textoTerc} />
                </XStack>
              }
            />
          )}
        />
      )}
    </Tela>
  );
}
