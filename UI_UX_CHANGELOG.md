# UI/UX Changelog — ZimmerOS AI (Irmãos Zimmer)

Registro das mudanças de UI/UX por fase de implementação. Cada fase deve ser preenchida
conforme for entregue. O documento de referência é [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md).

> **Regra transversal:** preservar a lógica de negócio (server actions em `src/server/*`,
> schemas Zod, queries Prisma, regras de status, cálculos financeiros, engine de slots e
> prompts de IA). O trabalho é de apresentação, consolidação de componentes e qualidade.

## Legenda de status
- ✅ Concluída · 🚧 Em andamento · ⬜ Pendente

---

## Fase 0 — Auditoria UI/UX ✅ Concluída (2026-06-05)

- ✅ Auditoria somente-leitura das 10 frentes documentada em `UI_UX_AUDIT.md`.
- ✅ Mapeamento de componentes reutilizáveis, padrões duplicados, problemas de
  acessibilidade e responsividade.
- ✅ Plano de implementação faseado (7 fases) com tarefas, arquivos afetados e o que
  NÃO mudar.
- ✅ Decisões assumidas (defaults) e riscos de regressão registrados.

Achados-chave verificados no código real: focus ring inconsistente
(`button.tsx:6` usa `focus-visible` vs `input/select/textarea` usam `focus:ring`);
`Badge` com `text-[11px]`; `getModel()` retorna `gpt-5.4-mini` (inexistente) em
`src/lib/ai/client.ts:21`; NAV plano de 15 itens em `app-shell.tsx`; ausência de
`sitemap.ts`/`robots.ts`/toast/skeleton/modal-em-`ui/`; Modal só em `financeiro/modal.tsx`.

---

## Fase 1 — Tokens, Tipografia e Estados ✅ Concluída (2026-06-05)

### Tokens ajustados (`src/app/globals.css`)
- **Contraste de texto secundário/terciário** elevado para ≥ 4.5:1:
  - Claro: `--muted` `#5b6470 → #4c545f`; `--subtle` `#94a0a8 → #6b7480`.
  - Escuro: `--muted` `#9aa0a0 → #a3a9a9`; `--subtle` `#6b7176 → #868d92`.
- **Cores de status** otimizadas para contraste de texto:
  - Claro: `--success #16a34a → #15803d`, `--warning #f59e0b → #b45309`, `--info #0ea5e9 → #0369a1` (danger mantido `#dc2626`).
  - Escuro: status clareados — `--success #4ade80`, `--warning #fbbf24`, `--danger #f87171`, `--info #38bdf8`.
- **Novo token de foco** `--ring` (`#00a651` claro / `#2ec46b` escuro) e aliases em `@theme`:
  `--color-ring`, `--color-text-primary` (→ foreground), `--color-text-secondary` (→ muted),
  `--color-text-tertiary` (→ subtle). Verde de marca preservado (accent inalterado).
