// Screens/Home.tsx
import { useCallback, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { XStack, YStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { nomeDoUsuario } from '../Services/conta';
import { carregarResumo, formatarMoeda, DadosResumo } from '../Services/resumo';
import { RootStackParamList } from '../App';
import { cores } from '../tamagui.config';
import { BotaoIcone, BotaoOlho, Cartao, Corpo, EstadoVazio, Esqueleto, ItemLista, Legenda, ListaEsqueleto, Subtitulo, Tela, Titulo, TituloSecao, Oculto } from '../Components/ui';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

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
        <Corpo fontSize={20} fontWeight="800" color="verde">
          AgroPlus
        </Corpo>
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
        <YStack marginBottom={16}>
          <Titulo>{nome ? `${saudacao()}, ${nome}` : saudacao()}</Titulo>
          {dados && dados.plantiosAtivos > 0 ? (
            <Subtitulo marginTop={2}>
              {dados.plantiosAtivos} {dados.plantiosAtivos === 1 ? 'plantio ativo' : 'plantios ativos'}
            </Subtitulo>
          ) : null}
        </YStack>

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
            <Esqueleto altura={112} raio={8} />
            <ListaEsqueleto quantidade={1} />
          </YStack>
        ) : null}

        {semPropriedades ? (
          <YStack>
            <TituloSecao marginBottom={0}>Para começar</TituloSecao>
            <ItemLista
              titulo="Cadastrar propriedade"
              subtitulo="Nome, localização e tamanho em hectares"
              onPress={() => navigation.navigate('PropriedadeForm')}
              direita={<Feather name="plus" size={20} color={cores.verde} />}
            />
          </YStack>
        ) : null}

        {dados && !semPropriedades ? (
          <YStack gap={16}>
            <Cartao
              tom="verde"
              interativo
              gap={4}
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
              <YStack>
                <TituloSecao marginBottom={0}>Próxima colheita</TituloSecao>
                <ItemLista
                  titulo={`${dados.proximaColheita.tipoNome} · ${dados.proximaColheita.propriedadeNome}`}
                  onPress={() => navigation.navigate('ResumoColheitas')}
                >
                  <Legenda fontWeight="700" color={dados.proximaColheita.diasRestantes <= 0 ? 'alerta' : 'textoSec'} marginTop={2}>
                    {dados.proximaColheita.texto}
                  </Legenda>
                </ItemLista>
              </YStack>
            ) : null}

            {!dados.proximaColheita && dados.plantiosAtivos === 0 ? (
              <ItemLista
                titulo="Nenhum plantio ativo"
                subtitulo="Registrar plantio"
                onPress={registrarPlantio}
                accessibilityLabel="Registrar plantio"
                direita={<Feather name="plus" size={20} color={cores.verde} />}
              />
            ) : null}
          </YStack>
        ) : null}
      </ScrollView>
    </Tela>
  );
}
