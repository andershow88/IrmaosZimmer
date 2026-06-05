# Auditoria UI/UX — ZimmerOS AI (Irmãos Zimmer)

> Documento de auditoria **somente-leitura**. Nenhum código de aplicação foi alterado na sua produção.
> Data: 2026-06-05 · Responsável: Lead UX/UI · Repositório: `IrmaosZimmer`
> Status do build no momento da auditoria: **verde** (app em funcionamento).

---

## 1. Sumário Executivo

O ZimmerOS AI é um sistema de gestão de oficina (pt-BR) com painel interno e site público, construído sobre uma base técnica madura: **Next.js 16 (App Router) + React 19 + Prisma 6/Postgres + Tailwind v4** com tokens semânticos e tema claro/escuro, componentes CVA em `src/components/ui/*` e um módulo de IA já integrado. O **design system está praticamente completo** e a aplicação está estável e funcional.

A auditoria cobriu **10 frentes** e identificou que o produto está sólido no nível de fundação (tokens, componentes base, fluxos CRUD, agendamento público) mas apresenta um padrão recorrente de **duplicação operacional** (delete dialogs, buscas, filtros) e **lacunas de padrões transversais** (toast, skeleton, data-table genérica, paginação, command palette, breadcrumbs, focus trap). Essas lacunas não bloqueiam o funcionamento atual, porém encarecem a manutenção e a adição de novos módulos, além de gerar inconsistências visuais e de acessibilidade.

### Principais oportunidades (alto impacto)

1. **Consolidar padrões operacionais duplicados** — extrair `GenericDeleteButton`, `GenericSearch`, `FilterTabs` e uma `DataTable<T>` genérica elimina seis variações de delete, duas de busca e cinco de filtro.
2. **Padrões transversais ausentes** — Toast, Skeleton/Suspense, Paginação, Modal genérico (hoje só em `financeiro/modal.tsx`), DropdownMenu de ações por linha.
3. **Navegação** — sidebar plana com 15 itens sem agrupamento semântico; sem breadcrumbs, command palette ou busca global; responsividade fraca em tablet.
4. **Acessibilidade (WCAG 2.2 AA)** — contraste de `text-muted`, alvos de toque <40px, ausência de focus trap em diálogos/drawer, ausência de skip link e de `prefers-reduced-motion`, inconsistência de focus ring (`focus:ring` vs `focus-visible:ring`).
5. **OS workspace** — página de detalhe de ~400 linhas sem abas, sem header sticky e sem timeline (apesar de `AuditLog` existir no schema).
6. **Site público / SEO** — sem JSON-LD `LocalBusiness`, sem Open Graph/Twitter Card, sem `sitemap.ts`/`robots.ts`, sem WhatsApp sticky no mobile.
7. **Correção pontual crítica** — `getModel()` em `src/lib/ai/client.ts:21` retorna `gpt-5.4-mini` (modelo inexistente) como fallback.

### Veredito

A base é reaproveitável e bem desenhada. O esforço recomendado concentra-se em **consolidação de padrões e refinamento de qualidade (a11y, responsivo, SEO)**, não em reescrita. O plano faseado (Seção 8) preserva toda a lógica de negócio existente.

---

## 2. Stack e Convenções Detectadas (resumo)

| Camada | Tecnologia / Convenção |
|---|---|
| Framework | Next.js 16 App Router, React 19, Server Components + Server Actions |
| Dados | Prisma 6 / PostgreSQL; server actions em `src/server/*` retornando `{ ok, error? }` |
| Estilo | Tailwind v4; tokens semânticos em `src/app/globals.css` (`:root` + `[data-theme="dark"]` + `@theme`) |
| Tema | Claro/escuro via atributo `data-theme`; escuro é cinza profundo (`#0e0f11`), não preto puro |
| Componentes UI | CVA (`class-variance-authority`) em `src/components/ui/*` (13 componentes base) |
| Tipografia | Inter via `next/font/google`; escala `text-xs`→`h1` |
| Ícones | `lucide-react` |
| Validação | Zod (server-side), máscaras BR em `src/lib/masks.ts` |
| Gráficos | `recharts` + paleta hex fixa em `src/components/relatorios/chart-theme.ts` |
| Markdown IA | `marked` renderizado por `src/components/assistente/markdown.tsx` (sem `dangerouslySetInnerHTML`) |
| Auth | `jose` (JWT), `bcryptjs` |
| PDF / E-mail | `@react-pdf/renderer`, `nodemailer` |
| Layout | site público em `src/app/(site)/*`; painel em `src/app/(app)/painel/*`; shell em `src/components/shell/app-shell.tsx` |

**Convenções observadas:** nomes de arquivos kebab-case; componentes de domínio agrupados por módulo (21 módulos); formulários com Zod + `parseFieldErrors`; status visual via `StatusBadge` com 5 domínios (`os`, `orcamento`, `agendamento`, `pagamento`, `inspecao`); helpers de formatação (`formatBRL`, `formatDateTimeBR`, `formatDuracao`).

---

## 3. Achados por Frente (10)

> Severidades normalizadas: **Alta** / **Média** / **Baixa** / **Info**. "Local" cita arquivo (e linha quando conhecida).

### Frente 1 — Design System: Tokens, Tipografia e Tema Claro/Escuro
**Fase associada:** Fase 1 (refinamento pré-implementação).

**Estado atual:** Design system bem estruturado com Tailwind v4 + CSS custom properties. Tokens semânticos completos com suporte a tema claro/escuro. Componentes CVA padronizados. App buildado e verde.

**O que reaproveitar:**
- Tokens base semânticos (`--color-bg`, `--color-surface`, `--color-foreground`, `--color-muted`, `--color-subtle`, `--color-border`, `--color-accent`, `--color-success/warning/danger/info`).
- Sistema de `StatusBadge` com 7 variantes.
- Padrão de focus ring (`focus-visible:ring-2 focus-visible:ring-accent/40`).
- `CHART_COLORS` (hex fixo) e `CHART_PALETTE` (10 cores) agnósticos de tema.
- Escala tipográfica e de espaçamento (Tailwind padrão), tamanhos de botão, escala de raio.
- Paleta accent verde (`#00a651` claro / `#2ec46b` escuro) com variações.
- `.prose-zimmer`, e componentes de layout (`PageHeader`, `StatCard`, `Card`, `EmptyState`, `ConfirmDialog`).

**Problemas:**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 1.1 | A11y / consistência | Média | Focus ring inconsistente: `Button` usa `focus-visible:ring-accent/40`; `Input`/`Select`/`Textarea` usam `focus:ring-accent/20` (sem `focus-visible`). **Verificado.** | `button.tsx:6` vs `input.tsx:17`, `select.tsx:20`, `textarea.tsx:14` |
| 1.2 | Tipografia | Baixa | Mínimo `text-xs` (12px) abaixo da recomendação operacional de 14px; rótulos ALL CAPS + `text-xs` prejudicam legibilidade em telas pequenas. | `globals.css:135-150`, `badge.tsx:6` (`text-[11px]` hardcoded) |
| 1.3 | Tokens | Baixa | Sem aliases explícitos `text-primary/secondary/tertiary`; usa-se `text-foreground`/`text-muted`/`text-subtle` ad-hoc. | `globals.css:3-55` |
| 1.4 | Dark theme | Baixa | Cores de status (success/warning/danger/info) fixas, não otimizadas para contraste em fundo escuro. | `globals.css:51-54` |
| 1.5 | Gráficos | Baixa | 4 cores de `CHART_PALETTE` (`#f59e0b`, `#dc2626`, `#8b5cf6`, `#ec4899`) não testadas p/ contraste em fundo dark `#0e0f11`; roxo especialmente arriscado. | `chart-theme.ts:17-28` |
| 1.6 | Espaçamento | Muito baixa | Sem problema — escala Tailwind aplicada consistentemente. | `ui/*` |
| 1.7 | Border-radius | Muito baixa | Escala consistente (sm/md/lg/xl). | `globals.css:77-80` |

