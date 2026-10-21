// Components/ComPropriedade.tsx
// Moldura das abas Plantios e Despesas: cabeçalho, escolha da propriedade (chips) e o conteúdo dela.
// A propriedade escolhida é lembrada entre as abas enquanto o app está aberto.
import { ReactNode, useCallback, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { YStack } from 'tamagui';
import { auth } from '../FirebaseConfig';
import { listarPropriedades, Propriedade } from '../Services/propriedades';
import { mensagemErro } from '../Services/erros';
import { RootStackParamList } from '../App';
import { Cabecalho, Chip, EstadoVazio, ListaEsqueleto, Tela } from './ui';

let propriedadeAtivaId: string | null = null;

type Props = {
  titulo: string;
  /** Recebe a propriedade escolhida e devolve o conteúdo da aba */
  children: (propriedade: Propriedade) => ReactNode;
};

export default function ComPropriedade({ titulo, children }: Props) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [escolhidaId, setEscolhidaId] = useState<string | null>(propriedadeAtivaId);

  useFocusEffect(
    useCallback(() => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      listarPropriedades(userId)
        .then((lista) => {
          setPropriedades(lista);
          // Mantém a escolha anterior se ela ainda existe; senão usa a primeira
          const id = lista.find((p) => p.id === propriedadeAtivaId)?.id ?? lista[0]?.id ?? null;
          propriedadeAtivaId = id ?? null;
          setEscolhidaId(id ?? null);
        })
        .catch((error) => Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar as propriedades.')))
        .finally(() => setCarregando(false));
    }, [])
  );

  function escolher(id: string) {
    propriedadeAtivaId = id;
    setEscolhidaId(id);
  }

  const escolhida = propriedades.find((p) => p.id === escolhidaId);

  return (
    <Tela edges={['top', 'left', 'right']}>
      <Cabecalho voltar={false} grande titulo={titulo} subtitulo={propriedades.length === 1 ? propriedades[0].nome : undefined} />

      {carregando ? (
        <ListaEsqueleto quantidade={3} />
      ) : propriedades.length === 0 ? (
        <EstadoVazio
          icone="map"
          titulo="Cadastre uma propriedade primeiro"
          texto="Os registros ficam organizados por propriedade. Depois de cadastrar, volte aqui."
          acao={{ titulo: 'Cadastrar propriedade', onPress: () => navigation.navigate('PropriedadeForm') }}
        />
      ) : (
        <YStack flex={1}>
          {propriedades.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginBottom: 12 }}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              {propriedades.map((p) => (
                <Chip key={p.id} texto={p.nome} ativo={p.id === escolhidaId} onPress={() => escolher(p.id!)} />
              ))}
            </ScrollView>
          ) : null}
          {/* key força recarregar o conteúdo ao trocar de propriedade */}
          {escolhida ? <YStack key={escolhida.id} flex={1}>{children(escolhida)}</YStack> : null}
        </YStack>
      )}
    </Tela>
  );
}
