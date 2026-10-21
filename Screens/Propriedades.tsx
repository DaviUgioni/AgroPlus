import { useState, useCallback } from 'react';
import { FlatList, Alert, Image } from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { auth } from '../FirebaseConfig';
import { listarPropriedades, Propriedade } from '../Services/propriedades';
import { RootStackParamList } from '../App';
import { BotaoFlutuante, Cabecalho, EstadoVazio, ItemLista, ListaEsqueleto, Tela, toast } from '../Components/ui';
import { mensagemErro } from '../Services/erros';

type PropriedadesNavigationProp = NavigationProp<RootStackParamList, 'Propriedades'>;

export default function Propriedades() {
  const navigation = useNavigation<PropriedadesNavigationProp>();
  const [propriedades, setPropriedades] = useState<Propriedade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  async function carregarPropriedades(opts?: { silent?: boolean }) {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast.erro('Usuário não autenticado.');
      return;
    }

    try {
      if (!opts?.silent) setCarregando(true);
      const dados = await listarPropriedades(userId);
      setPropriedades(dados);
    } catch (error) {
      console.log('Erro ao listar propriedades:', error);
      toast.erro(mensagemErro(error, 'Não foi possível carregar as propriedades.'));
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
    <Tela edges={['top', 'left', 'right']}>
      <Cabecalho voltar={false} grande titulo="Minhas propriedades" subtitulo={propriedades.length > 0 ? 'Toque em uma para ver talhões e gastos' : undefined} />

      {carregando ? (
        <ListaEsqueleto />
      ) : propriedades.length === 0 ? (
        <EstadoVazio
          icone="map"
          titulo="Nenhuma propriedade ainda"
          texto="Cadastre sua fazenda, sítio ou chácara para começar a registrar plantios e despesas."
          acao={{ titulo: 'Cadastrar propriedade', onPress: () => navigation.navigate('PropriedadeForm') }}
        />
      ) : (
        <FlatList
          data={propriedades}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          refreshing={atualizando}
          onRefresh={handleAtualizar}
          renderItem={({ item }) => (
            <ItemLista
              titulo={item.nome}
              subtitulo={`${item.localizacao} · ${item.areaTotal} ha`}
              onPress={() => navigation.navigate('PropriedadeDetalhe', { propriedadeId: item.id! })}
              icone="map"
              esquerda={
                item.imagemUrl ? (
                  <Image source={{ uri: item.imagemUrl }} style={{ width: 52, height: 52, borderRadius: 12 }} />
                ) : undefined
              }
            />
          )}
        />
      )}

      {propriedades.length > 0 && (
        <BotaoFlutuante naAba icone="plus" titulo="Nova propriedade" onPress={() => navigation.navigate('PropriedadeForm')} />
      )}
    </Tela>
  );
}