**Recomendações:** alinhar Input/Select/Textarea ao `focus-visible`; criar aliases de token primário/secundário/terciário; elevar mínimo operacional a `text-sm` (12px só p/ hints); testar contraste das 4 cores non-green; centralizar paleta de status em `src/lib/theme-constants.ts`; helper de truncate com tooltip; considerar `--ring-width`.

---

### Frente 2 — Navegação e Sistema de IA (Shell/Assistente)
**Fase associada:** Fase 2 (navegação/shell) + Fase 5 (IA).

**Estado atual:** Sidebar plana com 15 itens, drawer mobile, header com tema/sair, assistente IA no painel com 3 ações rápidas. Sem breadcrumbs, command palette ou busca global. Responsivo básico (`lg:` sidebar, `sm:` header).

**O que reaproveitar:** `app-shell.tsx` (modularizar NAV), `financeiro/nav.tsx` (padrão de subnav), `page-header.tsx` (estender com breadcrumbs), `assistente/quick-actions.tsx` (expor em command palette), `lib/ai/client.ts` + `index.ts`, `server/assistente.ts` + `assistente-actions.ts`, `ClientesSearch`/`FornecedorSearch`.

**Problemas:**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 2.1 | Arquitetura de navegação | Alta | 15 itens **planos** sem agrupamento semântico. **Verificado** (array `NAV`). | `app-shell.tsx:32-47` |
| 2.2 | Modelo IA hardcoded errado | Alta | `getModel()` retorna `gpt-5.4-mini` (inexistente) como fallback; deveria ser `gpt-4o-mini`. **Verificado** (`client.ts:21`). | `lib/ai/client.ts:21` |
| 2.3 | Subnav inconsistente | Média | Só Financeiro tem subnav com abas; Estoque/Configurações/Painel não têm. | `financeiro/nav.tsx`, `painel/financeiro/layout.tsx` |
| 2.4 | Responsivo tablet | Média | Sidebar só `lg:`; em tablet (768–1024px) força drawer mobile. Faltam `md:`/`xl:`. | `app-shell.tsx` (≈101, 130, 160) |
| 2.5 | Sem breadcrumbs | Média | Páginas profundas (`/clientes/[id]/editar`) sem caminho. | `ui/page-header.tsx` |
| 2.6 | Sem command palette | Média | Sem `Cmd/Ctrl+K`. **Verificado** (sem `cmdk` no `package.json`). | `package.json` |
| 2.7 | Busca global limitada | Média | Só `ClientesSearch`/`FornecedorSearch`; busca do assistente é modal isolado. | `clientes-search.tsx`, `quick-actions.tsx` |
| 2.8 | IA centralizada em página isolada | Média | Assistente só em `/painel/assistente`; ações rápidas não acessíveis de outras seções. | `painel/assistente/page.tsx` |
| 2.9 | Sem rota ativa de grupo | Média | Só item exato marcado ativo; sem destaque de grupo pai. | `app-shell.tsx` (≈58-61) |
| 2.10 | Tooltips em ícones colapsados | Baixa | Sidebar colapsada não exibiria tooltips (só `aria-label`). | `app-shell.tsx` |

**Recomendações:** refatorar NAV em `NavGroup[]` (Operação / Relacionamento / Comercial / Estoque / Financeiro / Gestão / Inteligência / Sistema); breadcrumbs no `PageHeader`; command palette `Cmd+K`; busca global na topbar (reaproveitar `acaoBuscarEmDados`); corrigir modelo IA p/ `gpt-4o-mini` + validar `OPENAI_API_KEY`; toggle de colapso com tooltips; breakpoint `md:` p/ tablet; `Subnav` genérico; assistente sempre acessível (drawer/atalho global); testes mobile <375px.

---

### Frente 3 — Inventário de Componentes UI e Padrões Duplicados
**Fase associada:** Fase 2 (consolidação de `ui/*` e padrões).

**Estado atual:** 13 componentes base em `ui/*` com CVA. Componentes de domínio em 21 módulos (19 forms, 9 lists, 6 delete dialogs, múltiplos filtros). **Padrões cruciais ausentes** e duplicação significativa.

**O que reaproveitar:** `Button` (5 variantes/4 sizes), `Badge` (7), `Card` composto, `ConfirmDialog`, `EmptyState`, `Table` + primitivos, `Input`/`Select`/`Textarea`, `PageHeader`, `StatCard`, `StatusBadge`, `Modal` (em financeiro), `ConfiguracoesTabs`, `ThemeToggle`.

**Problemas (resumo das duplicações e lacunas):**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 3.1 | Duplicação: delete dialogs | Alta | 6 componentes delete quase idênticos (useState open/error/pending + ConfirmDialog). | `{veiculos,fornecedores,clientes,garantias,servicos,anexos}/*-delete.tsx` |
| 3.2 | Lacuna: Toast | Alta | Nenhuma implementação de toast. **Verificado** (ausente em `ui/`). | `ui/*` (ausente) |
| 3.3 | Lacuna: Data Table genérica | Alta | Cada lista monta Table/THead/TBody manualmente; sem sort/seleção/sticky/responsivo. | múltiplas `*-list.tsx` |
| 3.4 | Duplicação: search | Média | 2 padrões (local `useMemo` sem debounce vs URL params, um com debounce 300ms). | `veiculos-list.tsx`, `fornecedor-search.tsx`, `clientes-search.tsx` |
| 3.5 | Duplicação: filtros | Média | 5 variações de filtro sem abstração genérica. | `{avisos,ordens,pagamentos,agenda,servicos}/*` |
| 3.6 | Lacuna: Skeleton/loading | Média | Sem skeleton; listas SSR sem fallback Suspense. | `ui/*` (ausente) |
| 3.7 | Lacuna: Tabs genérico | Média | `ConfiguracoesTabs` hardcoded 4 abas. | `configuracoes/tabs.tsx` |
| 3.8 | Lacuna: Paginação | Média | Sem paginação; listas mostram tudo. | `ui/*` (ausente) |
| 3.9 | Lacuna: Row action dropdown | Média | Ações em linha como ícones soltos; sem menu "Mais". | `pecas-list.tsx`, `contas-pagar-list.tsx` |
| 3.10 | Lacuna: Date Field | Média | Só `<input type=date>` nativo. | `ui/*` (ausente) |
| 3.11 | Lacuna: Currency Field | Média | `<input type=number>` + `formatBRL()` na exibição; sem máscara em tempo real. | `ui/*` (ausente) |
| 3.12 | Lacuna: Modal genérico | Média | Modal só em `financeiro/modal.tsx`; deveria estar em `ui/`. **Verificado.** | `financeiro/modal.tsx` |
| 3.13 | Lacuna: Form layout padronizado | Média | 19 forms com layouts divergentes; sem `FormGroup`/`FormLayout`. | `*-form.tsx` |
| 3.14 | Inconsistência: filtros URL vs local | Média | Sem padrão único. | `{veiculos,clientes,fornecedores,ordens,orcamentos}/*` |
| 3.15 | Lacuna: Drawer | Baixa | Drawer mobile inline em `app-shell`, não reutilizável. | `app-shell.tsx` |
| 3.16 | Lacuna: Command palette | Baixa | Sem cmd-k. | `shell/*` (ausente) |
| 3.17 | Lacuna: Confirm Dialog padronizado | Baixa | `ConfirmDialog` ok, mas wrappers de delete duplicam estado. | `ui/dialog.tsx` (wrappers duplicados) |
| 3.18 | Inconsistência: props de delete | Baixa | Variam nomes (`id` vs `veiculoId`), redirect e tratamento de erro. | `*-delete.tsx` |
| 3.19 | Lacuna: validation feedback | Baixa | Sem display de erro de campo padronizado (sem red border/help text). | `ui/*` (ausente) |

