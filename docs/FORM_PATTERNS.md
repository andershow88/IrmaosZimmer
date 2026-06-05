# Padrões de UI, Formulários e Acessibilidade — ZimmerOS AI

Guia prático para criar **novas telas, listas e formulários** mantendo o padrão
consolidado no refactor de UI/UX (Fases 1–7). Reuse os primitivos de
`src/components/ui/` antes de criar algo novo.

> Referência viva: veja `clientes-table.tsx` (lista), `peca-form.tsx` /
> `conta-pagar-form.tsx` (formulários), `cliente-acoes.tsx` (delete) como modelos.

---

## 1. Primitivos disponíveis (`src/components/ui/`)

| Necessidade | Use |
| --- | --- |
| Lista/tabela | `DataTable` (+ `Pagination`, `dropdown-menu` → `RowActions`) |
| Busca | `SearchInput` + hook `lib/use-list-controls` (busca em `?q=` + paginação) |
| Filtros | `FilterBar` + `Select`/`Tabs` que empurram params próprios na URL |
| Campos | `Input`, `Select`, `Textarea`, `Label`, `CurrencyField`, `DateField` |
| Status | `StatusBadge` (`kind`: os, orcamento, agendamento, pagamento, inspecao, servico, estoque, conta_pagar, conta_receber) |
| Diálogos | `Modal`, `ConfirmDialog` (ambos com focus trap) |
| Feedback | `toast()`, `Skeleton`, `Spinner`, `EmptyState`, `ErrorState` |
| IA | `MarkdownResult` (render Markdown seguro + ações), `AiBadge` |

---

## 2. Formulários

- **Mutação via Server Action** em `src/server/<modulo>.ts`. Valide com **Zod no
  servidor** (nunca confie só no cliente). O componente envia `FormData`.
- **Moeda:** use `<CurrencyField name="valor" defaultValue={...} required />`.
  Ele exibe `R$ 1.234,56` e submete `"1234.56"` (decimal com ponto) — compatível
  com `z.coerce.number()`. **Não** use em campos inteiros nem onde o servidor faça
  parse BRL próprio (ex.: serviços).
- **Data:** use `<DateField name="vencimento" defaultValue={...} />` (semântica
  `yyyy-mm-dd` idêntica ao `input[type=date]`).
- **Feedback obrigatório:** após `res.ok`, dispare
  `toast({ title: "...", variant: "success" })`; em erro,
  `toast({ title: "...", description: res.error, variant: "error" })`.
  Em forms com redirect no servidor, exiba o erro inline (sem toast duplicado).
- **Erro inline:** `<p role="alert" className="text-sm font-medium text-danger">`.

## 3. Listas

- Página (Server Component) lê `searchParams` (`?q=`), filtra no Prisma (`where`
  com `OR`/`contains`) e passa `rows` + `initialQuery` ao componente client.
- O client usa `useListControls(initialQuery)` para busca persistida na URL +
  paginação no cliente, `DataTable` com `columns`, `sort`/`onSort`, `rowActions`,
  `mobileCard` e `emptyTitle/Message/Action`.

## 4. Exclusões (delete)

- `ConfirmDialog` com `recordName`, `variant="danger"`, `loading` e
  **`consequenceItems`** quando há cascata/bloqueio (ex.: "3 OS vinculadas
  impedem a exclusão"). Se o servidor bloqueia por relação `Restrict`, descreva
  isso no diálogo e trate o erro (toast + manter diálogo aberto).

---

## 5. Acessibilidade (checklist para todo componente novo)

- **Icon-buttons** (só ícone): sempre `aria-label`. Ícones **decorativos**:
  `aria-hidden="true"`.
- **Foco visível:** `focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-ring` em elementos interativos.
- **Diálogos/drawers:** use `Modal`/`ConfirmDialog` (já trazem `useFocusTrap`,
  `role="dialog"`, `aria-modal`, Esc e retorno de foco). Para algo custom, use
  `useFocusTrap`/`useBodyScrollLock` de `ui/modal.tsx`.
- **Skip link** já existe no `app-shell` (`#conteudo`); mantenha `<main>` alvo.
- **Movimento:** animações respeitam `prefers-reduced-motion` globalmente
  (`globals.css`); em animações pontuais adicione `motion-reduce:animate-none`.
- **Alvos de toque** ≥ 40×40 px em ações icon-only.
- **Altura cheia (mobile):** use `dvh` (ex.: `h-[calc(100dvh-13rem)]`), não `vh`.

## 6. Dark mode & contraste

- Use **tokens semânticos** (`text-foreground`, `text-muted`, `text-subtle`,
  `bg-bg`, `bg-bg-elevated`, `border-border`, `accent`, `success/warning/danger/info`)
  — definidos claro/escuro em `globals.css`. **Nunca** cores hex hardcoded em
  texto/superfície. Mantenha contraste ≥ 4.5:1 (texto) nos dois temas.

## 7. IA

- Saídas de IA: renderize com `<MarkdownResult content={...} label="..."
  model={aiModel} demo={aiDemo} onRegenerate={...} />`. O `model`/`demo` vêm do
  servidor via `getModel()` / `!isAIAvailable()`. Nunca use HTML bruto
  (`dangerouslySetInnerHTML`) para conteúdo de IA — o `Markdown` é seguro.
- Preserve prompts, regras anti-alucinação, logging `AiInteraction` e rate-limit.
