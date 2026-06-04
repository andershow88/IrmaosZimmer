# ZimmerOS AI — Gestão Inteligente para Oficina Mecânica

Sistema de gestão completo (ERP enxuto) para a oficina **Irmãos Zimmer**, com
módulos integrados e recursos de **Inteligência Artificial** para acelerar o
atendimento, a comunicação com o cliente e a tomada de decisão.

Construído como aplicação web full-stack em **Next.js 16 (App Router)** com
Server Actions, Prisma/PostgreSQL e autenticação JWT própria. Interface 100% em
**português do Brasil**, responsiva e com tema claro/escuro.

---

## Site público

O sistema tem duas faces na mesma aplicação:

- **Site público** (sem login) — a vitrine da oficina, aberta a qualquer visitante.
- **Administração interna** (com login) — toda a gestão agora vive sob **`/painel`**
  e exige sessão. Sem cookie de sessão válido, qualquer acesso a `/painel*` é
  redirecionado para `/entrar`.

### Rotas públicas

| Rota          | Conteúdo                                                              |
| ------------- | -------------------------------------------------------------------- |
| `/`           | Página inicial / vitrine da oficina.                                 |
| `/sobre`      | Sobre a Irmãos Zimmer (história, equipe, diferenciais).              |
| `/servicos`   | Catálogo de serviços oferecidos.                                     |
| `/acessorios` | Acessórios disponíveis.                                              |
| `/contato`    | Dados de contato, endereço e canais de atendimento.                 |
| `/agendar`    | Formulário de **agendamento online** (sem login).                   |

> O controle de acesso fica em `src/proxy.ts` (Proxy/Middleware do Next 16):
> libera `/`, `/sobre`, `/servicos`, `/acessorios`, `/contato`, `/agendar`,
> `/entrar`, assets e as APIs públicas (`/api/auth`, `/api/health`,
> `/api/agendar`); protege `/painel*` e as demais rotas `/api/*`.

### Fluxo de agendamento online → Agenda interna

1. O visitante preenche o formulário em **`/agendar`** (nome, telefone/WhatsApp,
   veículo, serviço desejado, data/hora e consentimento LGPD).
2. O formulário envia um `POST` para a API pública **`/api/agendar`**, que valida
   os dados (Zod), aplica rate-limit por IP e tem honeypot anti-spam.
3. A API localiza ou cria o **cliente** (e o **veículo**, se informado) e grava um
   **`Appointment` com status `AGENDADO`**.
4. O agendamento aparece automaticamente na **Agenda interna** (`/painel/agenda`),
   onde a equipe confirma, atende ou cancela.

---

## Tech Stack

| Camada              | Tecnologia                                              |
| ------------------- | ------------------------------------------------------- |
| Framework           | Next.js 16 (App Router, Turbopack, Server Actions)      |
| Linguagem           | TypeScript 5                                            |
| UI                  | React 19, Tailwind CSS 4, componentes próprios (`ui/`)  |
| Ícones / Gráficos   | lucide-react, Recharts 3                                |
| Banco de dados      | PostgreSQL + Prisma 6 (ORM)                             |
| Autenticação        | JWT (jose) em cookie httpOnly, hash bcryptjs            |
| Validação           | Zod                                                     |
| IA                  | OpenAI SDK (com *fallback* mock quando sem chave)       |
| Datas / Máscaras    | date-fns (locale pt-BR), máscaras BR próprias           |
| Testes / Lint       | Vitest, ESLint 9 (flat config) + typescript-eslint      |
| Deploy              | Output `standalone`, Nixpacks (Railway), Docker (Postgres local) |

---

## Funcionalidades (Módulos)

- **Dashboard** — KPIs do dia, faturamento mensal (gráfico), alertas de estoque
  baixo e próximas entregas.
- **Clientes** — CRUD com PF/PJ, máscaras de CPF/CNPJ/telefone/CEP, validação de
  documento, consentimento LGPD e histórico.
- **Veículos** — vinculados ao cliente, placa (antiga e Mercosul), combustível,
  KM, chassi/renavam.
- **Ordens de Serviço (OS)** — abertura, diagnóstico, itens (serviços + peças),
  mecânico responsável, status, prioridade, totais e observações.
- **Orçamentos** — itens, validade, status (rascunho → enviado → aprovado/rejeitado),
  versão para impressão e envio por WhatsApp.
- **Serviços** — catálogo por categoria, preço padrão, tempo estimado, ativo/inativo,
  filtros e busca.
- **Estoque / Peças** — controle de quantidade, estoque mínimo, custo/venda,
  localização, compatibilidade e **movimentações** (entrada/saída/ajuste).
- **Fornecedores** — cadastro, contato, peças vinculadas.
- **Agenda** — agendamentos com data/hora, duração, mecânico, status e ações de
  confirmação por WhatsApp.
- **Checklists / Inspeções** — itens com status (OK/Atenção/Crítico) e resumo
  gerado por IA.
- **Pagamentos** — registro por OS, formas de pagamento, status derivado
  automaticamente (pendente/parcial/pago) e recibo para impressão.
- **Financeiro** — contas a pagar, contas a receber, caixa (abertura/movimentos/
  fechamento com saldo calculado) e fluxo de caixa consolidado. Acesso restrito
  a **Administrador** e **Financeiro**.
- **Garantias** — garantias vinculadas a OS/peças com alertas de vencimento.
- **Anexos** — upload real de imagens (JPG/PNG/WEBP/GIF) e PDF (até 10 MB) em
  OS e veículos, gravados em `public/uploads`.
- **Relatórios** — receita mensal, status de OS, ranking de serviços,
  produtividade, orçamentos, **margem** e **comissão**, com seletor de período e
  **exportação (CSV)**.