**Recomendações:** `GenericDeleteButton<T>`; `GenericSearch`/hook `useSearch`; `FilterTabs` genérico; **Toast** (provider + `useToast`); **Skeleton**; **Drawer** em `ui/`; **Tabs** genérico (composable); **Pagination**; **DataTable<T>**; **DropdownMenu** de ações; **DateField**; **CurrencyField**; mover **Modal** p/ `ui/modal.tsx`; **FormLayout/FormGroup**; padronizar delete (sucesso → refresh+redirect; erro → na descrição); padronizar busca (URL + debounce 300ms); **CommandPalette**; `GenericListLayout<T>`.

---

### Frente 4 — OS (Ordem de Serviço): Página de Detalhe e Componentes
**Fase associada:** Fase 3 (OS workspace).

**Estado atual:** `/painel/ordens-servico/[id]/page.tsx` (~400 linhas), layout 2/3 + 1/3 no desktop, **sem abas**. 9 Cards renderizados simultaneamente no SSR: fluxo de status, diagnóstico/valores, itens, horas, garantias, anexos, financeiro, cliente/veículo/mecânico, IA. Sem header sticky, sem lazy-load, sem tabs em URL, sem timeline.

**O que reaproveitar:** model `AuditLog` (schema) p/ timeline; `EmptyState`, `ConfirmDialog`, `Badge`/`StatusBadge`, `Table`+primitivos, `Card`, controles de form, helpers `formatDateTimeBR`/`formatBRL`/`formatDuracao`, `useRouter`/`useTransition`.

**Problemas:**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 4.1 | UX/Layout | Média | Scroll vertical excessivo (~3000–4000px desktop, mais em mobile) sem abas. | `ordens-servico/[id]/page.tsx` (todo) |
| 4.2 | UX/Navegação | Média | Sem tabs com URL (`?tab=...`) para agrupar seções / memória de navegação. | idem |
| 4.3 | UX/Contexto | Média | Header não-sticky; resumo (nº/status/cliente/veículo/placa/km/mecânico/previsão/total) some no scroll. | `page.tsx:150-163` |
| 4.4 | Feature gap | Baixa | Sem timeline/histórico (apesar de `AuditLog` no schema). | `page.tsx` |
| 4.5 | Feature gap | Baixa | Sem seção de Comunicação (só botão WhatsApp). | `page.tsx:383-391` |
| 4.6 | Feature gap | Baixa | Sem aba Checklist. | `page.tsx` |
| 4.7 | UX/Undo | Baixa | Remoção de item sem undo (delete imediato após confirmação). | `ordens/item-list.tsx:35-48` |
| 4.8 | UX/Performance | Baixa | Sem action bar sticky (Salvar / Iniciar-Parar somem no scroll). | `page.tsx` + `campos-form.tsx:164-171` |
| 4.9 | Feature gap | Muito baixa | "ENTREGUE" sem modal de confirmação com checklist. | `status-actions.tsx:88-109` |

**Recomendações:** abas com URL params; header sticky compacto (h-16); timeline via `AuditLog`; action bar sticky; undo ao remover item (toast desfazer 5–10s); aba Comunicação; confirmação de ENTREGUE com checklist; lazy-load de anexos via Suspense; `checklist-form.tsx` reutilizável.

---

### Frente 5 — Auditoria de Formulários (Forms)
**Fase associada:** Fase 2 (padrões de form) + transversal às fases 3–6.

**Estado atual:** 19 formulários. Zod server-side, máscaras BR, CVA buttons, Card sections, dois fluxos de estado (`useTransition` + `useActionState`), dois padrões de footer, múltiplas variantes de `FieldError`, inconsistências de obrigatoriedade/labels, sem aviso de alterações não salvas e sem auto-foco no 1º erro.

**O que reaproveitar:** `src/lib/masks.ts`; helper `FieldError` de `cliente-form.tsx`; `ui/button.tsx`; `ui/card.tsx`; padrões de lookup (`buscarCep`, `buscarCnpj`); honeypot + success de `site/agendar-form.tsx`; cascata cliente→veículo de `agendamento-form.tsx`; Zod + `parseFieldErrors` de `server/clientes.ts`.

**Problemas (seleção):**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 5.1 | Anti-spam/CSRF | Alta | Só `agendar-form.tsx` (site) tem honeypot; formulários do painel sem CSRF/proteção contra bot. | `site/agendar-form.tsx:230` vs `/painel/*` |
| 5.2 | FieldError inconsistente | Média | 6+ variantes (`{ msg }`, `{ message }`, `<p>`, `useFormStatus`). | múltiplos `*-form.tsx` |
| 5.3 | Loading do submit | Média | Mistura `useTransition`/`useActionState`; feedback visual inconsistente. | `veiculo-form.tsx:56`, `servico-form.tsx:46`, `cliente-form.tsx:71` |
| 5.4 | Sem aviso de alterações não salvas | Média | Nenhum form com `beforeunload`/dirty tracking. | todos (19) |
| 5.5 | Obrigatoriedade ambígua | Média | CPF/CNPJ, dataNascimento, e-mail opcionais sem indicação na label. | `cliente-form.tsx:313`, `clientes.ts:42/51` |
| 5.6 | Mensagens de validação genéricas | Média | "CPF inválido" sem distinguir formato vs dígito verificador. | `clientes.ts:84-86` |
| 5.7 | Required indicator inconsistente | Baixa | `Label required` não usado uniformemente. | `agendamento-form.tsx:97/147`, `os-form.tsx:66` |
| 5.8 | Footer inconsistente | Baixa | `CardFooter` vs `div flex justify-end`; posição de Cancelar varia. | múltiplos `*-form.tsx` |
| 5.9 | Sem auto-foco no 1º erro | Baixa | Foco não retorna ao campo inválido. | múltiplos |
| 5.10 | Posição de erro confusa | Baixa | Erro geral no topo + field errors inline. | `cliente-form.tsx:199` etc. |
| 5.11 | Placeholder de select inconsistente | Baixa | `—` vs `Selecione...` vs disabled. | múltiplos `*-form.tsx` |
| 5.12 | Datas ISO sem máscara BR | Baixa | `type=date` (YYYY-MM-DD) sem help text dd-MM-yyyy. | `cliente-form.tsx:316` etc. |
| 5.13 | Decimal sem máscara BRL realtime | Baixa | `type=number` step 0.01; máscara só na exibição. | `peca-form.tsx:158` etc. |
| 5.14 | Seções inconsistentes | Baixa | `<h3>` inline vs `CardHeader/CardTitle`. | `cliente-form.tsx:279` vs `orcamento-form.tsx:112` |
| 5.15 | maxLength/contador | Baixa | Inconsistente; sem contador de caracteres. | `servico-form.tsx:189` vs `cliente-form.tsx:404` |
| 5.16 | Feedback de sucesso | Baixa | Site mostra card de sucesso; painel redireciona silencioso. | `agendar-form.tsx:191` vs internos |
| 5.17 | Cascata sem feedback | Baixa | Reset de veículo ao trocar cliente sem aviso. | `agendamento-form.tsx:104` etc. |
| 5.18 | Lookups sem padrão único | Baixa | CEP/CNPJ/FIPE preenchem de formas diferentes. | `cliente-form.tsx:94` etc. |
| 5.19 | Double submit | Baixa | `disabled` ok, mas sem feedback visual claro. | todos |

