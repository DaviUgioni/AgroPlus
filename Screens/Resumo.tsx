import { useCallback, useMemo, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { carregarResumo, formatarMoeda, DadosResumo } from '../Services/resumo';
import { estimativaColheita, textoEstimativa } from '../Services/plantios';
import { CanceladoError, SemPropriedadesError, compartilharPlanilha } from '../Services/planilha';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import {
  BarraProgresso,
  Botao,
  Cabecalho,
  Cartao,
  Chip,
  EstadoVazio,
  GraficoColunas,
  ListaEsqueleto,
  Tela,
  toast,
} from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type ResumoNavigationProp = NavigationProp<RootStackParamList, 'Resumo'>;
type Periodo = 'mes' | 'ano' | 'tudo';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// Soma das despesas que caem no período (mês ou ano de referência; "tudo" soma tudo)
function somar(despesas: DadosResumo['despesas'], periodo: Periodo, ano: number, mes: number) {
  let total = 0;
  for (const d of despesas) {
    const dt = d.data?.toDate?.();
    if (!dt) continue;
    if (periodo === 'mes' && !(dt.getFullYear() === ano && dt.getMonth() === mes)) continue;
    if (periodo === 'ano' && dt.getFullYear() !== ano) continue;
    total += d.valor;
  }
  return total;
}

export default function Resumo() {
  const navigation = useNavigation<ResumoNavigationProp>();
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [dados, setDados] = useState<DadosResumo | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const agora = new Date();
  const [mesGrafico, setMesGrafico] = useState(agora.getMonth());

  async function carregar(opts?: { silent?: boolean }) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      if (!opts?.silent) setCarregando(true);
      setDados(await carregarResumo(userId));
    } catch (error) {
      console.log('Erro ao carregar resumo:', error);
      toast.erro(mensagemErro(error, 'Não foi possível carregar o resumo.'));
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

  async function handleExportar() {
    try {
      setExportando(true);
      await compartilharPlanilha();
    } catch (error) {
      if (error instanceof CanceladoError) return;
      if (error instanceof SemPropriedadesError) toast.info('Cadastre uma propriedade primeiro.');
      else toast.erro(mensagemErro(error, 'Não foi possível gerar a planilha.'));
    } finally {
      setExportando(false);
    }
  }

  const ano = agora.getFullYear();
  const mes = agora.getMonth();

  const calculos = useMemo(() => {
    if (!dados) return null;
    const gasto = somar(dados.despesas, periodo, ano, mes);

    // Período anterior, para comparar (não existe para "tudo")
    let anterior: number | null = null;
    let rotuloAnterior = '';
    if (periodo === 'mes') {
      const d = new Date(ano, mes - 1, 1);
      anterior = somar(dados.despesas, 'mes', d.getFullYear(), d.getMonth());
      rotuloAnterior = MESES[d.getMonth()];
    } else if (periodo === 'ano') {
      anterior = somar(dados.despesas, 'ano', ano - 1, 0);
      rotuloAnterior = String(ano - 1);
    }

    const porMes = Array.from({ length: 12 }, (_, m) => somar(dados.despesas, 'mes', ano, m));

    const colheitas = dados.plantios
      .map((p) => {
        const est = estimativaColheita(p.dataPlantio, p.diasParaColheita);
        return {
          id: p.id!,
          titulo: p.tipoNome,
          local: `${p.propriedadeNome}${p.talhaoNome ? ` · ${p.talhaoNome}` : ''}`,
          texto: textoEstimativa(est),
          pronto: est.pronto,
          dias: est.diasRestantes,
          progresso: 1 - est.diasRestantes / (p.diasParaColheita || 1),
        };
      })
      .sort((a, b) => a.dias - b.dias);

    return { gasto, anterior, rotuloAnterior, porMes, colheitas };
  }, [dados, periodo, ano, mes]);

  const nomePeriodo = periodo === 'mes' ? MESES[mes] : periodo === 'ano' ? String(ano) : 'de todo o período';
  const custoPorHa = dados && dados.areaTotal > 0 && calculos ? calculos.gasto / dados.areaTotal : null;

  // Variação em relação ao período anterior
  let variacao: { pct: number; subiu: boolean } | null = null;
  if (calculos && calculos.anterior !== null && calculos.anterior > 0) {
    const pct = ((calculos.gasto - calculos.anterior) / calculos.anterior) * 100;
    variacao = { pct: Math.abs(Math.round(pct)), subiu: pct > 0 };
  }

  return (
    <Tela edges={['top', 'left', 'right']}>
      <Cabecalho
        voltar={false}
        grande
        titulo="Resumo"
        subtitulo="Seus números em um só lugar"
        direita={<Botao variante="contorno" tamanho="sm" icone="share-2" titulo="Planilha" carregando={exportando} onPress={handleExportar} />}
      />

      {carregando || !dados || !calculos ? (
        <ListaEsqueleto quantidade={3} />
      ) : dados.propriedades.length === 0 ? (
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
          <XStack gap={8} marginBottom={14}>
            <Chip texto="Este mês" ativo={periodo === 'mes'} onPress={() => setPeriodo('mes')} />
            <Chip texto="Este ano" ativo={periodo === 'ano'} onPress={() => setPeriodo('ano')} />
            <Chip texto="Tudo" ativo={periodo === 'tudo'} onPress={() => setPeriodo('tudo')} />
          </XStack>

          {/* Gasto do período, com comparação */}
          <Cartao
            tom="verde"
            interativo
            padding={20}
            gap={4}
            onPress={() => navigation.navigate('ResumoDespesas', { periodo: periodo === 'ano' ? 'ano' : 'mes' })}
            accessibilityRole="button"
            accessibilityLabel={`Gasto ${nomePeriodo}: ${formatarMoeda(calculos.gasto)}. Toque para ver detalhes`}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize={14} fontWeight="600" color="sobreVerdeSuave">
                Gasto {periodo === 'tudo' ? nomePeriodo : `em ${nomePeriodo}`}
              </Text>
              <Feather name="chevron-right" size={20} color={cores.sobreVerdeSuave} />
            </XStack>
            <Text fontSize={34} fontWeight="800" color="sobreVerde" numberOfLines={1} adjustsFontSizeToFit>
              {formatarMoeda(calculos.gasto)}
            </Text>
            {variacao ? (
              <XStack alignItems="center" gap={6}>
                <Feather name={variacao.subiu ? 'trending-up' : 'trending-down'} size={16} color={cores.sobreVerde} />
                <Text fontSize={14} fontWeight="700" color="sobreVerde">
                  {variacao.pct === 0
                    ? `Igual a ${calculos.rotuloAnterior}`
                    : `${variacao.subiu ? 'Subiu' : 'Caiu'} ${variacao.pct}% em relação a ${calculos.rotuloAnterior}`}
                </Text>
              </XStack>
            ) : periodo !== 'tudo' ? (
              <Text fontSize={14} color="sobreVerdeSuave">
                Sem gastos em {calculos.rotuloAnterior} para comparar
              </Text>
            ) : null}
          </Cartao>

          <XStack gap={12} marginTop={12}>
            <Cartao flex={1} gap={2}>
              <Feather name="maximize" size={20} color={cores.verde} />
              <Text fontSize={22} fontWeight="800" color="texto" marginTop={6} numberOfLines={1} adjustsFontSizeToFit>
                {custoPorHa !== null ? formatarMoeda(custoPorHa) : '–'}
              </Text>
              <Text fontSize={14} color="textoSec">
                por hectare ({dados.areaTotal.toLocaleString('pt-BR')} ha)
              </Text>
            </Cartao>
            <Cartao flex={1} interativo gap={2} onPress={() => navigation.navigate('Plantios')} accessibilityRole="button">
              <Feather name="feather" size={20} color={cores.verde} />
              <Text fontSize={22} fontWeight="800" color="texto" marginTop={6}>
                {dados.plantiosAtivos}
              </Text>
              <Text fontSize={14} color="textoSec">
                {dados.plantiosAtivos === 1 ? 'plantio ativo' : 'plantios ativos'}
              </Text>
            </Cartao>
          </XStack>

          {/* Gasto mês a mês */}
          <Cartao marginTop={12} gap={10}>
            <YStack>
              <Text fontSize={14} fontWeight="700" color="texto">
                Gasto por mês em {ano}
              </Text>
              <Text fontSize={13} color="textoSec" marginTop={2}>
                {MESES[mesGrafico].charAt(0).toUpperCase() + MESES[mesGrafico].slice(1)}: {formatarMoeda(calculos.porMes[mesGrafico])}
              </Text>
            </YStack>
            <GraficoColunas
              altura={96}
              valores="nenhum"
              aoTocar={setMesGrafico}
              dados={calculos.porMes.map((valor, i) => ({ rotulo: MESES[i].charAt(0).toUpperCase(), valor, destaque: i === mesGrafico }))}
            />
          </Cartao>

          {/* Próximas colheitas */}
          {calculos.colheitas.length > 0 ? (
            <Cartao marginTop={12} gap={14}>
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize={13} fontWeight="700" color="textoSec" textTransform="uppercase" letterSpacing={0.6}>
                  Próximas colheitas
                </Text>
                <Text fontSize={14} fontWeight="700" color="verde" onPress={() => navigation.navigate('ResumoColheitas')} accessibilityRole="button">
                  Ver todas
                </Text>
              </XStack>
              {calculos.colheitas.slice(0, 4).map((c) => (
                <YStack key={c.id} gap={6}>
                  <XStack justifyContent="space-between" alignItems="baseline" gap={8}>
                    <Text flex={1} fontSize={15} fontWeight="700" color="texto" numberOfLines={1}>
                      {c.titulo}
                    </Text>
                    <Text fontSize={13} fontWeight="700" color={c.pronto ? 'alerta' : 'verde'}>
                      {c.texto}
                    </Text>
                  </XStack>
                  <Text fontSize={13} color="textoSec" numberOfLines={1}>
                    {c.local}
                  </Text>
                  <BarraProgresso valor={c.progresso} cor={c.pronto ? 'alerta' : 'verdeDestaque'} />
                </YStack>
              ))}
            </Cartao>
          ) : null}
        </ScrollView>
      )}
    </Tela>
  );
}
