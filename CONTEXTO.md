# Contexto do projeto

Documento de trabalho: estado atual, como retomar e limitações conhecidas.
Não faz parte dos requisitos do enunciado.

Última atualização: 31/08/2026

---

## O que é

App de chat 1 para 1 em React Native + Expo + TypeScript, com Firebase Authentication
(e-mail/senha, Google, Apple) e Firebase **Realtime Database**. Firestore é proibido pelo
enunciado e não é usado em lugar nenhum.

- **Repositório:** https://github.com/RafaelGbm/Firebase-Chat (branch `main`)
- **Pasta local:** `C:\dev\Firebase-Chat`
- **Projeto Firebase:** `cp-mobile-chat`

---

## Como retomar em outra máquina

```bash
git clone https://github.com/RafaelGbm/Firebase-Chat.git
cd Firebase-Chat
npm install
cp .env.example .env    # preencher, ver secao abaixo
npm start               # Expo Go
npm run web             # navegador, em http://localhost:8081
```

### O `.env` não está no repositório

Ele é ignorado pelo git de propósito. Os valores saem do Console:

| Variável | Onde encontrar |
| --- | --- |
| `EXPO_PUBLIC_FIREBASE_*` (7 chaves) | Firebase Console → Configurações do projeto → Seus apps → App Web |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Cloud Console → Credenciais → OAuth client tipo Web |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google Cloud Console → Credenciais → OAuth client tipo Android |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | ainda não criado — ver Pendências |

O arquivo [`.env.example`](.env.example) traz o formato de cada uma.

---

## Estado por item da avaliação

| Item | Pontos | Estado |
| --- | :---: | --- |
| Authentication — E-mail/Senha | 1,0 | funcionando, demonstrado em Android e web |
| Authentication — Google | 1,0 | funcionando na web; no Android exige dev build |
| Authentication — Apple | 1,0 | código completo, provedor habilitado no Firebase, sem teste em device |
| Regra entre provedores | 1,0 | implementada em 3 camadas, demonstrada |
| Chat 1 para 1 | 1,0 | implementado |
| Realtime Database e tempo real | 2,0 | demonstrado com duas contas, print incluído |
| TypeScript, hooks e ausência de `any` | 1,0 | `tsc --noEmit` limpo, zero `any` |
| Organização, services e componentização | 1,0 | 4 services, 9 componentes |
| UI, loading e tratamento de erros | 1,0 | completo |
| README com nome e RM | — | 5 integrantes preenchidos (sem isso a nota zera) |

---

## Limitações conhecidas

### 1. Google no Android não funciona no Expo Go

Testado e confirmado. O `expo-auth-session` gera o redirect `exp://127.0.0.1:8081`, e o Google
recusa esse esquema já na requisição de autorização:

```
Access blocked: Authorization Error
Error 400: invalid_request
Request details: redirect_uri=exp://127.0.0.1:8081
```

Um OAuth client do tipo Android só aceita `com.fiap.cpmobile.chat:/oauthredirect`, esquema que o
Expo Go não pode usar por não ser esse app. **Para demonstrar o Google, use a versão web.**

### 2. O development build local não compila

`expo prebuild` passa e gera `android/`, mas o Gradle falha no link C++:

```
ld.lld: error: undefined symbol: __cxa_throw
ld.lld: error: undefined symbol: typeinfo for std::out_of_range
```

A runtime C++ não entra na linha de link. O NDK está em
`C:\Users\Meu Computador\AppData\Local\Android\Sdk\ndk\27.1.12297006` — caminho **com espaço** —
e o build já cai no fallback de nomes 8.3 (`CLANG_~1`). Duas saídas não testadas:

1. `ANDROID_USE_LEGACY_TOOLCHAIN_FILE=false` nos argumentos do CMake (1 linha, rebuild ~5 min)
2. Copiar o NDK para `C:\Android\ndk\27.1.12297006` (2,3 GB) e apontar `android.ndkPath`

Alternativa que evita o problema por completo: **EAS Build** (`eas build -p android --profile
development`), que compila em servidor Linux.