**Recomendações:** `FormFieldError`; `FormFooter` (Cancelar à esquerda, principal à direita); `FormSection`; validação frontend de placa/CEP; `DirtyFormWrapper`; auto-foco no 1º `aria-invalid`; placeholder único; spinner no submit; contador de caracteres; help text de data; **CSRF em todos os forms do painel**; `FormError` com ícone; ordem de tabulação revisada; sucesso com toast; aria-required/aria-invalid/aria-describedby; cascata com aviso; reset CPF↔CNPJ no toggle tipoPessoa; documentar padrão de forms.

---

### Frente 6 — Tabelas/Listas e Ações Destrutivas
**Fase associada:** Fase 2 (DataTable, paginação, RowActions) + transversal às listas das fases 3–4.

**Estado atual:** 10+ páginas de listagem com `Table`+primitivos (`overflow-x-auto`), `StatusBadge` consistente, filtros/busca em ~90% (URL params ou estado local), `EmptyState` com CTA, `ConfirmDialog` para ações destrutivas. **Sem paginação** (hardcoded `take:200` em ordens), **sem responsividade real** em tabelas (overflow horizontal em mobile), sem skeleton/loading.

**O que reaproveitar:** `ui/table.tsx`, `ui/status-badge.tsx` (+`resolveStatus`), `ui/dialog.tsx` (enriquecer com `consequenceItems?`), `ui/empty-state.tsx`, padrão `VeiculosList`/`OrcamentosList`/`PecasList` (filtro local + normalização de acentos), `ClientesSearch`/`OSFilters`/`ServicoFiltros` (filtros server-side), `ContasPagarList` (CRUD inline completo com Modal + ConfirmDialog + Toast), Agenda `ListaView` (card grid responsivo), `server/estoque.ts` + `server/financeiro.ts`.

**Problemas:**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 6.1 | Responsividade | Alta | `overflow-x-auto` sem fallback p/ cards; alvos de ação minúsculos (`h-4 w-4`); buscas só parcialmente responsivas. | `ui/table.tsx:6`, `pecas-list.tsx:159-174` |
| 6.2 | Ações destrutivas sem contexto | Média | ConfirmDialog mostra só nome; sem qtd/valor/referências/cascata. | `estoque/delete-peca-button.tsx:54`, `cliente-delete.tsx` |
| 6.3 | Sem paginação | Média | `take:200` hardcoded em ordens; sem cursor/offset; sem contador total. | `ordens-servico/page.tsx:61`, `clientes/page.tsx`, `estoque/page.tsx` |
| 6.4 | Menu de ações inconsistente | Média | 2/3 ícones soltos vs clique na linha; sem dropdown. | `pecas-list.tsx`, `servicos/page.tsx`, `contas-pagar-list.tsx` |
| 6.5 | Feedback assíncrono | Baixa | Delete via `router.refresh()` silencioso; sem toast de sucesso/erro (exceto ContasPagar). | `delete-peca-button.tsx:24-30` |
| 6.6 | Filtros sem "Limpar" | Baixa | `OSFilters`/`OrcamentosList` sem botão limpar tudo. | `os-filters.tsx`, `orcamentos-list.tsx` |
| 6.7 | Sem contagem de resultados | Baixa | Só Agenda mostra contagem por dia. | `agenda/page.tsx:531-533` (bom exemplo) |
| 6.8 | Badges hardcoded | Baixa | Estoque/serviços/contas usam variant direto, não `StatusBadge`. | `pecas-list.tsx:148-153` etc. |
| 6.9 | Sem skeleton | Baixa | SSR sem Suspense/fallback. | `clientes/page.tsx`, `estoque/page.tsx` |

**Recomendações:** `DataTable` responsiva (tabela desktop / cards mobile); ConfirmDialog enriquecido com impacto/cascata; paginação Prisma (cursor/offset) + componente `Pagination` + "Mostrando X de Y"; `RowActions` (kebab `⋮`); toast de feedback; "Limpar filtros"; contador de resultados; expandir `StatusBadge` p/ novos domínios; Suspense + `SkeletonTable`; `ListPage` wrapper; considerar virtualization p/ listas muito grandes.

---

### Frente 7 — Dashboard
**Fase associada:** Fase 3 (analytics/visualização e priorização).

**Estado atual:** `painel/page.tsx` + `server/dashboard.ts` + `dashboard/*`. 8 stat-cards, gráfico de faturamento 6 meses, próximas entregas (top 5), alertas de estoque (top 8), aniversariantes, revisões pendentes. 6 queries paralelas (`Promise.all`). Grid responsivo. **Sem restrição de papel** (qualquer autenticado acessa).

**O que reaproveitar:** `getDashboardStats`/`getFaturamento.../getProximasEntregas/...`, `StatCard`, `FaturamentoChart`, `EmptyState` (não usado no chart vazio).

**Problemas:**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 7.1 | Faltam widgets acionáveis | Alta | Sem "OS atrasadas", "aguardando peças", "aguardando diagnóstico", "orçamentos p/ revisar", faturamento de hoje vs meta. | `server/dashboard.ts`, `painel/page.tsx:73-130` |
| 7.2 | Próximas entregas sem atraso | Média | Não destaca `previsaoEntrega < hoje` nem "dias até entrega". | `proximas-entregas-list.tsx`, `dashboard.ts:149-178` |
| 7.3 | Gráfico sem período flexível | Média | 6 meses fixo; estado vazio sem EmptyState; sem alerta de queda MoM. | `faturamento-chart.tsx:25-35` |
| 7.4 | Sem ranking por criticidade | Média | Estoque ASC por qtd; zerados não priorizados; `estoqueMinimo: { gt: 0 }` exclui críticos sem mínimo. | `dashboard.ts:230-254` |
| 7.5 | Sem filtro por papel | Média | Sem "minhas OS"/"minha carteira"; sem comissão do mecânico. | `painel/page.tsx:42-60` |
| 7.6 | Estatísticas decorativas | Média | Ticket médio fixo; receita sem descontar devoluções; sem taxa de conversão. | `dashboard.ts:49-114` |
| 7.7 | Tooltips do chart | Baixa | Sem comparação MoM/%/legenda; eixo sem zero visível. | `faturamento-chart.tsx:58-69` |
| 7.8 | Sem auto-refresh | Baixa | `dynamic=true` mas sem polling/WS. | `painel/page.tsx:40` |
| 7.9 | Cores do chart em dark | Baixa | Sem teste explícito de contraste AA. | `faturamento-chart.tsx`, `globals.css:30-55` |
| 7.10 | Peças sem mínimo não alertam | Baixa | Filtro `estoqueMinimo { gt: 0 }` esconde zerados sem mínimo. | `dashboard.ts:232-233` |

