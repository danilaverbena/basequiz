# BaseQuiz Web

Mini App для Base App: викторина по экосистеме Base со смарт-контрактом, EAS-аттестациями уровней и глобальным лидербордом.

## Стек

- **Next.js 14** (App Router, TypeScript)
- **wagmi v2** + **viem v2** + Base Account smart wallet connector
- **Tailwind CSS** (warm light theme)
- **EIP-712 signing** на backend (Vercel/Node runtime)

## Контракт

| Что | Адрес |
|---|---|
| BaseQuiz | [0xF5B18df0D324C065Dc0759781a3533D6964daD1f](https://basescan.org/address/0xF5B18df0D324C065Dc0759781a3533D6964daD1f#code) |
| EAS | 0x4200000000000000000000000000000000000021 |
| Level Schema UID | 0xacce678f28e25c16f4cf761ab517e34cdcd453a46440f068472b4786b70e70c1 |

## Архитектура анти-чита

Backend подписывает `AnswerVerdict` с EIP-712 (private key хранится только на сервере, должен совпадать с `trustedSigner` в контракте).

Flow:
1. Клиент: `GET /api/question?address=…` → сервер фильтрует через `contract.solved/lockoutUntil` многоколом и возвращает рандомный доступный вопрос (правильный ответ НЕ светится).
2. Клиент: `POST /api/sign { address, questionId, letter }` → сервер перепроверяет on-chain состояние, проверяет ответ, подписывает verdict с TTL 5 минут.
3. Клиент: вызывает `contract.submitAnswer(...)` с verdict → контракт верифицирует EIP-712 подпись → обновляет state + (на 5-м стрике) делает EAS attestation.

Сервер — единая точка проверки правильности. Из чата (eth_call) нельзя угадать ответ, потому что verdict содержит `correct: true/false` напрямую (а не хеш для перебора).

## Локальный запуск

```bash
npm install
cp .env.example .env
# Заполни SIGNER_PRIVATE_KEY — это ДОЛЖЕН быть приватный ключ адреса trustedSigner на контракте
npm run dev
# http://localhost:3000
```

## Production deploy (Vercel)

Через Vercel dashboard или CLI:

```bash
vercel --prod
```

В Vercel project settings → Environment Variables добавь:

| Key | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_QUIZ_CONTRACT`   | `0xF5B18df0D324C065Dc0759781a3533D6964daD1f` | All |
| `NEXT_PUBLIC_EAS_CONTRACT`    | `0x4200000000000000000000000000000000000021` | All |
| `NEXT_PUBLIC_LEVEL_SCHEMA_UID`| `0xacce678f...70e70c1`                       | All |
| `NEXT_PUBLIC_CHAIN_ID`        | `8453`                                       | All |
| `SIGNER_PRIVATE_KEY`          | приватный ключ trustedSigner (БЕЗ кавычек)  | Production |
| `BASE_RPC_URL`                | `https://mainnet.base.org`                   | All |

## Структура

```
web/
├── app/
│   ├── page.tsx            # Home
│   ├── quiz/page.tsx       # Quiz (sign + submit flow)
│   ├── profile/page.tsx    # Profile (stats + 20 ачивок + EAS)
│   ├── ranks/page.tsx      # Leaderboard (Global / Weekly / Friends)
│   ├── providers.tsx       # Wagmi + ReactQuery providers
│   ├── layout.tsx          # Root layout + Nav
│   ├── globals.css         # Theme (cream/peach/sky/mint)
│   └── api/
│       ├── question/route.ts
│       ├── sign/route.ts
│       ├── profile/[address]/route.ts
│       └── leaderboard/route.ts
├── components/
│   ├── Nav.tsx
│   ├── Logo.tsx
│   ├── BadgeImg.tsx
│   ├── StatCard.tsx
│   ├── StreakDots.tsx
│   └── WalletPill.tsx
├── lib/
│   ├── contract.ts         # ABI + addresses + EIP-712 domain/types
│   ├── wagmi.ts            # client config
│   ├── badges.ts           # level → image map (20 уровней)
│   ├── questions.ts        # server-side question pool (correct field — секретный)
│   ├── sign.ts             # EIP-712 signing
│   ├── server-rpc.ts       # viem PublicClient для server-side reads
│   └── useUserState.ts     # React hook читающий contract.users
├── data/
│   └── questions.json      # 100 вопросов по 8 темам
└── public/
    └── badges/             # lvl1.png … lvl20.png
```

## Известные ограничения MVP

- **Server-side state не сохраняется в KV.** Если юзер запросит verdict для одного и того же вопроса с разными буквами не отправляя на чейн, сервер выдаст несколько verdict (с разными nonce). Чтобы это закрыть, добавить Vercel KV / Upstash и трекать выданные verdict.
- **Leaderboard через `eth_getLogs`** — для масштабирования > 10k юзеров нужен subgraph или периодический индексер в KV.
- **Owner & trustedSigner — одна EOA** (та что задеплоила). В прод рекомендуется разделить через `setTrustedSigner()` и перевести ownership на Safe-мультисиг через `transferOwnership()`.
