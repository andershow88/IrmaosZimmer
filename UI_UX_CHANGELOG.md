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

## Fase 2 — Navegação, Headers, Tabelas, Forms, Dialogs e Shell Responsivo ✅ Concluída (2026-06-05)

### Navegação agrupada, colapsável e persistida
- **NAV plano → grupos semânticos** (`src/components/shell/nav-config.ts`): `NavGroup[]` com os
  grupos do contrato — **Operação** (Dashboard/Agenda/Ordens de Serviço/Checklists),
  **Relacionamento** (Clientes/Veículos/Avisos), **Comercial** (Orçamentos/Pagamentos),
  **Estoque** (Peças e Estoque/Serviços/Fornecedores), **Gestão** (Financeiro/Relatórios),
  **Inteligência** (Assistente AI) e **Sistema** (Usuários/Configurações). Todos os `href`
  existentes foram preservados (apenas reagrupados).
- **Rota ativa inequívoca**: `isItemActive` escolhe o item de href mais específico (mais longo)
  entre os que casam — em `/painel/configuracoes/usuarios` destaca "Usuários", não "Configurações".
  `isGroupActive` destaca o grupo-pai.
- **Sidebar colapsável** (`src/components/shell/sidebar-nav.tsx`): cada grupo abre/fecha com estado
  **persistido** em `localStorage` (`zimmeros-nav-collapsed-groups`); `aria-expanded`/`aria-controls`.
- **Modo ícones** persistido: toggle de recolher a sidebar inteira (`zimmeros-sidebar-collapsed`),
  com tooltips CSS em hover/focus quando colapsada.

### Busca global + Command Palette
- **`command-palette.tsx`** (`src/components/shell/`, auto-contido, `"use client"`): abre com
  **Cmd/Ctrl+K** e ao receber o evento `window` `"open-command-palette"`. Busca em `/api/busca?q=`
  com debounce (~220ms) + cancelamento de respostas obsoletas (AbortController + reqId).
  Navegação por teclado (↑/↓, Enter, Esc), `role="dialog"`/`combobox`/`listbox`,
  `aria-activedescendant`, focus trap e retorno de foco.
- **`/api/busca`** (`src/app/api/busca/route.ts`, GET, `?q=`, protegida por sessão): busca em
  paralelo cliente (nome/cpfCnpj/telefone), veículo (placa/modelo), OS (numero), orçamento (numero),
  peça (codigoInterno/nome) e fornecedor (nome) → `{ grupos: [{ tipo, label, itens:[{id,titulo,subtitulo,href}] }] }`,
  limite de 5 por grupo, `mode: "insensitive"`. Sem sessão devolve **401**.
- **Botão de busca no topbar** dispara `window.dispatchEvent(new Event("open-command-palette"))`
  (sem props acopladas), com variante compacta no mobile.

### Breadcrumbs
- **`breadcrumbs.tsx`** (`src/components/shell/`, `"use client"`, auto-contido): deriva de
  `usePathname()` com mapa rota→rótulo pt-BR; IDs (cuid/uuid/numérico) viram "Detalhe"; não
  renderiza nada na raiz `/painel`. Montado no conteúdo do shell.

### Telas alteradas
- **`src/components/shell/app-shell.tsx`** — monta `<CommandPalette/>` uma vez; botão de busca no
  topbar; `<Breadcrumbs/>` no conteúdo; **skip link** ("Pular para o conteúdo") + `<main id="conteudo">`;
  sidebar desktop usa o novo `<SidebarNav>` (grupos/colapso/ícones); drawer mobile com `role="dialog"`
  + Esc; NAV plano removido.
- **`src/components/ui/dialog.tsx`** — `ConfirmDialog` passa a usar `useFocusTrap` (de `ui/modal.tsx`):
  trap de Tab/Shift+Tab, Esc (desligado enquanto `loading`), retorno de foco; `consequenceItems` para
  contexto de cascata; alvos de toque dos botões icon-only elevados a 40×40.
