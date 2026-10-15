import { useState, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { auth } from '../FirebaseConfig';
import { listarPropriedades, Propriedade } from '../Services/propriedades';
import { RootStackParamList } from '../App';
import { Cabecalho, Carregando, EstadoVazio, ItemLista, Tela } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type DespesasNavigationProp = NavigationProp<RootStackParamList, 'Despesas'>;

export default function Despesas() {
  const navigation = useNavigation<DespesasNavigationProp>();
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  async function carregarPropriedades(opts?: { silent?: boolean }) {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      if (!opts?.silent) setCarregando(true);
      const dados = await listarPropriedades(userId);
      setPropriedades(dados);
    } catch (error) {
      Alert.alert('Erro', mensagemErro(error, 'Não foi possível carregar as propriedades.'));
    } finally {
      if (!opts?.silent) setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarPropriedades();
    }, [])
  );

  async function handleAtualizar() {
    setAtualizando(true);
    await carregarPropriedades({ silent: true });
    setAtualizando(false);
  }


  return (
    <Tela>
      <Cabecalho titulo="Despesas" subtitulo="Escolha uma propriedade para ver as despesas" />

      {carregando ? (
        <Carregando />
      ) : propriedades.length === 0 ? (
        <EstadoVazio
          icone="map"
          titulo="Cadastre uma propriedade primeiro"
          texto="Os registros ficam organizados por propriedade. Depois de cadastrar, volte aqui."
          acao={{ titulo: 'Cadastrar propriedade', onPress: () => navigation.navigate('PropriedadeForm') }}
        />
      ) : (
        <FlatList
          data={propriedades}
          keyExtractor={(item) => item.id!}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          renderItem={({ item }) => (
            <ItemLista
              titulo={item.nome}
              subtitulo={`${item.localizacao} · ${item.areaTotal} ha`}
              onPress={() => navigation.navigate('DespesasLista', { propriedadeId: item.id! })}
            />
          )}
        />
      )}
    </Tela>
  );
}
