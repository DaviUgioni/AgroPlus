// Screens/Home.tsx
import { useCallback, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Image, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { XStack, YStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { nomeDoUsuario } from '../Services/conta';
import { carregarResumo, formatarMoeda, DadosResumo } from '../Services/resumo';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { Botao, BotaoIcone, BotaoOlho, Cartao, Corpo, EstadoVazio, Esqueleto, Legenda, Subtitulo, Tela, Titulo, TituloSecao, Oculto } from '../Components/ui';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const PASSOS = [
  { titulo: 'Cadastre sua propriedade', texto: 'Nome, localização e tamanho em hectares.' },
  { titulo: 'Divida em talhões', texto: 'Talhões são as partes da propriedade, como "Área do milho".' },
  { titulo: 'Registre plantios e despesas', texto: 'O app calcula a colheita e soma seus gastos.' },
];

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
  const [erro, setErro] = useState(false);
  const [nome, setNome] = useState(nomeDoUsuario());

  async function carregar(silencioso?: boolean) {
    setNome(nomeDoUsuario()); // pode ter mudado nas Configurações
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Sem usuário');
      // Sem internet o Firestore pode responder só com o cache; nesse caso mostramos o que houver
      // Puxar para atualizar (silencioso) ignora o cache
      setDados(await carregarResumo(userId, silencioso));
      setErro(false);
    } catch {
      // Mantém os dados anteriores, se houver; o aviso só aparece quando não há nada para mostrar
      setErro(true);
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
  const mes = MESES[new Date().getMonth()];

  function registrarPlantio() {
    // Com uma só propriedade vai direto ao formulário; com várias, o usuário escolhe na aba Áreas
    const propriedades = dados?.propriedades ?? [];
    if (propriedades.length === 1 && propriedades[0].id) navigation.navigate('PlantioForm', { propriedadeId: propriedades[0].id });
    else navigation.navigate('Propriedades');
  }

  return (
    <Tela edges={['top', 'left', 'right']}>
      <XStack alignItems="center" justifyContent="space-between" marginTop={12}>
        <XStack alignItems="center" gap={8}>
          <Image source={require('../assets/logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
          <Corpo fontSize={20} fontWeight="800" color="verde">
            AgroPlus
          </Corpo>
        </XStack>
        <XStack gap={4}>
          <BotaoIcone icone="help-circle" rotulo="Ajuda" onPress={() => navigation.navigate('Ajuda')} />
          <BotaoIcone icone="settings" rotulo="Configurações" onPress={() => navigation.navigate('Configuracoes')} />
        </XStack>
      </XStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[cores.verde]} tintColor={cores.verde} />}
      >
        <Titulo tamanho="grande">
          {nome ? `${saudacao()}, ${nome}!` : `${saudacao()}!`}
        </Titulo>
        <Subtitulo marginTop={4} marginBottom={20}>
          {semPropriedades ? 'Vamos configurar sua produção em 3 passos.' : 'Veja como está a sua produção hoje.'}
        </Subtitulo>

        {!carregando && erro && !dados ? (
          <EstadoVazio
            marginTop={8}
            icone="wifi-off"
            titulo="Não foi possível carregar"
            texto="Verifique a internet e tente de novo. Você também pode puxar a tela para atualizar."
            acao={{ titulo: 'Tentar de novo', icone: 'refresh-cw', onPress: atualizar }}
          />
        ) : null}

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
                  <Legenda fontWeight="700" color={i === 0 ? 'sobreVerde' : 'verde'}>
                    {i + 1}
                  </Legenda>
                </YStack>
                <YStack flex={1}>
                  <Corpo fontSize={16} fontWeight="700">
                    {p.titulo}
                  </Corpo>
                  <Legenda marginTop={2}>{p.texto}</Legenda>
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
            >
              <XStack alignItems="center" justifyContent="space-between">
                <Legenda fontWeight="600" color="sobreVerdeSuave">
                  Gasto em {mes}
                </Legenda>
                <XStack alignItems="center" gap={4}>
                  <BotaoOlho />
                  <Feather name="chevron-right" size={20} color={cores.sobreVerdeSuave} />
                </XStack>
              </XStack>
              <Titulo tamanho="destaque" color="sobreVerde" numberOfLines={1} adjustsFontSizeToFit>
                <Oculto>{formatarMoeda(dados.gastoMes)}</Oculto>
              </Titulo>
              <Legenda color="sobreVerdeSuave"><Oculto>{formatarMoeda(dados.gastoAno)}</Oculto> no ano</Legenda>
            </Cartao>

            {dados.proximaColheita ? (
              <Cartao interativo onPress={() => navigation.navigate('ResumoColheitas')} accessibilityRole="button">
                <XStack alignItems="center" gap={12}>
                  <YStack width={44} height={44} borderRadius="full" backgroundColor="alertaSuave" alignItems="center" justifyContent="center">
                    <Feather name="calendar" size={20} color={cores.alerta} />
                  </YStack>
                  <YStack flex={1}>
                    <TituloSecao marginBottom={0}>Próxima colheita</TituloSecao>
                    <Corpo fontSize={16} fontWeight="700" marginTop={2}>
                      {dados.proximaColheita.tipoNome} · {dados.proximaColheita.propriedadeNome}
                    </Corpo>
                    <Legenda fontWeight="700" color={dados.proximaColheita.diasRestantes <= 0 ? 'alerta' : 'verde'} marginTop={2}>
                      {dados.proximaColheita.texto}
                    </Legenda>
                  </YStack>
                  <Feather name="chevron-right" size={20} color={cores.textoTerc} />
                </XStack>
              </Cartao>
            ) : null}

            {!dados.proximaColheita && dados.plantiosAtivos === 0 ? (
              <Cartao interativo onPress={registrarPlantio} accessibilityRole="button" accessibilityLabel="Registrar plantio">
                <XStack alignItems="center" gap={12}>
                  <YStack width={44} height={44} borderRadius="full" backgroundColor="verdeSuave" alignItems="center" justifyContent="center">
                    <Feather name="feather" size={20} color={cores.verde} />
                  </YStack>
                  <YStack flex={1}>
                    <Corpo fontSize={16} fontWeight="700">
                      Nenhum plantio ativo
                    </Corpo>
                    <Legenda marginTop={2}>Registre um plantio para acompanhar a colheita.</Legenda>
                  </YStack>
                  <Feather name="plus" size={20} color={cores.verde} />
                </XStack>
              </Cartao>
            ) : null}
          </YStack>
        ) : null}
      </ScrollView>
    </Tela>
  );
}