**Recomendações:** 3 stat-cards de urgência (OS atrasadas / aguardando peças / orçamentos a revisar) com tons warn/danger; coluna "dias até entrega" com badge de urgência e ordenação; `EmptyState` no chart + período 3/6/12 meses; priorizar zerados nos alertas; contexto por papel (`userId`/`role` em `getDashboardStats`); transformar estatísticas (ticket 30d, meta vs realizado, taxa de confirmação); legenda + % MoM; auto-refresh (SWR/polling); verificar contraste do tooltip; flag de monitoramento de estoque.

---

### Frente 8 — Site Público e SEO
**Fase associada:** Fase 6 (site público/agendamento/confiança/mobile).

**Estado atual:** 5 páginas (Início, Sobre, Serviços, Acessórios, Contato/Agendar). Header com logo/nav/CTA/tema; hero com imagem real; cards de serviços/acessórios; footer 3 colunas; formulário de agendamento multi-step com date picker, slots, validação client+server, honeypot, rate-limit por IP, consentimento LGPD, máscaras. Responsivo (hamburger mobile). Metatags básicas por página. Favicon/PWA configurados. Build verde.

**O que reaproveitar:** `site-header.tsx`, `site-footer.tsx`, `agendar-form.tsx`, `foto-carousel.tsx`, `(site)/layout.tsx`, `site-data.ts`, `lib/masks.ts`, `lib/whatsapp.ts (waLink)`.

**Problemas:**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 8.1 | SEO estruturado | Alta | Sem JSON-LD `LocalBusiness` (nome/endereço/telefone/horários/coords). | `(site)/page.tsx`, `(site)/contato/page.tsx` |
| 8.2 | Open Graph / Twitter | Alta | Sem `og:*`/Twitter Card; sem preview ao compartilhar. | `(site)/layout.tsx` |
| 8.3 | Sitemap / Robots | Média | Sem `sitemap.ts` nem `robots.ts`. **Verificado** (ausentes). | `src/app` |
| 8.4 | Metatags por página | Média | Faltam canonical e metatags avançadas em secundárias. | `servicos/page.tsx:11`, `sobre:18`, `acessorios:10` |
| 8.5 | WhatsApp sticky mobile | Média | CTA WhatsApp só na página de contato. | `site-header.tsx` |
| 8.6 | Slots sem sugestão | Baixa | "Nenhum horário livre" sem sugerir próxima data com vaga. | `agendar-form.tsx:286-295` |
| 8.7 | Alt de imagens | Baixa | Logo com alt genérico; carrossel nem sempre preenchido. | `site-header.tsx:39`, `foto-carousel.tsx:32` |
| 8.8 | Scroll horizontal <320px | Baixa | Possível overflow em breakpoints muito pequenos. | `servicos:79`, `acessorios:69`, `sobre:148` |
| 8.9 | Race condition de slot | Baixa | Tratada, mas sem retry suave/reselect. | `agendar-form.tsx:166-171` |

**Recomendações:** JSON-LD `LocalBusiness` (com `foundingDate=1988`); Open Graph + Twitter Card (`og:image` 1200×630); `sitemap.ts` + `robots.ts`; canonical por página; `FloatingWhatsApp` sticky mobile; sugerir próxima data com vaga; melhorar alt text; testar <375px; retry inteligente de slot; breadcrumb schema nas secundárias.

---

### Frente 9 — Módulo Assistente IA (Markdown, Componentes, Confiança, Integração)
**Fase associada:** Fase 5 (IA + markdown seguro).

**Estado atual:** Assistente funcional e seguro na renderização. Núcleo tipado em `src/lib/ai/` (`generateCustomerMessage`, `summarizeServiceOrder`, `suggestMaintenance`, `explainQuote`, `summarizeInspection`); componentes reutilizáveis em `assistente/` (`Markdown`, `ResultBox`, `Chat`, `QuickActions`, `ActionModal`); integração contextual em OS/orçamentos/checklists via server actions; chat global em `/painel/assistente` (sugestões, histórico 12 msgs, rate limit 20/min); logging em `AiInteraction`.

**O que reaproveitar:** `Markdown.tsx` (renderer seguro sem `dangerouslySetInnerHTML`), `ResultBox.tsx` (copiar + feedback), `ActionModal.tsx`, prompts em `lib/ai/prompts.ts` (5 system prompts pt-BR anti-alucinação), funções tipadas em `lib/ai/index.ts` (com fallbacks + logging), `getWorkshopContext`, `server/assistente-actions.ts`.

**Problemas:**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 9.1 | Inconsistência de renderização | Média | Contextos OS/checklists/orçamentos usam `whitespace-pre-wrap` em vez do `Markdown` reutilizável. | `ordens/ai-buttons.tsx:76`, `checklists/resumo-ia.tsx:34`, `orcamentos/explicar-ia.tsx:62` |
| 9.2 | Ações ausentes nos contextos | Média | Só `ResultBox` (quick-actions) tem copiar; contextos sem copiar/regenerar/editar/salvar. | `result-box.tsx`, `ai-buttons.tsx`, `resumo-ia.tsx` |
| 9.3 | Labeling de confiança | Baixa | Labels genéricos; sem modelo usado / aviso de modo demonstração. | `result-box.tsx:25`, `ai-buttons.tsx:74`, `api/assistente/route.ts:69` |
| 9.4 | Recuperação de erro | Baixa | Sem botão "Tentar novamente" nos contextos. | `ai-buttons.tsx:60`, `resumo-ia.tsx:44`, `explicar-ia.tsx` |
| 9.5 | Ponto de integração perdido | Baixa | `resumirOSComIA` não reusa `generateCustomerMessage` para mensagem ao cliente. | `lib/ai/index.ts:290`, `server/ordens.ts` |

**Recomendações:** `MarkdownResult` (Markdown + label + ações copiar/regenerar/salvar) reutilizável; ações contextuais (Salvar na OS/Checklist/Orçamento, Copiar p/ WhatsApp); labeling de confiança (badge do modelo / modo demonstração / link p/ auditoria); retry explícito; documentar padrão anti-alucinação + testes com input vazio; action "Gerar WhatsApp" via `generateCustomerMessage` quando status concluído.

---

### Frente 10 — Acessibilidade (WCAG 2.2 AA) e Responsividade
**Fase associada:** Fase 7 (a11y/performance/testes/docs), transversal a todas.

**Estado atual:** Base forte (tema automático, layout responsivo Tailwind, componentes semânticos, várias labels acessíveis). Sem erros críticos óbvios, mas violações menores de contraste, semântica e foco trapeado.

**O que reaproveitar:** util `text-foreground-secondary` (a criar), `ButtonIconOnly` (min 40×40), hook `useDialogFocusTrap`, classe `sr-only-focus` p/ skip link, wrapper `@media prefers-reduced-motion`, util `contrastChecker`, `BadgeAccessible` (ícone + texto).

