# Deploy na Railway — ZimmerOS AI

Guia para publicar o ZimmerOS AI (site público + painel interno) na [Railway](https://railway.app).

## Visão geral

- **Build:** Nixpacks (Node 22) → `npm ci` → `npm run build`
- **Start:** `npx prisma db push && npm run start` (cria/atualiza o schema e sobe o Next na porta `$PORT`)
- **Healthcheck:** `GET /api/health`
- Configurado em `railway.json` e `nixpacks.toml`.

## Passo a passo

### 1. Criar o projeto
1. Railway → **New Project → Deploy from GitHub repo** → selecione `andershow88/IrmaosZimmer`.
2. Railway detecta o Nixpacks e usa `railway.json` automaticamente.

### 2. Adicionar o banco
3. No projeto → **New → Database → PostgreSQL**.

### 3. Variáveis de ambiente (no serviço da app → Variables)
| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referência ao plugin) |
| `JWT_SECRET` | string aleatória forte (ex.: `openssl rand -base64 32`) |
| `TZ` | `America/Sao_Paulo` |
| `NODE_ENV` | `production` |
| `OPENAI_API_KEY` | *(opcional)* sua chave — sem ela a IA roda em modo mock |
| `OPENAI_MODEL` | *(opcional)* nome real do modelo (o padrão `gpt-5.4-mini` é placeholder) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | *(opcional)* envio de e-mail; sem `SMTP_HOST` roda em modo mock/log |

> `PORT` é injetada automaticamente pela Railway — não precisa definir.

### 4. Deploy
4. A Railway faz o build e o start. O `prisma db push` cria todas as tabelas no primeiro boot.
5. Gere um domínio: serviço → **Settings → Networking → Generate Domain**.

### 5. Popular dados de demonstração (uma única vez)
O seed é **destrutivo** (recria os dados) — rode **só uma vez** logo após o primeiro deploy, e **nunca** em produção com dados reais:

```bash
# via Railway CLI, com o projeto linkado:
railway run npm run db:seed
```

Login de demonstração após o seed: `admin@zimmer.com` / `zimmer123` (e atendente@/mecanico@/financeiro@/estoque@, todos `zimmer123`). **Troque as senhas em produção.**

## Rotas

- **Site público (sem login):** `/`, `/sobre`, `/servicos`, `/acessorios`, `/contato`, `/agendar`
- **Administração (login):** `/painel` e `/painel/*` (protegido pelo `proxy.ts`)
- **Agendamento online:** `POST /api/agendar` (público) → cria Cliente + Agendamento que aparece em `/painel/agenda`.

## Pontos de atenção (produção)

- **Uploads (anexos/fotos)** são gravados em `public/uploads`, que é **efêmero** na Railway (some a cada redeploy). Para persistir:
  - anexe um **Volume** da Railway montado em `/app/public/uploads`, **ou**
  - migre o `src/lib/upload.ts` para object storage (S3/R2) — recomendado a médio prazo.
- **Schema:** o deploy usa `prisma db push` (sincronização). Para um fluxo com histórico/rollback, migre para `prisma migrate` (gerar migrations e trocar o start para `prisma migrate deploy`).
- **Secrets:** nunca commitar `.env` (já está no `.gitignore`). Defina tudo nas Variables da Railway.
- **Integrações externas ainda não ativas** (precisam de credenciais/serviços): NF-e/NFS-e, WhatsApp Business API, Pix/Boleto. As camadas existem com fallback/mock.

## Deploy alternativo (Docker/Nixpacks em outro host)

`next.config.ts` usa `next start`. Para imagem Docker mínima, reative `output: "standalone"` e copie `.next/static` + `public` para `.next/standalone`, então rode `node .next/standalone/server.js`.
