import { useCallback, useMemo, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { XStack, YStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { carregarResumo, formatarMoeda, DadosResumo } from '../Services/resumo';
import { estimativaColheita, textoEstimativa } from '../Services/plantios';
import { CanceladoError, SemPropriedadesError, compartilharPlanilha } from '../Services/planilha';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import {
  BarraProgresso,
  Botao,
  BotaoOlho,
  Cabecalho,
  Cartao,
  Chip,
  Corpo,
  EstadoVazio,
  GraficoColunas,
  Legenda,
  ListaEsqueleto,
  Tela,
  Titulo,
  TituloSecao,
  toast,
  Oculto,
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
      // Puxar para atualizar (silent) ignora o cache
      setDados(await carregarResumo(userId, opts?.silent));
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
          >
            <XStack alignItems="center" justifyContent="space-between">
              <Legenda fontWeight="600" color="sobreVerdeSuave">
                Gasto {periodo === 'tudo' ? nomePeriodo : `em ${nomePeriodo}`}
              </Legenda>
              <XStack alignItems="center" gap={4}>
                <BotaoOlho />
                <Feather name="chevron-right" size={20} color={cores.sobreVerdeSuave} />
              </XStack>
            </XStack>
            <Titulo tamanho="destaque" color="sobreVerde" numberOfLines={1} adjustsFontSizeToFit>
              <Oculto>{formatarMoeda(calculos.gasto)}</Oculto>
            </Titulo>
            {variacao ? (
              <XStack alignItems="center" gap={6}>
                <Feather name={variacao.subiu ? 'trending-up' : 'trending-down'} size={16} color={cores.sobreVerde} />
                <Corpo fontWeight="700" color="sobreVerde">
                  {variacao.pct === 0
                    ? `Igual a ${calculos.rotuloAnterior}`
                    : `${variacao.subiu ? 'Subiu' : 'Caiu'} ${variacao.pct}% em relação a ${calculos.rotuloAnterior}`}
                </Corpo>
              </XStack>
            ) : periodo !== 'tudo' ? (
              <Legenda color="sobreVerdeSuave">Sem gastos em {calculos.rotuloAnterior} para comparar</Legenda>
            ) : null}
          </Cartao>

          <XStack gap={12} marginTop={12}>
            <Cartao flex={1} gap={2}>
              <Feather name="maximize" size={20} color={cores.verde} />
              <Titulo fontSize={22} fontWeight="800" marginTop={6} numberOfLines={1} adjustsFontSizeToFit>
                {custoPorHa !== null ? formatarMoeda(custoPorHa) : '–'}
              </Titulo>
              <Legenda>por hectare ({dados.areaTotal.toLocaleString('pt-BR')} ha)</Legenda>
            </Cartao>
            <Cartao flex={1} interativo gap={2} onPress={() => navigation.navigate('Plantios')} accessibilityRole="button">
              <Feather name="feather" size={20} color={cores.verde} />
              <Titulo fontSize={22} fontWeight="800" marginTop={6}>
                {dados.plantiosAtivos}
              </Titulo>
              <Legenda>{dados.plantiosAtivos === 1 ? 'plantio ativo' : 'plantios ativos'}</Legenda>
            </Cartao>
          </XStack>

          {/* Gasto mês a mês */}
          <Cartao marginTop={12} gap={10}>
            <YStack>
              <Corpo fontWeight="700">Gasto por mês em {ano}</Corpo>
              <Legenda marginTop={2}>
                {MESES[mesGrafico].charAt(0).toUpperCase() + MESES[mesGrafico].slice(1)}: {formatarMoeda(calculos.porMes[mesGrafico])}
              </Legenda>
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
                <TituloSecao marginBottom={0}>Próximas colheitas</TituloSecao>
                <Legenda fontWeight="700" color="verde" onPress={() => navigation.navigate('ResumoColheitas')} accessibilityRole="button" hitSlop={14}>
                  Ver todas
                </Legenda>
              </XStack>
              {calculos.colheitas.slice(0, 4).map((c) => (
                <YStack key={c.id} gap={6}>
                  <XStack justifyContent="space-between" alignItems="baseline" gap={8}>
                    <Corpo flex={1} fontWeight="700" numberOfLines={1}>
                      {c.titulo}
                    </Corpo>
                    <Legenda fontWeight="700" color={c.pronto ? 'alerta' : 'verde'}>
                      {c.texto}
                    </Legenda>
                  </XStack>
                  <Legenda numberOfLines={1}>{c.local}</Legenda>
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
