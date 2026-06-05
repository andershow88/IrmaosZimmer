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

## Fase 3 — OS Workspace, Clientes, Veículos, Agenda, Mecânico (+ Dashboard) ✅ Concluída (2026-06-05)

> Telas operacionais centrais migradas para os primitivos da Fase 2. Após a
> implementação inicial, uma **revisão adversarial multi-agente** (5 superfícies,
> achados verificados de forma independente) apontou regressões e lacunas que
> foram corrigidas antes do fechamento da fase. Verificação: `tsc` limpo,
> `next build` limpo e **smoke runtime** (dev :3971, cookies por papel) — todas as
> rotas internas 200; redirecionamentos/404 de segurança conforme esperado.

### Telas alteradas
- **OS detail** (`ordens-servico/[id]/page.tsx` + `components/ordens/*`): abas com URL
  (`?aba=`), header sticky compacto (`os-header`), action bar sticky (`os-action-bar`),
  timeline via `AuditLog` (`os-timeline`), undo de item com toast, confirmação de
  ENTREGUE com checklist, página de impressão (`[id]/imprimir`). **Anexos agora em
  lazy-load** (Suspense) — saíram da query principal (fix `os-3`).
- **Clientes** (`clientes/page.tsx`, `[id]`, `clientes-table`): lista em `DataTable` +
  `RowActions` + **busca server-side persistida na URL** (`?q=`) + **paginação**.
- **Veículos** (`veiculos/page.tsx`, `[id]`, `veiculos-table`, `registrar-km-modal`):
  idem clientes + modal de registrar km.
- **Dashboard** (`painel/page.tsx`, `server/dashboard.ts`, `dashboard/*`): stat-cards de
  urgência, "dias até entrega", `EmptyState` no chart, priorização de estoque crítico,
  contexto por papel (`BLOCOS_POR_PAPEL`, parâmetros `userId/role` opcionais), `SectionCard`.
- **Painel do Mecânico / Oficina** (`oficina/`, `components/oficina/*`, `server/oficina.ts`):
  módulo novo (lista touch-first + detalhe), timer de apontamento, status, notas, checklist.
- **Agenda** (`agenda/page.tsx`, `agenda-filtros`, `calendar-toggle`): filtros padronizados
  em `FilterBar` + `SearchInput` (com "Limpar filtros" e contagem); toggles Calendário|Lista
  e Semana|Dia migrados para `Tabs` acessível; card da lista extraído em `AgendamentoCard`.
  **Sem tocar** na engine de disponibilidade, no fuso (SP), no `CalendarWeek` nem nas queries.

### Novos componentes / utilitários
- `components/anexos/anexos-secao.tsx` — seção de anexos da OS (async + `AnexosSecaoFallback`).
- `components/agenda/agendamento-card.tsx` — card responsivo reutilizável de agendamento.
- `lib/use-list-controls.ts` — hook de busca (URL `?q=`) + paginação no cliente (reuso clientes/veículos).
- `lib/status-constants.ts` — `STATUS_OS_ABERTAS` + `isStatusOSAberta` (deduplicado de 2 telas).

### Componentes reutilizados
- `DataTable`/`Pagination`/`RowActions`/`SearchInput`/`FilterBar`/`Tabs`/`ConfirmDialog`/
  `EmptyState`/`StatusBadge`/`PageHeader`/`Skeleton` (todos da Fase 1/2).

### Correções da revisão adversarial (achados confirmados)
- **Segurança (oficina)** — `requirePageRole(["MECANICO","ADMINISTRADOR"])` nas rotas
  `/painel/oficina` e `/painel/oficina/[id]`; `obterDetalheOficina` passa a validar
  posse (`mecanicoId`/ADMINISTRADOR). Mecânico não acessa mais OS de terceiros
  (verificado: outro mecânico → 404; ATENDENTE → redirect `/painel`).
- **Regressão de busca (clientes)** — busca voltou a ser server-side com `?q=` na URL
  (bookmark/refresh/compartilhamento) e agora pesquisa **telefone E whatsapp** (não só um).
- **Paginação** ausente em clientes/veículos — adicionada (client-side sobre o conjunto filtrado).
- **`deleteVeiculo`** deixou de `redirect()` e retorna `{ ok }` (espelha `deleteCliente`):
  some o toast inalcançável; a lista atualiza no lugar e o detalhe navega para a lista.
- **ConfirmDialog de exclusão de cliente** deixa claro que OS/orçamentos vinculados
  **impedem** a exclusão (antes prometia cascata enganosa).
