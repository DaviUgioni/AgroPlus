# AgroPlus

App mobile para o produtor rural gerenciar **propriedades, talhões, despesas e plantios** com foto, GPS e controle financeiro — o caderno da fazenda no celular.

## Objetivo Geral

Centralizar em um só app o cadastro de áreas, o controle de gastos por propriedade/talhão e o acompanhamento de plantios e colheitas, com dados na nuvem vinculados ao usuário.

## O que já funciona

### Autenticação
- Cadastro com e-mail e senha (validação ao digitar, borda vermelha, barra de força fraca/média/forte)
- Login com e-mail/senha, botão mostrar/esconder senha e teclado que não cobre o campo
- Recuperação de senha por e-mail
- Biometria (impressão digital) para reabrir uma sessão já salva, quando o aparelho suporta
- Sessão persistente: continua logado ao fechar o app (Firebase Auth + AsyncStorage)

### Propriedades e Talhões
- CRUD de propriedades: nome, localização (texto ou GPS), área total, foto
- Foto comprimida e salva localmente no aparelho; exclusão limpa o arquivo
- CRUD de talhões vinculados à propriedade
- Validação: soma dos talhões não pode ultrapassar a área total
- Exclusão em cascata: ao excluir propriedade apaga talhões e despesas vinculadas

### Despesas
- Cadastro por categoria: insumo, mão de obra, maquinário, outros
- Campos: descrição, valor (R$), data, talhão (opcional), nota fiscal (foto) e recorrência
- Listagem por propriedade ou por talhão, ordenada por data, com total gasto
- Limite mensal por propriedade
- Exportação das despesas em CSV (compartilhar pelo aparelho)

### Plantios
- Cadastro de plantio por propriedade/talhão com cultura (milho, soja, feijão, café, etc.) e data
- Estimativa automática de colheita ("Colheita em X dias" / "Pronto para colher")

### Resumo
- Painel com total de propriedades, área, gasto do mês e do ano, plantios ativos e próxima colheita
- Telas de detalhe para despesas e colheitas

### Mapa
- Seleção de localização tocando no mapa
- Botão "Usar minha localização" com GPS
- Conversão de coordenada para endereço (geocoding reverso do `expo-location`)

## Como funciona o fluxo

1. **Conta** → cria conta ou entra; fica logado.
2. **Propriedade** → cadastra fazenda com foto e marca no mapa.
3. **Talhões** → divide a fazenda em talhões (app avisa se passar da área).
4. **Despesas** → lança gastos e vê o total por propriedade ou talhão.
5. **Plantios** → registra o que foi plantado e acompanha a colheita.
6. **Resumo** → visão geral de tudo.

## Stack

- **App:** React Native 0.86 + Expo SDK 57 + TypeScript 6 + React Navigation 7
- **Backend:** Firebase Auth e Firestore (regras e índices em `firestore.rules` / `firestore.indexes.json`)
- **Mapas/Mídia:** react-native-maps, expo-location, expo-image-picker/manipulator, expo-file-system, expo-sharing, expo-local-authentication

## Estrutura

```
App.tsx                    # 17 telas na navegação (stack tipada)
FirebaseConfig.example.ts  # modelo de config do Auth/Firestore (copie para FirebaseConfig.ts)
firestore.rules            # regras de segurança do Firestore
firestore.indexes.json     # índices compostos
Components/                # componentes reutilizáveis
constants/                 # tema e catálogo de culturas
Services/                  # acesso ao Firestore e arquivos locais
  propriedades.ts  talhoes.ts  despesas.ts  plantios.ts  imagens.ts  erros.ts
Screens/                   # telas (Login, Home, Propriedades, Despesas, Plantios, Resumo, ...)
```

## Rodar localmente

```bash
npm install
cp FirebaseConfig.example.ts FirebaseConfig.ts   # depois preencha com o seu projeto Firebase
npx expo start          # Expo Go
npx expo run:android    # build nativo
npx expo-doctor         # checar SDK 57
```

### Configurar o Firebase (seu próprio projeto)

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. Ative **Authentication → Email/Password** e crie o banco **Firestore**.
3. Em *Project Settings → Your apps → Web*, copie o `firebaseConfig` para `FirebaseConfig.ts`.
4. Publique as regras e os índices deste repositório:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore
```

O arquivo `FirebaseConfig.ts` está no `.gitignore` e **não deve ser commitado**.

## Segurança

- Cada usuário só lê e altera os próprios dados: `propriedades` pertencem ao `userId` do dono, e `talhoes`, `despesas` e `plantios` são liberados só para o dono da propriedade pai (veja `firestore.rules`).
- A chave web do Firebase identifica o projeto, não é uma senha. Mesmo assim, no seu projeto, restrinja a API key no Google Cloud Console e considere ativar o App Check.
- Fotos de propriedade e notas fiscais ficam apenas no aparelho, não vão para a nuvem.

## Roadmap curto

- Filtros e totais por mês/categoria, exportar PDF
- Gráficos no Resumo
- Fotos na nuvem (Storage) e mapa offline

## Autor

Davi Ugioni Marcolino — Projeto Integrador, Curso de Informática

## Licença

Projeto proprietário. Todos os direitos reservados — veja [LICENSE](LICENSE).
