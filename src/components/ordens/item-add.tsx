"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wrench, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/utils";
import { addServicoItem, addPecaItem } from "@/server/ordens";

export type ServicoOption = {
  id: string;
  nome: string;
  precoPadrao: number;
};

export type PecaOption = {
  id: string;
  nome: string;
  codigoInterno: string;
  precoVenda: number;
  quantidade: number;
};

/** Normaliza acentos para busca tolerante. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function ItemAdd({
  serviceOrderId,
  servicos,
  pecas,
  disabled,
}: {
  serviceOrderId: string;
  servicos: ServicoOption[];
  pecas: PecaOption[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [aba, setAba] = useState<"SERVICO" | "PECA">("SERVICO");
  const [busca, setBusca] = useState("");

  const [serviceId, setServiceId] = useState("");
  const [servicoQtd, setServicoQtd] = useState(1);
  const [partId, setPartId] = useState("");
  const [pecaQtd, setPecaQtd] = useState(1);

  const pecaSelecionada = pecas.find((p) => p.id === partId);
  const servicoSelecionado = servicos.find((s) => s.id === serviceId);

  const servicosFiltrados = useMemo(() => {
    const t = norm(busca.trim());
    if (!t) return servicos;
    return servicos.filter((s) => norm(s.nome).includes(t));
  }, [busca, servicos]);

  const pecasFiltradas = useMemo(() => {
    const t = norm(busca.trim());
    if (!t) return pecas;
    return pecas.filter(
      (p) => norm(p.nome).includes(t) || norm(p.codigoInterno).includes(t)
    );
  }, [busca, pecas]);

  function addServico() {
    if (!serviceId) {
      toast({ title: "Selecione um serviço.", variant: "warning" });
      return;
    }
    const fd = new FormData();
    fd.set("serviceId", serviceId);
    fd.set("quantidade", String(servicoQtd));
    startTransition(async () => {
      const res = await addServicoItem(serviceOrderId, fd);
      if (res.ok) {
        setServiceId("");
        setServicoQtd(1);
        setBusca("");
        toast({ title: "Serviço adicionado", variant: "success" });
        router.refresh();
      } else {
        toast({
          title: "Erro ao adicionar serviço",
          description: res.error,
          variant: "error",
        });
      }
    });
  }

  function addPeca() {
    if (!partId) {
      toast({ title: "Selecione uma peça.", variant: "warning" });
      return;
    }
    const fd = new FormData();
    fd.set("partId", partId);
    fd.set("quantidade", String(pecaQtd));
    startTransition(async () => {
      const res = await addPecaItem(serviceOrderId, fd);
      if (res.ok) {
        setPartId("");
        setPecaQtd(1);
        setBusca("");
        toast({ title: "Peça adicionada", variant: "success" });
        router.refresh();
      } else {
        toast({
          title: "Erro ao adicionar peça",
          description: res.error,
          variant: "error",
        });
      }
    });
  }

  if (disabled) {
    return (
      <p className="text-sm text-muted">
        Itens não podem ser alterados nesta etapa da OS.
      </p>
    );
  }

  // Aviso de estoque insuficiente (não impede o servidor de validar — apenas alerta).
  const estoqueInsuficiente =
    pecaSelecionada != null && pecaQtd > pecaSelecionada.quantidade;

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      {/* Seletor de tipo */}
      <div
        role="tablist"
        aria-label="Tipo de item"
        className="mb-3 inline-flex rounded-lg border border-border bg-bg-elevated p-1"
      >
        {(["SERVICO", "PECA"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={aba === t}
            onClick={() => {
              setAba(t);
              setBusca("");
            }}
            className={
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
              (aba === t
                ? "bg-accent-soft text-accent"
                : "text-muted hover:text-foreground")
            }
          >
            {t === "SERVICO" ? (
              <Wrench className="h-4 w-4" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            {t === "SERVICO" ? "Serviço" : "Peça"}
          </button>
        ))}
      </div>

      <SearchInput
        value={busca}
        onChange={setBusca}
        density="sm"
        debounce={200}
        placeholder={
          aba === "SERVICO" ? "Buscar serviço…" : "Buscar peça por nome ou código…"
        }
        aria-label="Buscar item para adicionar"
        className="mb-3"
      />

      {/* Lista de resultados buscáveis */}
      {aba === "SERVICO" ? (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-bg-elevated divide-y divide-border">
          {servicosFiltrados.length === 0 ? (
            <p className="p-3 text-sm text-muted">Nenhum serviço encontrado.</p>
          ) : (
            servicosFiltrados.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={serviceId === s.id}
                onClick={() => setServiceId(s.id)}
                className={
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                  (serviceId === s.id
                    ? "bg-accent-soft text-foreground"
                    : "hover:bg-surface")
                }
              >
                <span className="truncate font-medium text-foreground">{s.nome}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {formatBRL(s.precoPadrao)}
                </span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-bg-elevated divide-y divide-border">
          {pecasFiltradas.length === 0 ? (
            <p className="p-3 text-sm text-muted">Nenhuma peça encontrada.</p>
          ) : (
            pecasFiltradas.map((p) => {
              const semEstoque = p.quantidade <= 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={partId === p.id}
                  onClick={() => setPartId(p.id)}
                  className={
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                    (partId === p.id ? "bg-accent-soft" : "hover:bg-surface")
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {p.nome}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {p.codigoInterno} · {formatBRL(p.precoVenda)}
                    </span>
                  </span>
                  <Badge variant={semEstoque ? "danger" : p.quantidade <= 3 ? "warning" : "outline"}>
                    {p.quantidade} em estoque
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Linha de quantidade + adicionar */}
      {aba === "SERVICO" ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-28">
            <Label htmlFor="servicoQtd">Qtd.</Label>
            <Input
              id="servicoQtd"
              type="number"
              min={1}
              value={servicoQtd}
              onChange={(e) => setServicoQtd(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          {servicoSelecionado && (
            <p className="flex-1 text-sm text-muted">
              Selecionado: <span className="font-medium text-foreground">{servicoSelecionado.nome}</span>{" "}
              · Subtotal{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatBRL(servicoSelecionado.precoPadrao * servicoQtd)}
              </span>
            </p>
          )}
          <Button type="button" onClick={addServico} disabled={pending || !serviceId}>
            <Plus className="h-4 w-4" />
            Adicionar serviço
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-28">
              <Label htmlFor="pecaQtd">Qtd.</Label>
              <Input
                id="pecaQtd"
                type="number"
                min={1}
                max={pecaSelecionada?.quantidade ?? undefined}
                value={pecaQtd}
                onChange={(e) => setPecaQtd(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            {pecaSelecionada && (
              <p className="flex-1 text-sm text-muted">
                Selecionada: <span className="font-medium text-foreground">{pecaSelecionada.nome}</span>{" "}
                · Subtotal{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatBRL(pecaSelecionada.precoVenda * pecaQtd)}
                </span>
              </p>
            )}
            <Button
              type="button"
              onClick={addPeca}
              disabled={pending || !partId}
            >
              <Plus className="h-4 w-4" />
              Adicionar peça
            </Button>
          </div>
          {estoqueInsuficiente && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
              <AlertTriangle className="h-3.5 w-3.5" />
              Estoque insuficiente — disponível: {pecaSelecionada?.quantidade} un. A
              adição será bloqueada pelo sistema.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