- **Consultas externas (lookups)** — preenchimento automático nos formulários via
  APIs públicas brasileiras: **CEP** (ViaCEP), **CNPJ** e **FIPE** (BrasilAPI).
  Tolerantes a falha (sem chave; retornam vazio em erro/timeout).
- **Assistente IA** — chat com contexto da oficina + ações rápidas.
- **Configurações** — dados da oficina, gestão de usuários, papéis/permissões,
  reset de senha (somente administrador) e **auditoria** (log de ações
  sensíveis, acessível em Configurações › Oficina).

---

## AI Features

A camada de IA (`src/lib/ai`) usa a OpenAI quando há `OPENAI_API_KEY`; **sem a
chave, cada recurso responde com um *mock* coerente** gerado a partir dos dados
reais — o app funciona 100% offline para demonstração. Toda interação é
registrada (best-effort) em `AiInteraction`.

1. **Resumo de Ordem de Serviço** — resumo objetivo para a equipe.
2. **Mensagem ao cliente (WhatsApp)** — texto cordial pronto para envio.
3. **Recomendação de manutenção** — sugestões preventivas a partir da KM/histórico.
4. **Resumo de inspeção/checklist** — prioriza itens críticos para o cliente.
5. **Explicação de orçamento** — traduz o orçamento item a item em linguagem simples.
6. **Explicação técnica → linguagem do cliente** + **Assistente / busca nos dados**.

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste:

| Variável         | Obrigatória | Descrição                                                        |
| ---------------- | ----------- | ---------------------------------------------------------------- |
| `DATABASE_URL`   | sim         | String de conexão PostgreSQL (local, Railway, Supabase, Neon).   |
| `JWT_SECRET`     | sim         | Segredo forte para assinar o cookie de sessão (troque em prod).  |
| `OPENAI_API_KEY` | não         | Chave da OpenAI. Vazia ⇒ IA em modo *mock*.                      |
| `OPENAI_MODEL`   | não         | Modelo de IA (padrão `gpt-5.4-mini`).                            |
| `SMTP_HOST`      | não         | Host SMTP. **Vazio ⇒ e-mail em modo *mock* (apenas log).**       |
| `SMTP_PORT`      | não         | Porta SMTP (padrão `587`; `465` usa TLS implícito).             |
| `SMTP_USER`      | não         | Usuário SMTP (autenticação).                                    |
| `SMTP_PASS`      | não         | Senha SMTP (autenticação).                                      |
| `SMTP_FROM`      | não         | Remetente padrão dos e-mails.                                  |
| `NODE_ENV`       | não         | `development` / `production`.                                   |

> Nunca faça commit do `.env` (já está no `.gitignore`). Os arquivos enviados
> ficam em `public/uploads`, que também está ignorado pelo Git.

---

## Como rodar localmente

Pré-requisitos: **Node 22.x**, **npm ≥ 10** e **Docker** (ou um PostgreSQL local).

```bash
# 1. Instalar dependências (roda prisma generate via postinstall)
npm install

# 2. Subir o PostgreSQL local (Docker)
docker compose up -d
#    Alternativa: use seu próprio Postgres e ajuste DATABASE_URL.

# 3. Configurar o ambiente
cp .env.example .env
#    edite DATABASE_URL e JWT_SECRET (OPENAI_API_KEY é opcional)

# 4. Criar o schema no banco
npm run db:push

# 5. Popular com dados de demonstração (usuários, clientes, OS, etc.)
npm run db:seed

# 6. Iniciar em desenvolvimento (http://localhost:3000)
npm run dev
```

Scripts úteis:

```bash
npm run build       # build de produção (Next standalone)
npm start           # serve o build
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm test            # Vitest
npm run db:studio   # Prisma Studio
```

> O `docker-compose.yml` cria o Postgres com usuário/senha `zimmeros`. Se usar
> esse container, ajuste o `DATABASE_URL` para
> `postgresql://zimmeros:zimmeros@localhost:5432/zimmeros`.

---

## Demo / Credenciais

Após `npm run db:seed`, a senha de **todos** os usuários é `zimmer123`:

| E-mail                  | Senha       | Papel          |
| ----------------------- | ----------- | -------------- |
| `admin@zimmer.com`      | `zimmer123` | Administrador  |
| `atendente@zimmer.com`  | `zimmer123` | Atendente      |
| `mecanico@zimmer.com`   | `zimmer123` | Mecânico       |
| `mecanico2@zimmer.com`  | `zimmer123` | Mecânico       |
| `financeiro@zimmer.com` | `zimmer123` | Financeiro     |
| `estoque@zimmer.com`    | `zimmer123` | Estoque        |

> Credenciais de demonstração. **Troque tudo antes de qualquer uso real.**

---

## Roadmap

- [x] Anexos/fotos reais em OS e veículos (upload + storage local).
- [x] Geração de PDF server-side para orçamentos e recibos (com *fallback* HTML).
- [x] Garantias com alertas de vencimento.
- [x] Relatórios financeiros (fluxo de caixa, contas a pagar/receber, caixa) e
      exportação CSV (margem e comissão).
- [x] Consultas externas (CEP/CNPJ/FIPE) nos formulários.
- [x] Auditoria de ações sensíveis.
- [x] Envio de e-mail via SMTP (com *fallback* mock quando não configurado).
- [ ] Aplicação granular de permissões por papel em **todas** as rotas/ações.
- [ ] Envio automatizado de mensagens (integração com API oficial do WhatsApp).
- [ ] Storage durável de anexos (S3/Blob) para múltiplas instâncias.
- [ ] Notificações no app e lembretes de manutenção preventiva por IA.
- [ ] Testes de integração das Server Actions e cobertura E2E.

---

ZimmerOS AI — feito para a oficina **Irmãos Zimmer**.