Para compilar localmente é obrigatório apontar o JDK 21, porque o `java` do PATH é o 8:

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

### 3. Apple não é testável no Windows

O código está completo e o provedor está habilitado no Firebase. Falta apenas a capability
**Sign in with Apple** no App ID, que depende de conta paga do Apple Developer Program, e um
device iOS para o teste de ponta a ponta. Ver a seção 5.6 do README.

---

## Ambiente da máquina de casa

- Expo SDK **57** (`expo ~57.0.18`), React Native 0.86.3
- Android SDK em `%LOCALAPPDATA%\Android\Sdk` — o `adb` **não** está no PATH
- JDK 21 em `C:\Program Files\Android\Android Studio\jbr`
- Emulador `Pixel_9_Pro` (Android 15) com Expo Go instalado
- Keystore de debug em `~/.android/debug.keystore`, SHA-1 já registrada no Firebase.
  **Se ela for apagada, a SHA-1 muda e o Google no Android para de funcionar.**

---

## Configuração já feita no Firebase (não refazer)

- Authentication: E-mail/senha, Google e Apple habilitados
- Realtime Database criado, regras de [`database.rules.json`](database.rules.json) publicadas
- Apps Web e Android (`com.fiap.cpmobile.chat`) registrados
- Domínios autorizados: `localhost`, `cp-mobile-chat.firebaseapp.com`, `cp-mobile-chat.web.app`
- Apple: provedor ligado com Services ID e OAuth code flow **em branco**, que é o correto para o
  fluxo nativo iOS

---

## Decisões que não são óbvias no código

**Google tem dois fluxos.** Web usa `signInWithPopup` do Firebase, validado pelos domínios
autorizados. Android/iOS usam `expo-auth-session` + `signInWithCredential`. O `signInWithPopup`
não existe no bundle React Native do `@firebase/auth`; o import estático é seguro porque só é
chamado quando `Platform.OS === 'web'`.

**`getReactNativePersistence`** existe em runtime no `firebase/auth` para RN, mas o SDK v12 só
publica as tipagens do bundle browser. Declarado em `src/types/firebase-auth.d.ts` para evitar
`any`.

**`conversationId` determinístico:** os dois `uid` ordenados e unidos por `_`. Permite às regras
validar o vínculo entre id e participantes sem consulta extra.

**Regra entre provedores:** exatamente um lado precisa ser `password`
(`(a === 'password') !== (b === 'password')`). Aplicada na query, na UI e nas regras.

**Confirmação de e-mail é extra**, não está no enunciado. Vale só para contas `password`. O perfil
só vai para o Realtime Database depois de confirmado, então conta não verificada não aparece nos
contatos.

---

## Verificações já executadas

- `tsc --noEmit` limpo; zero `any`, `@ts-ignore`, `@ts-expect-error`
- Bundle Metro compila em Android e web (1046 módulos)
- Regras do Realtime Database: 24 casos, 9 operações permitidas e 15 violações bloqueadas
- Chat em tempo real demonstrado entre conta `password` (Android) e `google` (web)
- Revisão item a item contra o enunciado, sem erro de implementação encontrado

---

## Pendências

1. **`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` está vazio.** Sem ele o botão do Google fica desabilitado
   no iOS. Criar um OAuth client tipo iOS com o bundle `com.fiap.cpmobile.chat`.

2. **As regras não validam o provedor real.** `users/{uid}/provider` é escrito pelo cliente e as
   regras não checam se bate com o login de verdade — um usuário `password` consegue gravar
   `provider: "google"` e driblar a regra do trabalho. O ID token traz
   `auth.token.firebase.sign_in_provider` com `"password"` / `"google.com"` / `"apple.com"`, então
   dá para exigir a correspondência no `.validate` do campo `provider`.

   Foi adiado de propósito: só o ramo `password` é testável hoje. Se houver erro nos ramos
   `google`/`apple`, `saveUserProfile` falha em silêncio e ninguém aparece nos contatos. Aplicar
   só depois do Google confirmado ponta a ponta, republicar as regras e reexecutar a bateria.

3. **Apple ponta a ponta**, quando houver device iOS e conta Apple Developer.
