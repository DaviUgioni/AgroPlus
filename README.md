# AgroPlus

App mobile para o produtor rural gerenciar **propriedades, talhões e despesas** com foto, GPS e controle financeiro — o caderno da fazenda no celular.

## Objetivo Geral

Centralizar em um só app o cadastro de áreas e o controle de gastos por propriedade/talhão, com dados na nuvem vinculados ao usuário.

## O que já funciona

### Autenticação
- Cadastro com e-mail e senha (validação ao digitar, borda vermelha, barra de força fraca/média/forte)
- Login com e-mail/senha, botão mostrar/esconder senha e teclado que não cobre o campo
- Recuperação de senha por e-mail
- Login com impressão digital (biometria) quando disponível
- Sessão persistente: continua logado ao fechar o app (Firebase Auth + AsyncStorage)

### Propriedades e Talhões
- CRUD de propriedades: nome, localização (texto ou GPS), área total, foto
- Foto comprimida (800px, 70%) e salva localmente; exclusão limpa o arquivo
- CRUD de talhões vinculados à propriedade
- Validação: soma dos talhões não pode ultrapassar a área total
- Exclusão em cascata: ao excluir propriedade apaga talhões e despesas vinculadas

### Despesas
- Cadastro por categoria: insumo, mão de obra, maquinário, outros
- Campos: descrição, valor (R$), data automática
- Listagem por propriedade ordenada por data, total gasto (R$) e edição/exclusão na lista

### Mapa
- Seleção de localização tocando no mapa (OpenStreetMap)
- Botão "Usar minha localização" com GPS
- Conversão de coordenada para endereço (Nominatim) e retorno para o formulário

### Outras telas
- Home com atalhos e botão Sair (dentro da safe area)
- Plantios e Resumo são placeholders para próximas versões

## Como funciona o fluxo

1. **Conta** → cria conta ou entra; fica logado.
2. **Propriedade** → cadastra fazenda com foto e marca no mapa.
3. **Talhoes** → divide a fazenda em talhões (app avisa se passar da área).
4. **Despesas** → lança gastos e vê o total por propriedade.

## Stack

- **App:** React Native 0.86 + Expo SDK 57 + TypeScript 6 + React Navigation 7
- **Backend:** Firebase Auth e Firestore (rules e índices em `firestore.rules` / `firestore.indexes.json`)
- **Mapas/Mídia:** react-native-maps, expo-location, expo-image-picker/manipulator, expo-file-system, expo-local-authentication

## Estrutura

```
App.tsx                 # 13 rotas tipadas
FirebaseConfig.example.ts  # modelo de config do Auth/Firestore (copie para FirebaseConfig.ts)
Services/
  propriedades.ts       # CRUD propriedades
  talhoes.ts            # CRUD talhões
  despesas.ts           # CRUD despesas + total
  imagens.ts            # compressão e arquivo local
Screens/
  Login, CriarConta, Home, Propriedades, PropriedadeForm, PropriedadeDetalhe
  TalhaoForm, Despesas, DespesasLista, DespesaForm, MapaSelecao, Plantios, Resumo
```

## Rodar localmente

```bash
npm install
npx expo start          # Expo Go
npx expo run:android    # build nativo
npx expo-doctor         # checar SDK 57
```

Copie `FirebaseConfig.example.ts` para `FirebaseConfig.ts` e preencha com as credenciais do seu próprio projeto Firebase (o arquivo `FirebaseConfig.ts` não é versionado). Para Firestore, publique as regras/índices:

```bash
firebase deploy --only firestore
```

## Roadmap curto

- Filtros e totais por mês/categoria, exportar PDF
- Plantios (cultura, datas) e Resumo com gráficos
- Fotos na nuvem (Storage) e mapa offline

## Autor

Davi Ugioni Marcolino — Projeto Integrador, Curso de Informática

## Licença

Distribuído sob a licença MIT — veja [LICENSE](LICENSE).