- **Paleta de gráficos** (`src/components/relatorios/chart-theme.ts`): `CHART_COLORS` e
  `CHART_PALETTE` re-tonificadas para distinção e contraste em fundo claro (#f4f6f9) e escuro
  (#0e0f11) — roxo `#8b5cf6 → #7c3aed`, info `#0ea5e9 → #0284c7`, warning `#f59e0b → #ea8c00`,
  teal `#14b8a6 → #0d9488`, rosa `#ec4899 → #db2777`, accentLight `#8cc63f → #7cb518`,
  muted `#94a3b8 → #64748b`. Verde de marca `#00a651` mantido como cor primária.

### Tipografia / contraste
- `Badge` migrado de `text-[11px]` hardcoded para `text-xs` (`src/components/ui/badge.tsx`).
- Toast/Skeleton/Spinner/ErrorState usam escala `text-sm`/`text-xs` consistente com os tokens.

### Focus-visible (a11y consistente)
- `Input`, `Select`, `Textarea` alinhados ao padrão de `Button`: `focus:ring` → `focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/50`.
- `Button` reforçado: `focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg`.
- Foco global para links/`[tabindex]`/`summary` via `outline: 2px solid var(--ring)` no `@layer base`.

### Reduced-motion
- Bloco `@media (prefers-reduced-motion: reduce)` em `globals.css`: neutraliza animações/transições
  globalmente, desliga `animate-fade-in` e mantém o `animate-pulse-soft` de loading visível porém
  sem piscar. Os novos componentes (`Skeleton`, `Spinner`, `Toast`) usam `motion-reduce:animate-none`.

### Novos componentes de estado (`src/components/ui/`)
- **`toast.tsx`** — `Toaster` (Client Component, provider + viewport), hook `useToast`, função global
  `toast()` com fila pré-mount, 4 variantes (success/error/info/warning), auto-dismiss, pausa em
  hover/focus, `role="alert"/aria-live="assertive"` para erros e `role="status"/polite` para os demais.
- **`skeleton.tsx`** — `Skeleton`, `SkeletonText`, `SkeletonCard` (placeholders animados, `aria-hidden`).
- **`spinner.tsx`** — `Spinner` CVA (xs/sm/md/lg), acessível (`role="status"` + label `sr-only`).
- **`error-state.tsx`** — `ErrorState` reutilizável (análogo a `EmptyState`) com `onRetry`/`action`.

### Onde o Toaster foi montado
- **`src/app/layout.tsx` (root layout)**: `<Toaster>{children}</Toaster>` dentro do `<body>`.
  Isso o disponibiliza em TODA a árvore — painel interno `(app)`, site público `(site)` e `/entrar` —
  com SSR correto (o `Toaster` é `"use client"` e o root layout permanece Server Component).

### Riscos / pendências
- Aliases `--color-text-*` foram criados, mas o código ainda usa `text-foreground`/`text-muted`/
  `text-subtle`; a migração de uso fica para fases posteriores (sem regressão atual).
- Toast global instalado; toasts ad-hoc existentes (ex.: ContasPagar) ainda não foram unificados (Fase 2/4).
- Contraste do tooltip de gráfico em dark e o aviso SSR do recharts (chart com largura -1 antes da
  hidratação no dashboard) são pré-existentes e ficam para Fase 3/4 — não são erros (renderiza no cliente).
- Demais itens da auditoria (focus trap em diálogos/drawer, skip link, ≥40×40 universal, correção do
  modelo IA `gpt-4o-mini`) seguem nas Fases 2/5/7.

---

## Fase 2 — Navegação, Headers, Tabelas, Forms, Dialogs e Shell Responsivo ⬜ Pendente

### Telas alteradas
- _(a preencher)_

### Componentes reutilizados
- _(a preencher)_

### Novos componentes
- _(a preencher)_

### Mudanças de comportamento
- _(a preencher)_

### Correções de acessibilidade
- _(a preencher)_

### Recomendações pendentes
- _(a preencher)_

---

## Fase 3 — OS Workspace, Clientes, Veículos, Agenda, Mecânico (+ Dashboard) ⬜ Pendente

### Telas alteradas
- _(a preencher)_

### Componentes reutilizados
- _(a preencher)_

### Novos componentes
- _(a preencher)_

### Mudanças de comportamento
- _(a preencher)_

### Correções de acessibilidade
- _(a preencher)_

### Recomendações pendentes
- _(a preencher)_

---

## Fase 4 — Estoque, Pagamentos, Finanças, Fornecedores, Relatórios ⬜ Pendente

### Telas alteradas
- _(a preencher)_

### Componentes reutilizados
- _(a preencher)_

### Novos componentes
- _(a preencher)_

### Mudanças de comportamento
- _(a preencher)_

### Correções de acessibilidade
- _(a preencher)_

### Recomendações pendentes
- _(a preencher)_

---

## Fase 5 — IA + Markdown Seguro ⬜ Pendente

### Telas alteradas
- _(a preencher)_

### Componentes reutilizados
- _(a preencher)_

### Novos componentes
- _(a preencher)_

### Mudanças de comportamento
- _(a preencher)_

### Correções de acessibilidade
- _(a preencher)_

### Recomendações pendentes
- _(a preencher)_

---

## Fase 6 — Site Público, Agendamento, Confiança e Mobile ⬜ Pendente

### Telas alteradas
- _(a preencher)_

### Componentes reutilizados
- _(a preencher)_

### Novos componentes
- _(a preencher)_

### Mudanças de comportamento
- _(a preencher)_

### Correções de acessibilidade
- _(a preencher)_

### Recomendações pendentes
- _(a preencher)_

---

## Fase 7 — Dark Mode, Acessibilidade, Performance, Testes e Docs ⬜ Pendente

### Telas alteradas
- _(a preencher)_

### Componentes reutilizados
- _(a preencher)_

### Novos componentes
- _(a preencher)_

### Mudanças de comportamento
- _(a preencher)_

### Correções de acessibilidade
- _(a preencher)_

### Recomendações pendentes
- _(a preencher)_
