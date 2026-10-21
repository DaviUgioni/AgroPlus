// Screens/Home.tsx
import { useCallback, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Image, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, XStack, YStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { nomeDoUsuario } from '../Services/conta';
import { carregarResumo, formatarMoeda, DadosResumo } from '../Services/resumo';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao, Cartao, Esqueleto, GraficoColunas, Subtitulo, Tela, Titulo } from '../Components/ui';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const PASSOS = [
  { titulo: 'Cadastre sua propriedade', texto: 'Nome, localização e tamanho em hectares.' },
  { titulo: 'Divida em talhões', texto: 'Talhões são as partes da propriedade, como "Área do milho".' },
  { titulo: 'Registre plantios e despesas', texto: 'O app calcula a colheita e soma seus gastos.' },
];

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Home() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [dados, setDados] = useState<DadosResumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [nome, setNome] = useState(nomeDoUsuario());

  async function carregar(silencioso?: boolean) {
    setNome(nomeDoUsuario()); // pode ter mudado nas Configurações
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      // Sem internet o Firestore pode responder só com o cache; nesse caso mostramos o que houver
      setDados(await carregarResumo(userId));
    } catch {
      setDados(null);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  async function atualizar() {
    setAtualizando(true);
    await carregar(true);
    setAtualizando(false);
  }

  const semPropriedades = !!dados && dados.propriedades.length === 0;
  const unica = dados?.propriedades.length === 1 ? dados.propriedades[0] : null;
  const mes = MESES[new Date().getMonth()];

  // Com uma só propriedade vai direto ao formulário; com várias, a aba pergunta qual
  function lancarDespesa() {
    if (unica) navigation.navigate('DespesaForm', { propriedadeId: unica.id! });
    else navigation.navigate('Despesas');
  }
  function novoPlantio() {
    if (unica) navigation.navigate('PlantioForm', { propriedadeId: unica.id! });
    else navigation.navigate('Plantios');
  }

  return (
    <Tela edges={['top', 'left', 'right']}>
      <XStack alignItems="center" justifyContent="space-between" marginTop={12}>
        <XStack alignItems="center" gap={8}>
          <Image source={require('../assets/logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
          <Text fontSize={20} fontWeight="800" color="verde">
            AgroPlus
          </Text>
        </XStack>
        <XStack gap={4}>
          <YStack
            width={44}
            height={44}
            borderRadius="full"
            alignItems="center"
            justifyContent="center"
            backgroundColor="transparent press:begeClaro"
            onPress={() => navigation.navigate('Ajuda')}
            accessibilityRole="button"
            accessibilityLabel="Ajuda"
          >
            <Feather name="help-circle" size={22} color={cores.textoSec} />
          </YStack>
          <YStack
            width={44}
            height={44}
            borderRadius="full"
            alignItems="center"
            justifyContent="center"
            backgroundColor="transparent press:begeClaro"
            onPress={() => navigation.navigate('Configuracoes')}
            accessibilityRole="button"
            accessibilityLabel="Configurações"
          >
            <Feather name="settings" size={22} color={cores.textoSec} />
          </YStack>
        </XStack>
      </XStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[cores.verde]} tintColor={cores.verde} />}
      >
        <Titulo fontSize={28} fontWeight="800">
          {nome ? `${saudacao()}, ${nome}!` : `${saudacao()}!`}
        </Titulo>
        <Subtitulo marginTop={4} marginBottom={20}>
          {semPropriedades ? 'Vamos configurar sua produção em 3 passos.' : 'Veja como está a sua produção hoje.'}
        </Subtitulo>

        {carregando ? (
          <YStack gap={12}>
            <Esqueleto altura={132} raio={20} />
            <XStack gap={12}>
              <YStack flex={1}>
                <Esqueleto altura={92} raio={20} />
              </YStack>
              <YStack flex={1}>
                <Esqueleto altura={92} raio={20} />
              </YStack>
            </XStack>
          </YStack>
        ) : null}

        {semPropriedades ? (
          <Cartao gap={14}>
            {PASSOS.map((p, i) => (
              <XStack key={p.titulo} gap={12} alignItems="flex-start">
                <YStack
                  width={30}
                  height={30}
                  borderRadius="full"
                  backgroundColor={i === 0 ? 'verdeDestaque' : 'verdeSuave'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={14} fontWeight="700" color={i === 0 ? 'sobreVerde' : 'verde'}>
                    {i + 1}
                  </Text>
                </YStack>
                <YStack flex={1}>
                  <Text fontSize={16} fontWeight="700" color="texto">
                    {p.titulo}
                  </Text>
                  <Text fontSize={14} color="textoSec" marginTop={2}>
                    {p.texto}
                  </Text>
                </YStack>
              </XStack>
            ))}
            <Botao icone="plus" titulo="Cadastrar minha propriedade" marginTop={4} onPress={() => navigation.navigate('PropriedadeForm')} />
          </Cartao>
        ) : null}

        {dados && !semPropriedades ? (
          <YStack gap={12}>
            <Cartao
              tom="verde"
              interativo
              gap={4}
              padding={20}
              onPress={() => navigation.navigate('ResumoDespesas', { periodo: 'mes' })}
              accessibilityRole="button"
              accessibilityLabel={`Gasto em ${mes}: ${formatarMoeda(dados.gastoMes)}`}
            >
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize={14} fontWeight="600" color="sobreVerdeSuave">
                  Gasto em {mes}
                </Text>
                <Feather name="chevron-right" size={20} color={cores.sobreVerdeSuave} />
              </XStack>
              <Text fontSize={34} fontWeight="800" color="sobreVerde" numberOfLines={1} adjustsFontSizeToFit>
                {formatarMoeda(dados.gastoMes)}
              </Text>
              <Text fontSize={14} color="sobreVerdeSuave">
                {formatarMoeda(dados.gastoAno)} no ano
              </Text>
            </Cartao>

            <XStack gap={12}>
              <Cartao flex={1} interativo gap={2} onPress={() => navigation.navigate('Plantios')} accessibilityRole="button">
                <Feather name="feather" size={20} color={cores.verde} />
                <Text fontSize={26} fontWeight="800" color="texto" marginTop={6}>
                  {dados.plantiosAtivos}
                </Text>
                <Text fontSize={14} color="textoSec">
                  {dados.plantiosAtivos === 1 ? 'plantio ativo' : 'plantios ativos'}
                </Text>
              </Cartao>
              <Cartao flex={1} interativo gap={2} onPress={() => navigation.navigate('Propriedades')} accessibilityRole="button">
                <Feather name="map-pin" size={20} color={cores.verde} />
                <Text fontSize={26} fontWeight="800" color="texto" marginTop={6} numberOfLines={1} adjustsFontSizeToFit>
                  {dados.areaTotal.toLocaleString('pt-BR')} ha
                </Text>
                <Text fontSize={14} color="textoSec">
                  {dados.propriedades.length === 1 ? '1 propriedade' : `${dados.propriedades.length} propriedades`}
                </Text>
              </Cartao>
            </XStack>

            {dados.proximaColheita ? (
              <Cartao interativo onPress={() => navigation.navigate('ResumoColheitas')} accessibilityRole="button">
                <XStack alignItems="center" gap={12}>
                  <YStack width={44} height={44} borderRadius="full" backgroundColor="alertaSuave" alignItems="center" justifyContent="center">
                    <Feather name="calendar" size={20} color={cores.alerta} />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize={13} fontWeight="700" color="textoSec" textTransform="uppercase" letterSpacing={0.6}>
                      Próxima colheita
                    </Text>
                    <Text fontSize={16} fontWeight="700" color="texto" marginTop={2}>
                      {dados.proximaColheita.tipoNome} · {dados.proximaColheita.propriedadeNome}
                    </Text>
                    <Text fontSize={14} fontWeight="700" color={dados.proximaColheita.diasRestantes <= 0 ? 'alerta' : 'verde'} marginTop={2}>
                      {dados.proximaColheita.texto}
                    </Text>
                  </YStack>
                  <Feather name="chevron-right" size={20} color={cores.textoTerc} />
                </XStack>
              </Cartao>
            ) : null}

            {dados.gastosPorMes.some((g) => g.valor > 0) ? (
              <Cartao gap={12}>
                <Text fontSize={13} fontWeight="700" color="textoSec" textTransform="uppercase" letterSpacing={0.6}>
                  Gastos nos últimos 6 meses
                </Text>
                <GraficoColunas
                  dados={dados.gastosPorMes.map((g, i) => ({
                    rotulo: MESES_CURTOS[g.mes],
                    valor: g.valor,
                    destaque: i === dados.gastosPorMes.length - 1,
                  }))}
                />
              </Cartao>
            ) : null}

            <Text fontSize={13} fontWeight="700" color="textoSec" textTransform="uppercase" letterSpacing={0.6} marginTop={8}>
              Atalhos
            </Text>
            <XStack gap={12}>
              <Botao flex={1} icone="plus" titulo="Lançar despesa" onPress={lancarDespesa} />
              <Botao flex={1} variante="secundario" icone="feather" titulo="Novo plantio" onPress={novoPlantio} />
            </XStack>
          </YStack>
        ) : null}
      </ScrollView>
    </Tela>
  );
}