- **Tipagem `Decimal`** — `total: unknown` + `as number` removidos (clientes/veículos `[id]`).
- **Timer do mecânico** — cronômetro ao vivo só após `mounted` (sem skew de relógio SSR/cliente).
- **a11y** — `aria-hidden` em ícones decorativos das barras de ação.

### Mudanças de comportamento
- Busca de clientes/veículos é persistida na URL e filtrada no servidor (300ms debounce).
- Listas paginadas (20/página) com ordenação no cliente sobre o conjunto filtrado.
- Agenda: "Limpar filtros" e contador de resultados; busca da lista com debounce.

### Recomendações pendentes (próximas fases)
- Migrar `ConfiguracoesTabs` e demais listas (estoque/pagamentos/financeiro/fornecedores)
  para os primitivos — **Fase 4**.
- IA + markdown seguro — **Fase 5**; site público/mobile — **Fase 6**; dark/perf/testes — **Fase 7**.

---

## Fase 4 — Estoque, Serviços, Pagamentos, Finanças, Fornecedores, Relatórios ✅ Concluída (2026-06-05)

> Módulos de gestão/financeiro estendidos aos primitivos da Fase 2. Mapeamento +
> implementação dos 6 módulos em paralelo (arquivos disjuntos) + **revisão adversarial**
> (9 achados confirmados, todos corrigidos). Verificação: `tsc` limpo, `next build` limpo,
> **smoke runtime** (dev :3972, cookie admin) — 12 rotas 200, busca server-side filtrando,
> rótulos financeiros corretos.

### Novos primitivos (`src/components/ui/`)
- **`currency-field.tsx`** — `CurrencyField`: exibe BRL "1.234,56" (prefixo R$) e **submete
  decimal com ponto** ("1234.56") via input hidden — compatível com `z.coerce.number()`
  (financeiro/pagamentos) e o `num()` do estoque. Não usar em servicos (parser BRL próprio).
- **`date-field.tsx`** — `DateField`: wrapper estilizado de `type="date"` (mesma semântica yyyy-mm-dd).
- **`status-badge.tsx`** ganhou domínios: `servico` (ATIVO/INATIVO), `estoque` (ZERADO/BAIXO/OK
  + helper `nivelEstoque(qtd, min)`), `conta_pagar` (Em aberto/Pago/Vencido) e `conta_receber`
  (Em aberto/Recebido/Vencido — terminologia de recebíveis preservada).

### Telas migradas para DataTable (+ RowActions/paginação/busca)
- **Estoque**: `pecas-list` (busca server-side `?q=` + `?categoria=`, paginação, RowActions);
  histórico de movimentações → `movimentacoes-table` (paginado).
- **Serviços**: lista → `servicos-table` (RowActions consolidando Editar/Ativar-Desativar/Excluir).
- **Pagamentos**: lista → `pagamentos-table` (filtros `?q=/?status=/?forma=`, paginação, RowActions).
- **Financeiro**: `contas-pagar-list`, `contas-receber-list`, `contas-a-faturar` → DataTable + RowActions.
- **Fornecedores**: lista → `fornecedores-table` (busca server-side, paginação, RowActions);
  `fornecedor-search` removido (busca migrou para a toolbar).

### StatusBadge / formulários / feedback
- Badges hardcoded → `StatusBadge` nos domínios novos (estoque, serviço, conta_pagar/receber)
  em estoque, serviços, financeiro, fornecedores e relatórios.
- `CurrencyField` em peça (custo/venda), contas a pagar/receber (valor), caixa (abertura/movimento).
- `DateField` em pagamento (data) e contas (vencimento).
- **Toasts** em todas as mutações (peça/movimentação/serviço/pagamento/contas/caixa/exportação).
- `ConfirmDialog` enriquecido com `consequenceItems` (peça, serviço, fornecedor, contas).
- Relatórios: `EmptyState` unificado em gráficos vazios; `CHART_PALETTE` — 3 cores de baixo
  contraste no dark ajustadas (>= ~4.5:1), shape do array preservado.

### Correções da revisão adversarial (9 confirmadas)
- **Recebíveis mostravam "Pago"/"Pendente"** → domínio `conta_receber` ("Recebido"/"Em aberto");
  contas a pagar mantêm "Em aberto"/"Pago"/"Vencido" (regressão de terminologia corrigida).