**Problemas:**

| # | Tipo | Sev. | Descrição | Local |
|---|---|---|---|---|
| 10.1 | Contraste | Média | `text-muted` (~3.2:1 em light) abaixo de 4.5:1. | `globals.css:11,38` + usos de `text-muted` |
| 10.2 | Alvo de toque | Média | Botões icon-only <40×40 (h-7/h-8/h-9). | `dialog.tsx:61`, `theme-toggle.tsx:50-52`, `button.tsx:20`, `foto-carousel.tsx:75` |
| 10.3 | Sem focus trap (dialog) | Média | `ConfirmDialog` sem trap de Tab/Shift+Tab. | `ui/dialog.tsx:32-100` |
| 10.4 | Sem focus trap (drawer) | Média | Drawer mobile não prende foco. | `app-shell.tsx:128-153` |
| 10.5 | Badge fonte crítica | Baixa | `text-[11px]` (~8.8pt). **Verificado** (`badge.tsx:6`). | `ui/badge.tsx:6` |
| 10.6 | Espaçamento mobile | Baixa | Hero `py-20` excessivo em 360px; sem escala. | `(site)/page.tsx:84` |
| 10.7 | Overflow de tabela | Baixa | `<TH>` sem `scope`/`aria-label`/`caption`. | múltiplas páginas painel |
| 10.8 | Status só por cor | Baixa | Alguns estados de erro/sucesso só com cor, sem ícone. | `veiculo-form.tsx`, `agendar-form.tsx:224-227` |
| 10.9 | Focus ring fraco | Baixa | `ring-accent/40` sutil em fundo claro. | `button.tsx:6`, `input.tsx:17` |
| 10.10 | Sem skip link | Baixa | App-shell e site-header sem "pular p/ conteúdo". | `app-shell.tsx`, `site-header.tsx` |
| 10.11 | Sem prefers-reduced-motion | Baixa | Animações sem opt-out. | `globals.css:264-274` |
| 10.12 | Date input mobile | Baixa | `type=date` sem max-width responsivo. | `agendar-form.tsx:254-264` |
| 10.13 | 100vh em chat | Baixa | `h-[calc(100vh-13rem)]` pode cortar com teclado on-screen. | `assistente/chat.tsx` |
| 10.14 | Iframe/embeds | Info | Nenhum encontrado; verificar mapa no footer se adicionado. | — |

**Recomendações:** elevar `--muted` (≈`#3d4148` light / `#7a8085` dark) p/ 4.5:1; icon-buttons ≥40×40 (44×44 AAA); `useDialogFocusTrap` em ConfirmDialog/ActionModal/drawer; `Badge` p/ `text-xs`; padding responsivo no hero; `scope`/`caption` em tabelas; ícone diferenciador + `aria-live` em estados; focus ring mais forte (`ring-offset-2` + opacidade ≥60%); skip link `sr-only focus:not-sr-only`; envolver keyframes em `@media (prefers-reduced-motion: no-preference)`; `max-w-xs` no date input; `100dvh` com fallback; `aria-label` em todos icon-buttons; auditar contraste light/dark com WebAIM/Deque.

---

## 4. Componentes Reutilizáveis Existentes (consolidado)

**`src/components/ui/`**
- `Button` — 5 variantes (primary/secondary/outline/ghost/danger) + 4 sizes (sm/md/lg/icon).
- `Badge` — 7 variantes (default/accent/success/warning/danger/info/outline).
- `Card` — `Card`/`CardHeader`/`CardTitle`/`CardBody`/`CardFooter` (composição).
- `ConfirmDialog` (`dialog.tsx`) — variant, loading, labels custom.
- `EmptyState` — icon/title/message/action (usado em 9+ listas).
- `Table` — `Table`/`THead`/`TBody`/`TR`/`TH`/`TD` (primitivos).
- `Input` / `Select` / `Textarea` / `Label` — densidades sm/md.
- `PageHeader` — icon/title/description/action.
- `StatCard` — label/value/icon/hint/tone.
- `StatusBadge` — 5 domínios (`os`/`orcamento`/`agendamento`/`pagamento`/`inspecao`) + `resolveStatus`.

**Fora de `ui/` (candidatos a promover):**
- `financeiro/modal.tsx` — Modal genérico (deveria ir p/ `ui/modal.tsx`).
- `configuracoes/tabs.tsx` — `ConfiguracoesTabs` (hardcoded; base p/ Tabs genérico).
- `financeiro/nav.tsx` — padrão de subnav com abas.
- `shell/theme-toggle.tsx`, `shell/app-shell.tsx` (drawer inline a extrair).
- `assistente/Markdown.tsx`, `ResultBox.tsx`, `ActionModal.tsx`, `QuickActions.tsx`.
- `site/foto-carousel.tsx`, `site/site-header.tsx`, `site/site-footer.tsx`, `site/agendar-form.tsx`.

**Bibliotecas / helpers:**
- `src/lib/masks.ts` (CPF/CNPJ/telefone/CEP/placa + validadores).
- `src/lib/whatsapp.ts` (`waLink`).
- helpers `formatBRL`, `formatDateTimeBR`, `formatDuracao`.
- `src/lib/ai/*` (prompts pt-BR anti-alucinação, funções tipadas com fallback/logging, `getWorkshopContext`).
- `src/server/*` (actions com retorno `{ ok, error? }`, Zod + `parseFieldErrors`).
- `src/components/relatorios/chart-theme.ts` (`CHART_COLORS`, `CHART_PALETTE`).

---

## 5. Padrões DUPLICADOS a Unificar

| Padrão duplicado | Variações | Ação de unificação |
|---|---|---|
| Delete dialogs | 6 (`veiculo`/`fornecedor`/`cliente`/`garantia`/`servico`/`anexo`) | `GenericDeleteButton<T>` (estado open/error/pending + ConfirmDialog) |
| Busca | 2 (local `useMemo` vs URL params + debounce) | `GenericSearch` / hook `useSearch(local?)`, padrão URL + debounce 300ms |
| Filtros | 5 (`avisos`/`ordens`/`pagamentos`/`agenda`/`servicos`) | `FilterTabs` genérico (modos link/select/button + counts) |
| Tabelas/listas | cada lista monta Table manualmente | `DataTable<T>` (colunas/sort/seleção/sticky/responsivo) + `ListPage` wrapper |
| Modal | só em `financeiro/modal.tsx` | mover p/ `ui/modal.tsx` e usar globalmente |
| Tabs | `ConfiguracoesTabs` hardcoded | `Tabs` composable (`Tabs/TabsList/TabsTrigger/TabsContent`) |
| FieldError | 6+ variantes | `FormFieldError` único |
| Footer de form | `CardFooter` vs `div justify-end` | `FormFooter` padronizado |
| Seções de form | `<h3>` inline vs `CardHeader` | `FormSection`/`FormGroup` |
| Renderização IA | `whitespace-pre-wrap` vs `Markdown` | `MarkdownResult` reutilizável |
| Ações por linha | ícones soltos vs clique na linha | `RowActions` (kebab `⋮`) |
| Estados de submit | `useTransition` vs `useActionState` | convergir + spinner no botão |
| Feedback de ação | `router.refresh()` silencioso vs toast | Toast global padrão |

