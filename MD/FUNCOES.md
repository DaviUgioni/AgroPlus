# AgroPlus — Funções Disponíveis

> Documentação gerada em 03/09/2026 a partir da análise estática do código. Lista todas as funções e funcionalidades implementadas atualmente no projeto.

## Índice
1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Configuração Firebase](#2-configuração-firebase-firebaseconfigts)
3. [Services — Regra de Negócio / Acesso a Dados](#3-services--regra-de-negócio--acesso-a-dados)
   - [3.1 Propriedades](#31-propriedades-servicespropriedadests)
   - [3.2 Talhões](#32-talhões-servicestalhoests)
   - [3.3 Despesas](#33-despesas-servicesdespesasts)
   - [3.4 Imagens](#34-imagens-servicesimagensts)
4. [Screens — Telas e Funções de UI](#4-screens--telas-e-funções-de-ui)
5. [Navegação (App.tsx)](#5-navegação-apptsx)
6. [Tabela Resumo de Todas as Funções](#6-tabela-resumo-de-todas-as-funções)
7. [Dependências Externas Relevantes](#7-dependências-externas-relevantes)

---

## 1. Visão Geral da Arquitetura

```
AgroPlus/
├── FirebaseConfig.ts       # Inicialização Firebase (Auth + Firestore)
├── App.tsx                 # Stack Navigator (13 rotas)
├── Services/               # Camada de serviços (CRUD Firestore + FileSystem)
│   ├── propriedades.ts
│   ├── talhoes.ts
│   ├── despesas.ts
│   └── imagens.ts
└── Screens/                # 13 telas
    ├── Login.tsx
    ├── CriarConta.tsx
    ├── Home.tsx
    ├── Propriedades.tsx
    ├── PropriedadeForm.tsx
    ├── PropriedadeDetalhe.tsx
    ├── TalhaoForm.tsx
    ├── Despesas.tsx
    ├── DespesasLista.tsx
    ├── DespesaForm.tsx
    ├── MapaSelecao.tsx
    ├── Plantios.tsx
    └── Resumo.tsx
```

Fluxo principal: `Login` → `Home` → [ Propriedades | Plantios | Despesas | Resumo ]. Todas as entidades são multi-usuário via `userId` (`auth.currentUser.uid`).

---

## 2. Configuração Firebase — `FirebaseConfig.ts:1`

Inicializa o SDK e exporta instâncias únicas:

| Export | Tipo | Descrição |
|--------|------|-----------|
| `db` | `Firestore` | `getFirestore(app)` — banco NoSQL. `FirebaseConfig.ts:17` |
| `auth` | `Auth` | `getAuth(app)` — autenticação e-mail/senha. `FirebaseConfig.ts:18` |

Config (`FirebaseConfig.ts:6`): `agroplus-2df27` (apiKey, authDomain, projectId, etc).

---

## 3. Services — Regra de Negócio / Acesso a Dados

### 3.1 Propriedades — `Services/propriedades.ts:1`

Interface `Propriedade` (`propriedades.ts:5`):
```ts
interface Propriedade {
  id?: string;
  nome: string;
  localizacao: string;
  latitude?: number;
  longitude?: number;
  areaTotal: number;
  userId: string;
  imagemUrl?: string;
}
```
Coleção Firestore: `propriedades`.

| Função | Assinatura | Linha | Descrição |
|--------|------------|-------|-----------|
| `criarPropriedade` | `async (dados: Omit<Propriedade,'id'>) => string` | `propriedades.ts:16` | Cria documento em `propriedades` com `criadoEm: serverTimestamp()` e retorna o `id` gerado. Usado em `PropriedadeForm.tsx:127`. |
| `listarPropriedades` | `async (userId: string) => Propriedade[]` | `propriedades.ts:24` | Lista todas as propriedades do usuário (`where userId == userId`). Usado em `Propriedades.tsx:26` e `Despesas.tsx:27`. |
| `buscarPropriedade` | `async (id: string) => Propriedade \| null` | `propriedades.ts:30` | Busca por ID (`doc + getDoc`). Retorna `null` se não existe. Usado em `PropriedadeForm.tsx:40`, `PropriedadeDetalhe.tsx:26`, `TalhaoForm.tsx:63`. |
| `atualizarPropriedade` | `async (id: string, dados: Partial<Omit<Propriedade,'id'>>) => void` | `propriedades.ts:37` | Atualiza campos parciais via `updateDoc`. Usado em `PropriedadeForm.tsx:125`. |
| `excluirPropriedade` | `async (id: string) => void` | `propriedades.ts:42` | Exclusão em cascata com `writeBatch`: deleta a propriedade + todos os `talhoes` onde `propriedadeId == id`, depois chama `excluirImagemPropriedade(id)` para limpar arquivo local. Usado em `PropriedadeDetalhe.tsx:53`. |

### 3.2 Talhões — `Services/talhoes.ts:1`

Interface `Talhao` (`talhoes.ts:5`):
```ts
interface Talhao { id?: string; nome: string; area: number; propriedadeId: string; }
```
Coleção: `talhoes`.

| Função | Assinatura | Linha | Descrição |
|--------|------------|-------|-----------|
| `criarTalhao` | `async (dados: Omit<Talhao,'id'>) => string` | `talhoes.ts:12` | Cria talhão com `criadoEm: serverTimestamp()`. Retorna `id`. Validação de área total é feita na tela, não no service. |
| `listarTalhoes` | `async (propriedadeId: string) => Talhao[]` | `talhoes.ts:20` | Lista talhões de uma propriedade (`where propriedadeId ==`). Usado em `PropriedadeDetalhe.tsx:27`, `TalhaoForm.tsx:33`. |
| `atualizarTalhao` | `async (id: string, dados: Partial<Omit<Talhao,'id'>>) => void` | `talhoes.ts:26` | Update parcial via `updateDoc`. |
| `excluirTalhao` | `async (id: string) => void` | `talhoes.ts:31` | Deleta documento via `deleteDoc`. Usado em `PropriedadeDetalhe.tsx:71`. |

> **Regra de negócio** (`TalhaoForm.tsx:72`): soma das áreas dos talhões não pode exceder `propriedade.areaTotal`. Calcula `somaTalhoes - areaTalhaoEdicao + areaNumero`.

### 3.3 Despesas — `Services/despesas.ts:1`

```ts
type CategoriaDespesa = 'insumo' | 'mao_de_obra' | 'maquinario' | 'outros'; // despesas.ts:15
interface Despesa {
  id?: string; propriedadeId: string; talhaoId?: string | null;
  categoria: CategoriaDespesa; descricao: string; valor: number;
  data: Timestamp; criadoEm?: Timestamp;
} // despesas.ts:17
```
Coleção: `despesas`. Constante `despesasCollection` em `despesas.ts:28`.

| Função | Assinatura | Linha | Descrição |
|--------|------------|-------|-----------|
| `criarDespesa` | `async (despesa: Omit<Despesa,'id'\|'criadoEm'>) => string` | `despesas.ts:30` | Cria despesa normalizando `talhaoId ?? null` e adicionando `criadoEm: Timestamp.now()`. Usado em `DespesaForm.tsx:15`. |
| `atualizarDespesa` | `async (id: string, despesa: Partial<Despesa>) => void` | `despesas.ts:39` | Update parcial. |
| `excluirDespesa` | `async (id: string) => void` | `despesas.ts:44` | Delete por ID. |
| `listarDespesasPorPropriedade` | `async (propriedadeId: string) => Promise<Despesa[]>` | `despesas.ts:49` | Query `where propriedadeId ==` + `orderBy data desc`. Usado em `DespesasLista.tsx:32`. |
| `listarDespesasPorTalhao` | `async (talhaoId: string) => Promise<Despesa[]>` | `despesas.ts:59` | Query `where talhaoId ==` + `orderBy data desc`. (Atualmente sem tela consumindo — pronto para uso futuro). |
| `totalDespesas` | `(despesas: Despesa[]) => number` | `despesas.ts:69` | Função pura: `reduce((soma, d) => soma + d.valor, 0)`. Usado em `DespesasLista.tsx:48` para card “Total gasto”. |

### 3.4 Imagens — `Services/imagens.ts:1`

Persistência local via `expo-file-system` + compressão `expo-image-manipulator`. Diretório: `Paths.document/propriedades` (`imagens.ts:4`).

| Função | Assinatura | Linha | Descrição |
|--------|------------|-------|-----------|
| `arquivoImagem` _(privada)_ | `(propriedadeId: string) => File` | `imagens.ts:6` | Helper interno: retorna `new File(IMAGES_DIR, `${propriedadeId}.jpg`)`. |
| `enviarImagemPropriedade` | `async (uri: string, propriedadeId: string) => Promise<string>` | `imagens.ts:10` | Cria diretório se necessário, redimensiona para `width: 800` com `compress 0.7` JPEG via `ImageManipulator.manipulateAsync`, copia para arquivo local e retorna `destino.uri`. Usado em `PropriedadeForm.tsx:131`. |
| `excluirImagemPropriedade` | `(propriedadeId: string) => void` | `imagens.ts:27` | Deleta arquivo local se `arquivo.exists`. Chamada dentro de `excluirPropriedade`. |
| `getImagemLocalUri` | `(propriedadeId: string) => string` | `imagens.ts:34` | Retorna `arquivoImagem(...).uri` sem I/O. Útil para exibir imagem cacheada. |

---

## 4. Screens — Telas e Funções de UI

### `Screens/Login.tsx:12`
| Função | Linha | Descrição |
|--------|-------|-----------|
| `Login()` | `12` | Componente principal. Estados: `email`, `senha`, `entrando`. |
| `handleLogin()` | `18` | Valida campos → `signInWithEmailAndPassword(auth, email.trim(), senha)` → `navigation.navigate('Home')`. Trata erros `auth/invalid-credential`, `wrong-password`, `user-not-found`, `invalid-email`. |

### `Screens/CriarConta.tsx:11`
| Função | Linha | Descrição |
|--------|-------|-----------|
| `CriarConta()` | `11` | Estados: `email`, `senha`, `confirmacaoSenha`, `salvando`. |
| `handleCriarConta()` | `19` | Valida preenchimento, senhas iguais e `senha.length >=6` → `createUserWithEmailAndPassword(auth, email.trim(), senha)` → `navigation.navigate('Home')`. Trata `email-already-in-use`, `invalid-email`, `weak-password`. |

### `Screens/Home.tsx:11`
Tela hub sem lógica de dados. 4 cards navegáveis: `Propriedades`, `Plantios`, `Despesas`, `Resumo`. (`Home.tsx:20-38`).

### `Screens/Propriedades.tsx:12`
| Função | Linha | Descrição |
|--------|-------|-----------|
| `carregarPropriedades()` | `17` | Obtém `auth.currentUser.uid` → `listarPropriedades(userId)` → `setPropriedades`. |
| `useFocusEffect` | `36` | Recarrega lista sempre que a tela ganha foco. |

### `Screens/PropriedadeForm.tsx:16` (Criar / Editar)
| Função | Linha | Descrição |
|--------|-------|-----------|
| `carregarDados()` | `38` | Se `modoEdicao`, busca com `buscarPropriedade(propriedadeId)` e popula estados. |
| `handleEscolherImagem()` | `57` | Pede permissão `requestMediaLibraryPermissionsAsync` → `launchImageLibraryAsync({ mediaTypes:['images'], allowsEditing:true, aspect:[4,3] })` → `setImagemLocal(uri)`. |
| `handleAbrirMapa()` | `76` | `navigation.navigate('MapaSelecao', { latitude, longitude, onSelect })` — callback atualiza `latitude/longitude/localizacao`. |
| `handleLimparLocalizacao()` | `88` | Limpa `localizacao`, `latitude`, `longitude`. |
| `handleSalvar()` | `94` | Valida `nome/localizacao/areaTotal`, parse `Number(area.replace(',','.'))`, valida `userId`, chama `criarPropriedade` ou `atualizarPropriedade`, se houver `imagemLocal` chama `enviarImagemPropriedade` + `atualizarPropriedade({ imagemUrl })`. |

### `Screens/PropriedadeDetalhe.tsx:13`
| Função | Linha | Descrição |
|--------|-------|-----------|
| `carregarDados()` | `22` | `Promise.all([buscarPropriedade, listarTalhoes])` → atualiza estados. |
| `handleExcluirPropriedade()` | `45` | `Alert` confirmação → `excluirPropriedade(propriedadeId)` → `goBack()`. |
| `handleExcluirTalhao(talhaoId)` | `63` | Confirmação → `excluirTalhao(talhaoId)` → `carregarDados()`. |

### `Screens/TalhaoForm.tsx:12` (Criar / Editar)
| Função | Linha | Descrição |
|--------|-------|-----------|
| `carregarDados()` | `30` | Lista talhões e encontra o alvo por `talhaoId`. Guarda `areaTalhaoEdicao` para cálculo diferencial. |
| `handleSalvar()` | `47` | Valida campos e área numérica → busca `propriedade` + `talhoes` → valida `somaTalhoes - areaTalhaoEdicao + areaNumero <= propriedade.areaTotal` → `criarTalhao` ou `atualizarTalhao`. |

### `Screens/Despesas.tsx:13`
Lista propriedades como seletor para despesas.
| Função | Linha | Descrição |
|--------|-------|-----------|
| `carregarPropriedades()` | `18` | Idem `Propriedades.tsx`: lista por `userId`. |
| Clique no item | `61` | `navigation.navigate('DespesasLista', { propriedadeId })`. |

### `Screens/DespesasLista.tsx:22`
| Função | Linha | Descrição |
|--------|-------|-----------|
| `carregarDespesas()` | `29` | `listarDespesasPorPropriedade(propriedadeId)` → `setDespesas`. |
| `total` | `48` | `totalDespesas(despesas)` — exibe em card verde formatado `toLocaleString('pt-BR', currency:'BRL')`. |
| `LABELS_CATEGORIA` | `15` | Mapa `CategoriaDespesa → string` para exibição. |

### `Screens/DespesaForm.tsx:7`
| Função | Linha | Descrição |
|--------|-------|-----------|
| `DespesaForm({route, navigation})` | `7` | Estados: `categoria` (default `insumo`), `descricao`, `valor`. |
| `handleSalvar()` | `14` | `criarDespesa({ propriedadeId, talhaoId ?? null, categoria, descricao, valor: parseFloat(valor.replace(',','.')), data: Timestamp.now() })` → `goBack()`. Inclui `Picker` com 4 categorias. |

### `Screens/MapaSelecao.tsx:28`
Tela de seleção geográfica com `react-native-maps` + `expo-location` + OpenStreetMap.
| Função | Linha | Descrição |
|--------|-------|-----------|
| `useFocusEffect` permissões | `42` | No Android: `PermissionsAndroid.request(ACCESS_FINE_LOCATION)`; no iOS: `Location.requestForegroundPermissionsAsync()`. |
| `useEffect` params iniciais | `66` | Se `route.params.latitude/longitude` existem, centraliza mapa e chama `buscarEndereco`. |
| `buscarEndereco(lat,lng)` | `83` | Fetch `https://nominatim.openstreetmap.org/reverse?format=json&lat=&lon=&accept-language=pt-BR` → `display_name` ou fallback `lat,lng`. Atualiza `enderecoAtual` e `localizacaoSelecionada.endereco`. |
| `handlePressMap(event)` | `105` | Ao tocar no mapa, seta `localizacaoSelecionada` e busca endereço. |
| `handleConfirmar()` | `111` | Valida seleção → chama `route.params.onSelect({latitude, longitude, endereco})` se existir → `goBack()`. |
| `handleMinhaLocalizacao()` | `128` | Valida permissão → `Location.getCurrentPositionAsync({})` → seta localização, busca endereço e `mapRef.animateToRegion` com delta 0.01. |
| Constantes | `19-26` | `REGIAO_INICIAL` (-28.68, -49.37, Criciúma/SC) e `OSM_TILE_URL`. Usa `UrlTile` para tiles OSM e `Marker` pin `#3B6D11`. |

### `Screens/Plantios.tsx:5` e `Screens/Resumo.tsx:5`
Telas placeholder — apenas exibem título centralizado. Previstas para expansão futura (planejamento de safras e dashboard financeiro).

---

## 5. Navegação — `App.tsx`

`RootStackParamList` (`App.tsx:18`) define 13 rotas tipadas:

| Rota | Params | Inicial |
|------|--------|---------|
| `Login` | `undefined` | ✅ (initialRouteName) |
| `Home` | `undefined` |  |
| `Propriedades` | `undefined` |  |
| `PropriedadeForm` | `{ propriedadeId?: string }` |  |
| `PropriedadeDetalhe` | `{ propriedadeId: string }` |  |
| `TalhaoForm` | `{ propriedadeId: string; talhaoId?: string }` |  |
| `CriarConta` | `undefined` |  |
| `DespesaForm` | `{ propriedadeId: string; talhaoId?: string }` |  |
| `Despesas` | `undefined` |  |
| `DespesasLista` | `{ propriedadeId: string }` |  |
| `MapaSelecao` | `{ latitude?, longitude?, onSelect? }` |  |
| `Plantios` | `undefined` |  |
| `Resumo` | `undefined` |  |

`Stack.Navigator` com `headerShown: false` (`App.tsx:39`). `NavigationContainer` wrapper.

---

## 6. Tabela Resumo de Todas as Funções

| # | Arquivo | Função / Export | Tipo | Descrição Curta |
|---|---------|-----------------|------|-----------------|
| 1 | `FirebaseConfig.ts:17` | `db` | const | Firestore instance |
| 2 | `FirebaseConfig.ts:18` | `auth` | const | Auth instance |
| 3 | `propriedades.ts:16` | `criarPropriedade` | async | Cria propriedade |
| 4 | `propriedades.ts:24` | `listarPropriedades` | async | Lista por userId |
| 5 | `propriedades.ts:30` | `buscarPropriedade` | async | Busca por ID |
| 6 | `propriedades.ts:37` | `atualizarPropriedade` | async | Update parcial |
| 7 | `propriedades.ts:42` | `excluirPropriedade` | async | Delete em cascata + imagem |
| 8 | `talhoes.ts:12` | `criarTalhao` | async | Cria talhão |
| 9 | `talhoes.ts:20` | `listarTalhoes` | async | Lista por propriedadeId |
| 10 | `talhoes.ts:26` | `atualizarTalhao` | async | Update parcial |
| 11 | `talhoes.ts:31` | `excluirTalhao` | async | Deleta talhão |
| 12 | `despesas.ts:30` | `criarDespesa` | async | Cria despesa |
| 13 | `despesas.ts:39` | `atualizarDespesa` | async | Update despesa |
| 14 | `despesas.ts:44` | `excluirDespesa` | async | Deleta despesa |
| 15 | `despesas.ts:49` | `listarDespesasPorPropriedade` | async | Lista por propriedadeId (orderBy data desc) |
| 16 | `despesas.ts:59` | `listarDespesasPorTalhao` | async | Lista por talhaoId (orderBy data desc) |
| 17 | `despesas.ts:69` | `totalDespesas` | sync | Soma valores |
| 18 | `imagens.ts:6` | `arquivoImagem` | sync (privada) | Resolve File path |
| 19 | `imagens.ts:10` | `enviarImagemPropriedade` | async | Redimensiona + salva local |
| 20 | `imagens.ts:27` | `excluirImagemPropriedade` | sync | Deleta arquivo local |
| 21 | `imagens.ts:34` | `getImagemLocalUri` | sync | Retorna uri local |
| 22 | `Login.tsx:18` | `handleLogin` | async | Autentica usuário |
| 23 | `CriarConta.tsx:19` | `handleCriarConta` | async | Cria conta |
| 24 | `Propriedades.tsx:17` | `carregarPropriedades` | async | Carrega lista |
| 25 | `PropriedadeForm.tsx:38` | `carregarDados` | async | Carrega propriedade p/ edição |
| 26 | `PropriedadeForm.tsx:57` | `handleEscolherImagem` | async | Picker galeria |
| 27 | `PropriedadeForm.tsx:76` | `handleAbrirMapa` | sync | Navega p/ MapaSelecao |
| 28 | `PropriedadeForm.tsx:88` | `handleLimparLocalizacao` | sync | Limpa coords |
| 29 | `PropriedadeForm.tsx:94` | `handleSalvar` | async | Cria/atualiza propriedade + imagem |
| 30 | `PropriedadeDetalhe.tsx:22` | `carregarDados` | async | Carrega prop + talhões |
| 31 | `PropriedadeDetalhe.tsx:45` | `handleExcluirPropriedade` | sync | Confirma + exclui |
| 32 | `PropriedadeDetalhe.tsx:63` | `handleExcluirTalhao` | sync | Confirma + exclui |
| 33 | `TalhaoForm.tsx:30` | `carregarDados` | async | Carrega talhão p/ edição |
| 34 | `TalhaoForm.tsx:47` | `handleSalvar` | async | Valida área + cria/atualiza |
| 35 | `Despesas.tsx:18` | `carregarPropriedades` | async | Lista propriedades p/ seleção |
| 36 | `DespesasLista.tsx:29` | `carregarDespesas` | async | Lista despesas + total |
| 37 | `DespesaForm.tsx:14` | `handleSalvar` | async | Cria despesa |
| 38 | `MapaSelecao.tsx:83` | `buscarEndereco` | async | Reverse geocode Nominatim |
| 39 | `MapaSelecao.tsx:105` | `handlePressMap` | sync | Seleciona ponto no mapa |
| 40 | `MapaSelecao.tsx:111` | `handleConfirmar` | sync | Confirma e retorna via onSelect |
| 41 | `MapaSelecao.tsx:128` | `handleMinhaLocalizacao` | async | Usa GPS atual |

**Total: 41 funções/exports mapeados.**

---

## 7. Dependências Externas Relevantes

| Pacote | Uso no Projeto |
|--------|----------------|
| `firebase` `12.17.1` | Auth (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`) + Firestore (`collection`, `addDoc`, `getDocs`, `doc`, `updateDoc`, `deleteDoc`, `query`, `where`, `orderBy`, `writeBatch`, `serverTimestamp`, `Timestamp`) |
| `expo-image-picker` `17.0.11` | Galeria (`requestMediaLibraryPermissionsAsync`, `launchImageLibraryAsync`) |
| `expo-image-manipulator` `14.0.8` | Compressão (`manipulateAsync`) |
| `expo-file-system` `19.0.24` | Armazenamento local (`Paths`, `Directory`, `File`) |
| `expo-location` `19.0.8` | GPS (`requestForegroundPermissionsAsync`, `getCurrentPositionAsync`) |
| `react-native-maps` `1.20.1` | Mapa (`MapView`, `Marker`, `UrlTile`) |
| `@react-navigation/native` + `native-stack` | Navegação tipada |
| `@react-native-picker/picker` | Seletor categoria despesa |
| `react-native-safe-area-context` | SafeArea |

---

## 8. Funcionalidades por Status

| Status | Funcionalidade |
|--------|----------------|
| ✅ Completo | Autenticação (login, criar conta), CRUD Propriedades, CRUD Talhões (com validação de área), CRUD Despesas, Imagem local com compressão, Seleção de localização via mapa + reverse geocode, Listagem com total financeiro |
| 🚧 Placeholder | `Plantios` (`Plantios.tsx:5`) e `Resumo` (`Resumo.tsx:5`) — telas criadas mas sem lógica |
| ⚠️ Faltando | Edição/exclusão de despesas na UI (services existem mas sem botões), testes automatizados, offline persistence |

---

*Para adicionar nova função, crie o arquivo em `Services/` e exporte tipado, depois consuma nas Screens. Mantenha este documento atualizado.*
