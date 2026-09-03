# AgroPlus — Como Configurar do Zero

> Sem nenhuma chave real. Só o que você precisa criar para rodar o trabalho.

## 1. O que você precisa ter

- Node 20+ e npm
- Conta no Firebase (console.firebase.google.com)
- Expo CLI (`npm install -g expo-cli` ou `npx expo`)

## 2. Arquivos que você deve criar (não estão no repo)

O `.gitignore` ignora sensíveis de propósito. Copie os exemplos e preencha:

| Arquivo | Como criar | O que preencher |
|---|---|---|
| `FirebaseConfig.ts` | `cp FirebaseConfig.example.ts FirebaseConfig.ts` | 6 campos do Firebase Console → Project Settings → General → Your apps (Web) → SDK setup |

Conteúdo esperado de `FirebaseConfig.ts`:
```ts
const firebaseConfig = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'SEU_PROJECT.firebaseapp.com',
  projectId: 'SEU_PROJECT_ID',
  storageBucket: 'SEU_PROJECT.appspot.com',
  messagingSenderId: 'SEU_SENDER_ID',
  appId: 'SEU_APP_ID',
};
```

**Não precisa** de `google-services.json` / `GoogleService-Info.plist` para rodar com mapa nativo (Google/Apple padrão). Só se for build com `PROVIDER_GOOGLE` explícito.

## 3. Passo a passo Firebase (5 min)

1. Crie um projeto em console.firebase.google.com
2. Ative **Authentication** → Sign-in method → Email/Password → Enable
3. Ative **Firestore Database** → Create database → Start in test mode (depois troque para regras do repo)
4. Em Project Settings → General → Your apps → Add app (Web) → copie o `firebaseConfig` → cole em `FirebaseConfig.ts`
5. Instale Firebase CLI e publique regras/índices do repo:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore
   ```
   Isso sobe `firestore.rules` e `firestore.indexes.json` (índices para despesas por talhão/propriedade).

## 4. Rodar local

```bash
npm install
cp FirebaseConfig.example.ts FirebaseConfig.ts
# edite FirebaseConfig.ts com suas chaves
npx expo start --clear        # Expo Go
# ou
npx expo run:android          # build nativo (gera android/ via prebuild)
```

Troque `app.json` → `expo.android.package` de `com.anonymous.AgroPlus` para seu `com.seunome.agroplus` antes de gerar `google-services.json`, se for usar.

## 5. Problemas comuns

- `FirebaseError: The query requires an index` → clique no link do erro ou `firebase deploy --only firestore:indexes`
- `auth/invalid-api-key` → `FirebaseConfig.ts` ainda com `SUA_API_KEY` — preencha
- `expo-location` sem permissão → `app.json` já tem `expo-location` plugin e `android.permissions`; faça `npx expo prebuild --clean` se mudou `app.json`
- Mapa branco → use mapa nativo (já está sem `UrlTile` OSM); não precisa de Google Maps API key para dev

## 6. Segurança

Nenhuma chave real está no repo. O histórico antigo ainda tem chaves até o commit `68fcf12` — **gire as chaves** no Firebase Console antes de deixar público. O `.gitignore` garante que novos commits não levem `FirebaseConfig.ts` ou `google-services.json`.