---

## 6. Problemas de Acessibilidade (consolidado)

| Sev. | Problema | Onde |
|---|---|---|
| Média | Contraste de `text-muted` <4.5:1 | `globals.css:11,38` |
| Média | Alvos de toque <40×40 (icon-only) | `dialog.tsx:61`, `theme-toggle.tsx`, `button.tsx:20`, `foto-carousel.tsx` |
| Média | Sem focus trap em ConfirmDialog | `ui/dialog.tsx` |
| Média | Sem focus trap em drawer mobile | `app-shell.tsx:128-153` |
| Média | Focus ring inconsistente (`focus:ring` vs `focus-visible:ring`) | `button.tsx:6` vs `input/select/textarea.tsx` |
| Baixa | Badge `text-[11px]` (~8.8pt) | `badge.tsx:6` |
| Baixa | Tabelas sem `scope`/`caption`/`aria-label` | múltiplas páginas painel |
| Baixa | Status só por cor (sem ícone) | `veiculo-form.tsx`, `agendar-form.tsx:224-227` |
| Baixa | Focus ring fraco em fundo claro | `button.tsx:6`, `input.tsx:17` |
| Baixa | Sem skip link | `app-shell.tsx`, `site-header.tsx` |
| Baixa | Sem `prefers-reduced-motion` | `globals.css:264-274` |
| Baixa | Date input sem max-width mobile | `agendar-form.tsx:254-264` |
| Baixa | `100vh` em chat com teclado on-screen | `assistente/chat.tsx` |
| Baixa | Alt de imagens genérico/ausente | `site-header.tsx:39`, `foto-carousel.tsx:32` |

---

## 7. Problemas de Layout / Responsividade (consolidado)

| Sev. | Problema | Onde |
|---|---|---|
| Alta | Tabelas com `overflow-x-auto` sem fallback p/ cards em mobile | `ui/table.tsx:6`, múltiplas listas |
| Média | Responsivo tablet: sidebar só `lg:`; tablet força drawer mobile | `app-shell.tsx` |
| Média | OS detail: scroll vertical excessivo sem abas/sticky | `ordens-servico/[id]/page.tsx` |
| Média | WhatsApp sticky ausente no mobile (site) | `site-header.tsx` |
| Baixa | Hero `py-20` excessivo em 360px | `(site)/page.tsx:84` |
| Baixa | Possível overflow horizontal <320px em cards/timeline | `servicos:79`, `acessorios:69`, `sobre:148` |
| Baixa | Date input nativo sem ajuste responsivo | `agendar-form.tsx:254-264` |
| Baixa | Buscas/filtros parcialmente responsivos | `pagamentos`, `fornecedores`, `servicos`, `contas-pagar` |

---

## 8. Plano de Implementação Faseado (7 fases)

> Princípio transversal: **NÃO alterar lógica de negócio** — server actions (`src/server/*`), schemas Zod, queries Prisma, regras de status, cálculos financeiros, engine de slots e prompts de IA permanecem intactos. O trabalho é de **apresentação, consolidação de componentes e qualidade (a11y/responsivo/SEO)**. Cada fase deve registrar resultados no `UI_UX_CHANGELOG.md`.

### Fase 1 — Tokens, Tipografia e Estados
**Objetivo:** firmar a fundação visual e os estados base antes de tocar telas.
**Tarefas:**
- Alinhar focus em `Input`/`Select`/`Textarea` para `focus-visible:ring` (igual a `Button`).
- Criar aliases de token `text-primary/secondary/tertiary` em `@theme`.
- Elevar mínimo operacional para `text-sm`; `Badge` de `text-[11px]` → `text-xs`.
- Centralizar paleta de status em `src/lib/theme-constants.ts`.
- Ajustar `--muted` para atingir 4.5:1 (light/dark); reforçar focus ring; `@media (prefers-reduced-motion)`.
- Testar contraste das cores do `CHART_PALETTE` em dark.
**Arquivos afetados:** `src/app/globals.css`, `src/components/ui/{input,select,textarea,badge,button}.tsx`, `src/components/relatorios/chart-theme.ts`, novo `src/lib/theme-constants.ts`.
**NÃO mudar:** valores semânticos que quebrem identidade da marca (manter verde accent), lógica de tema (`data-theme`).

### Fase 2 — Navegação, Headers, Tabelas, Forms, Dialogs e Shell Responsivo
**Objetivo:** consolidar padrões transversais e a navegação.
**Tarefas:**
- Refatorar `NAV` plano → `NavGroup[]` (Operação/Relacionamento/Comercial/Estoque/Financeiro/Gestão/Inteligência/Sistema), com destaque de grupo ativo e tooltips em colapso.
- Breakpoint `md:` p/ sidebar em tablet; extrair `Drawer` p/ `ui/`; skip link no shell e no site-header; focus trap em drawer.
- Estender `PageHeader` com breadcrumbs.
- Criar `DataTable<T>`, `Pagination`, `RowActions`, `Toast` (provider + `useToast`), `Skeleton`, `Tabs` genérico; mover `Modal` p/ `ui/`.
- `GenericDeleteButton<T>`, `GenericSearch`/`useSearch`, `FilterTabs`, `ListPage`.
- `FormFieldError`, `FormFooter`, `FormSection`/`FormGroup`; placeholder de select único; spinner no submit; auto-foco no 1º erro; aria-required/invalid/describedby; aviso de alterações não salvas; CSRF nos forms do painel.
- Focus trap em `ConfirmDialog`; alvos de toque ≥40×40 em icon-buttons; `scope`/`caption` em tabelas.
**Arquivos afetados:** `src/components/shell/app-shell.tsx`, `src/components/ui/*` (novos: `data-table`, `pagination`, `toast`, `skeleton`, `tabs`, `drawer`, `modal`, `row-actions`, `form-field-error`, `form-footer`, `form-section`), `src/components/ui/{page-header,dialog,table}.tsx`, todos os `*-delete.tsx`, `*-search`/`*-filtros`, formulários.
**NÃO mudar:** rotas/hrefs existentes (só reagrupar), server actions de delete/busca/filtro, validação Zod.

### Fase 3 — OS Workspace, Clientes, Veículos, Agenda, Mecânico (+ Dashboard)
**Objetivo:** aplicar os novos padrões nas telas operacionais centrais.
**Tarefas:**
- OS detail: abas com URL (`?tab=`), header sticky compacto, action bar sticky, timeline via `AuditLog`, undo de item (toast), confirmação de ENTREGUE com checklist, lazy-load de anexos.
- Clientes/Veículos: migrar listas p/ `DataTable` + paginação + `RowActions` + busca unificada; aplicar `GenericDeleteButton`.
- Agenda: padronizar filtros (`FilterTabs`); reaproveitar `ListaView` como referência de card responsivo.
- Dashboard: stat-cards de urgência, "dias até entrega", `EmptyState` no chart, priorização de estoque crítico, contexto por papel (parâmetro `userId/role`).
**Arquivos afetados:** `ordens-servico/[id]/page.tsx` + `components/ordens/*`, `clientes/*`, `veiculos/*`, `agenda/*`, `painel/page.tsx` + `server/dashboard.ts` + `dashboard/*`.
**NÃO mudar:** transições de status da OS, cálculos de total/horas, engine de disponibilidade da agenda, queries de dados (apenas adicionar parâmetros opcionais de filtro/role sem quebrar chamadas existentes).