- **`ExcluirPagamento` fechava em silêncio no erro** → toast de erro + diálogo permanece aberto.
- **`movimentacao-form`** sem toast de sucesso → adicionado.
- **Erro de exclusão de peça** invisível fora do diálogo → também via toast de erro.
- **`fornecedor-form`** erro duplicado (toast + inline) → mantido só o inline.
- Componentes órfãos pós-consolidação removidos: `delete-peca-button`, `servico-toggle`, `servico-delete`.

### NÃO alterado (preservado)
- `server/{estoque,servicos,pagamentos,financeiro,fornecedores,relatorios}.ts` — lógica de
  giro, contas, alternância de pagamento, `deriveStatus`, cálculos de relatório e schemas Zod.
- O input de preço de **serviços** ficou intacto (parser BRL próprio incompatível com CurrencyField).

### Recomendações pendentes
- **Fase 5** IA + Markdown seguro · **Fase 6** site público/mobile · **Fase 7** dark/perf/testes.

---

## Fase 5 — IA + Markdown Seguro ✅ Concluída (2026-06-05)

- **Bug crítico:** `getModel()` deixou de retornar `gpt-5.4-mini` (inexistente) →
  `gpt-4o-mini`, com guard/trim de `OPENAI_MODEL`; `.env.example` atualizado.
- **Novos primitivos** `src/components/ui/`: `MarkdownResult` (renderiza o
  Markdown seguro sem-deps já existente + ações copiar / tentar-novamente /
  fechar) e `AiBadge` (modelo configurado ou "modo demonstração").
- `ai-buttons`, `resumo-ia` e `explicar-ia` migrados de `whitespace-pre-wrap`
  para `MarkdownResult`; `aiModel`/`aiDemo` threaded das páginas servidor (OS,
  checklist, orçamento) via `getModel()`/`isAIAvailable()`.
- **Preservado:** prompts, regras anti-alucinação, logging `AiInteraction`,
  rate-limit e o contrato tipado de `lib/ai/index.ts`.
- **Deferido:** ação "Gerar WhatsApp" automática ao concluir a OS (baixa prioridade).

---

## Fase 6 — Site Público, Agendamento, Confiança e Mobile ✅ Concluída (2026-06-05)

- **SEO:** `src/app/sitemap.ts` + `src/app/robots.ts` (bloqueia `/painel`, `/api`,
  `/entrar`); `metadataBase` + Open Graph + Twitter Card em `(site)/layout`;
  `canonical` por página (home, serviços, sobre, acessórios, agendar, contato).
- **Dados estruturados:** JSON-LD `schema.org/AutoRepair` na home e no contato
  (com telefone/e-mail das `WorkshopSettings`) + `BreadcrumbList` no contato;
  helper `src/lib/site-meta.ts` (`SITE_URL` via `NEXT_PUBLIC_SITE_URL`, OG image,
  builders de JSON-LD).
- **Confiança/mobile:** `FloatingWhatsApp` sticky (aparece ao rolar, reusa
  `waLink`; número via `WorkshopSettings`); hero da home com padding responsivo.
- **Preservado:** `api/agendar/slots`, validação/honeypot/rate-limit/LGPD do
  `agendar-form`, `site-data.ts` (apenas consumido).
- **Deferido:** auto-carregar a próxima data disponível no agendamento (risco
  médio sobre o form) e ajustes finos de tipografia < 375px.

---

## Fase 7 — Dark Mode, Acessibilidade, Performance, Testes e Docs ✅ Concluída (2026-06-05)

- **Mobile/perf:** chat usa `100dvh` (antes `100vh`, cortava no mobile);
  `server/dashboard.ts` com limites de lista parametrizados (`DASH_LIMIT`,
  `DASH_LIMIT_COMPACT`, `DASH_LIMIT_WIDE`) no lugar de 11 números mágicos; logo do
  rodapé com `loading="lazy"`/`decoding="async"`.
- **Auditoria a11y/dark (já conformes, verificado):** focus trap em
  modais/diálogos/drawer, skip link no shell, `aria-label`/`aria-hidden`,
  `prefers-reduced-motion` global e tokens de contraste claro/escuro ≥ 4.5:1 já
  estavam implementados nas fases anteriores — sem regressões.
- **Docs:** novo `docs/FORM_PATTERNS.md` (guia de novos formulários/listas/deletes
  + checklist de acessibilidade e dark mode) e seção "Qualidade, Acessibilidade &
  SEO" no `README.md`.
- **Deferido (notado):** Suspense/streaming nas páginas de veículos/dashboard e a
  suíte de testes automatizados (axe/Lighthouse/E2E) — sem mudar comportamento.
