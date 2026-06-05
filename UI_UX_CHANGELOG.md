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

## Fase 1 — Tokens, Tipografia e Estados ⬜ Pendente

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