### Fase 4 — Estoque, Pagamentos, Finanças, Fornecedores, Relatórios
**Objetivo:** estender padrões aos módulos de gestão/financeiro.
**Tarefas:**
- Migrar listas (`PecasList`, `ContasPagarList`, `ContasReceberList`, fornecedores, relatórios) p/ `DataTable` + paginação + `RowActions`.
- Substituir badges hardcoded por `StatusBadge` com novos domínios (servico/estoque-nivel).
- ConfirmDialog enriquecido (impacto/cascata) em deletes de peças/fornecedores.
- `CurrencyField` + `DateField` nos forms financeiros; toast em todas as ações.
- Relatórios: revisar contraste de `CHART_PALETTE` em dark; `EmptyState` em gráficos vazios.
**Arquivos afetados:** `components/estoque/*`, `components/pagamentos/*`, `components/financeiro/*`, `components/fornecedores/*`, `components/relatorios/*` + `chart-theme.ts`, `ui/status-badge.tsx`, novos `ui/{currency-field,date-field}.tsx`.
**NÃO mudar:** `server/estoque.ts`/`server/financeiro.ts` (lógica de giro, contas, alternância de pagamento), cálculos de relatório.

### Fase 5 — IA + Markdown Seguro
**Objetivo:** unificar renderização e ações da IA mantendo segurança.
**Tarefas:**
- **Corrigir `getModel()`** fallback p/ `gpt-4o-mini` em `src/lib/ai/client.ts:21`; validar `OPENAI_API_KEY`.
- Criar `MarkdownResult` (Markdown + label + ações copiar/regenerar/salvar) e aplicar em `ai-buttons`, `resumo-ia`, `explicar-ia` (substituir `whitespace-pre-wrap`).
- Ações contextuais (Salvar na entidade, Copiar p/ WhatsApp); badge de modelo/modo demonstração; botão "Tentar novamente".
- Expor ações rápidas em command palette / assistente sempre acessível (drawer).
- Action "Gerar WhatsApp" via `generateCustomerMessage` em status concluído.
**Arquivos afetados:** `src/lib/ai/client.ts`, `components/assistente/*` (novo `markdown-result.tsx`), `components/ordens/ai-buttons.tsx`, `components/checklists/resumo-ia.tsx`, `components/orcamentos/explicar-ia.tsx`.
**NÃO mudar:** prompts (`lib/ai/prompts.ts`), regras anti-alucinação, logging em `AiInteraction`, rate limit, contrato das funções tipadas (`lib/ai/index.ts`).

### Fase 6 — Site Público, Agendamento, Confiança e Mobile
**Objetivo:** SEO, compartilhamento social e conversão mobile.
**Tarefas:**
- JSON-LD `LocalBusiness` (homepage/contato) + breadcrumb schema nas secundárias.
- Open Graph + Twitter Card em `(site)/layout.tsx` (`og:image` 1200×630).
- `src/app/sitemap.ts` e `src/app/robots.ts`; canonical por página.
- `FloatingWhatsApp` sticky mobile (reusar `waLink`).
- Agendamento: sugerir próxima data com vaga; retry suave em race de slot; melhorar alt text; testar <375px.
- Hero com padding responsivo (`py-8 sm:py-16 md:py-20`).
**Arquivos afetados:** `src/app/(site)/*`, `src/components/site/*`, novos `src/app/{sitemap,robots}.ts`, `src/app/(site)/layout.tsx`.
**NÃO mudar:** `api/agendar/slots`, validação/honeypot/rate-limit/LGPD do `agendar-form`, `site-data.ts` (apenas consumir).

### Fase 7 — Dark Mode, Acessibilidade, Performance, Testes e Docs
**Objetivo:** fechar qualidade e travar regressões.
**Tarefas:**
- Auditoria final de contraste (light/dark) com WebAIM/Deque; ajustes residuais.
- Garantir focus trap em todos os modais/drawer; skip links; `aria-label` em todos icon-buttons; `prefers-reduced-motion` aplicado globalmente.
- `100dvh` com fallback em layouts height-constrained (chat).
- Performance: Suspense/Skeleton em listas pesadas; lazy-load de imagens; revisar `take` hardcoded.
- Testes: a11y (axe), responsivos (375/768/1024), Lighthouse (SEO/contraste); util `contrastChecker` em pré-commit (opcional).
- Documentação: `FORM_PATTERNS.md` (guia de novos forms), atualização do `README`/`CLAUDE.md` com padrões; preencher `UI_UX_CHANGELOG.md` por fase.
**Arquivos afetados:** `src/app/globals.css`, `ui/*` residual, `components/shell/*`, `components/assistente/chat.tsx`, docs.
**NÃO mudar:** comportamento funcional; testes devem validar o existente, não redefinir regras.

---

## 9. Decisões Assumidas (defaults)

1. **Sem reescrita:** evoluir o design system existente (Tailwind v4 + CVA), não migrar para outra lib (ex.: shadcn completo) — reaproveitar `ui/*`.
2. **Tema escuro permanece cinza profundo** (`#0e0f11`), não preto puro.
3. **Verde accent preservado** como cor de marca (`#00a651`/`#2ec46b`).
4. **Lógica de negócio congelada:** server actions, Zod, Prisma queries e engine de slots não mudam de comportamento.
5. **Modelo IA fallback** padronizado para `gpt-4o-mini` (substituindo `gpt-5.4-mini` inexistente); `OPENAI_MODEL` continua tendo prioridade.
6. **Busca/filtros** convergem para URL params + debounce 300ms (memória/compartilhável).
7. **Acessibilidade alvo:** WCAG 2.2 **AA** (AAA onde for barato, ex.: alvos 44×44).
8. **Paginação** default de página inicial sugerida (ex.: 25/50) sem remover o limite seguro existente.

## 10. Riscos de Regressão a Vigiar

| Risco | Mitigação |
|---|---|
| Reagrupar NAV quebrar links/estado ativo | Manter hrefs idênticos; testar `isActive` por grupo e item. |
| Migração para `DataTable` alterar colunas/ordenação esperadas | Migrar lista por lista; snapshot visual antes/depois. |
| Focus trap quebrar fechar por Escape/overlay | Preservar handlers existentes de `ConfirmDialog`/drawer. |
| Mudança de tokens de contraste afetar capturas/identidade | Ajustar `--muted`/ring sem alterar accent; revisar dark + light. |
| Correção do modelo IA mascarar erro real (sem API key) | Validar `OPENAI_API_KEY` e manter modo demonstração explícito. |
| Toast global concorrer com toasts locais (ContasPagar) | Unificar em um provider único; remover toasts ad-hoc. |
| `CurrencyField`/`DateField` alterarem formato enviado ao server | Manter valor submetido idêntico ao atual (máscara só na UI). |
| SEO/OG/sitemap apontarem URLs erradas em produção | Derivar base URL de env; revisar canonical. |
| Paginação ocultar registros (ex.: ordens > página) | Exibir total e "carregar mais"; nunca silenciar dados. |
| `prefers-reduced-motion` desativar animações essenciais | Reduzir, não remover indicadores de loading necessários. |

---

> **Próximo passo:** iniciar a Fase 1 e registrar cada entrega no `UI_UX_CHANGELOG.md`.