- **Nova rota `src/app/(app)/painel/configuracoes/usuarios/page.tsx`** — o item de menu "Usuários"
  aponta para `/painel/configuracoes/usuarios`, que antes **não existia** (só `novo` e `[id]/editar`;
  a listagem vivia em uma aba `useState` dentro de `/painel/configuracoes`). Criada página dedicada
  protegida (`requireUser` + restrição a ADMINISTRADOR) que reutiliza `UsuariosLista`. Isso garante
  o **200** exigido pelo contrato e a coerência do menu.

### Componentes reutilizados
- `Spinner`/`ErrorState` (Fase 1) na Command Palette; `UsuariosLista`/`PageHeader`/`EmptyState`
  na nova página de Usuários; `useFocusTrap`/`useBodyScrollLock` compartilhados entre Modal/Dialog/Drawer.

### Novos componentes (primitivos em `src/components/ui/`)
- **`data-table.tsx`** — `DataTable<T>` genérica (colunas tipadas, ordenação opcional, estados de
  loading/empty, sticky header, scroll horizontal acessível).
- **`pagination.tsx`** — `Pagination` (páginas + "Mostrando X de Y").
- **`dropdown-menu.tsx`** — `DropdownMenu` + `RowActions` (kebab `⋮`) para ações por linha.
- **`tabs.tsx`** — `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` composable (substitui o padrão
  hardcoded de `ConfiguracoesTabs` nas próximas fases).
- **`modal.tsx`** — `Modal` genérico promovido para `ui/` (focus trap, body scroll lock, ESC, overlay,
  `aria-modal`/`aria-labelledby`) + hooks reutilizáveis `useFocusTrap` e `useBodyScrollLock` (agora
  consumidos também pelo `ConfirmDialog`).
- **`search-input.tsx`** — `SearchInput` padronizado (ícone, debounce, limpar).
- **`filter-bar.tsx`** — `FilterBar` para filtros/abas de listagem.

### Mudanças de comportamento
- Atalho global **Cmd/Ctrl+K** abre/fecha a busca em qualquer rota do painel.
- Estado de navegação (grupos recolhidos + sidebar colapsada) é **lembrado** entre sessões.
- Página dedicada de Usuários acessível diretamente pela URL (deep-link), além da aba em Configurações.

### Correções de acessibilidade
- **Skip link** no shell ("Pular para o conteúdo") + `<main id="conteudo">`.
- **Focus trap** em `ConfirmDialog`, `Modal` e na Command Palette; retorno de foco ao fechar.
- Drawer mobile com `role="dialog"`/`aria-modal` e fechamento por Esc.
- Alvos de toque ≥ 40×40 em botões icon-only do shell/diálogos; `focus-visible:ring` consistente.
- `aria-current="page"` nos itens ativos; tooltips acessíveis no modo ícones.

### Smoke realizado (dev :3960, login admin@zimmer.com)
- Todas as 17 rotas internas do contrato retornaram **200** (incluindo a nova
  `/painel/configuracoes/usuarios`).
- `GET /api/busca?q=…` com cookie → **200** com grupos preenchidos (cliente, veículo, OS, orçamento,
  peça, fornecedor verificados); **sem cookie → 401**. Sem erros no log do servidor.

### Recomendações pendentes (Fases 3–4)
- **As páginas de módulo ainda NÃO foram migradas** para os novos primitivos
  (`DataTable`/`Pagination`/`RowActions`/`SearchInput`/`FilterBar`/`Tabs`): listas (clientes,
  veículos, estoque, pagamentos, financeiro, fornecedores, relatórios), formulários e a OS workspace
  permanecem como estavam e serão migrados nas Fases 3–4.
- Unificar os deletes duplicados em `GenericDeleteButton<T>` e converter buscas locais para o padrão
  URL + debounce continua pendente (Fase 2/3).
- Padrões de formulário (`FormFieldError`/`FormFooter`/`FormSection`, CSRF no painel, aviso de
  alterações não salvas, auto-foco no 1º erro) ficam para as fases de migração de telas.
- Migrar `ConfiguracoesTabs` para o `Tabs` genérico e consolidar toasts ad-hoc (Fase 4).

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
