"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/utils";
import { createOrcamento } from "@/server/orcamentos";
import { ItensEditor, novoItemDraft, type ItemDraft } from "./itens-editor";
import type {
  ServicoOption,
  PecaOption,
  ClienteOption,
  OSOption,
} from "./types";

type Origem = "OS" | "LIVRE";

export function OrcamentoForm({
  clientes,
  ordens,
  servicos,
  pecas,
}: {
  clientes: ClienteOption[];
  ordens: OSOption[];
  servicos: ServicoOption[];
  pecas: PecaOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [origem, setOrigem] = useState<Origem>("LIVRE");
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [validade, setValidade] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemDraft[]>([novoItemDraft()]);

  const veiculosDoCliente = useMemo(
    () => clientes.find((c) => c.id === customerId)?.veiculos ?? [],
    [clientes, customerId]
  );

  const somaItens = useMemo(
    () => itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0),
    [itens]
  );
  const total = Math.max(0, somaItens - desconto);

  function handleCliente(id: string) {
    setCustomerId(id);
    setVehicleId("");
  }

  function submit() {
    setErro(null);

    if (origem === "OS" && !serviceOrderId) {
      setErro("Selecione a ordem de serviço.");
      return;
    }
    if (origem === "LIVRE" && (!customerId || !vehicleId)) {
      setErro("Selecione cliente e veículo.");
      return;
    }
    if (itens.length === 0) {
      setErro("Adicione ao menos um item.");
      return;
    }
    if (itens.some((i) => !i.descricao.trim())) {
      setErro("Preencha a descrição de todos os itens.");
      return;
    }

    const payload = {
      serviceOrderId: origem === "OS" ? serviceOrderId : null,
      customerId: origem === "LIVRE" ? customerId : null,
      vehicleId: origem === "LIVRE" ? vehicleId : null,
      validade: validade || null,
      desconto,
      observacoes: observacoes || null,
      itens: itens.map((i) => ({
        tipo: i.tipo,
        serviceId: i.serviceId,
        partId: i.partId,
        descricao: i.descricao,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario,
      })),
    };

    startTransition(async () => {
      const res = await createOrcamento(payload);
      // createOrcamento redireciona em sucesso; só chegamos aqui em erro.
      if (res && !res.ok) setErro(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Origem do orçamento</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setOrigem("LIVRE")}
              className={`flex-1 rounded-xl border p-3 text-left text-sm transition ${
                origem === "LIVRE"
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-surface/40 text-muted hover:border-border-strong/70"
              }`}
            >
              <span className="font-semibold">Avulso</span>
              <p className="text-xs">Selecione cliente e veículo.</p>
            </button>
            <button
              type="button"
              onClick={() => setOrigem("OS")}
              disabled={ordens.length === 0}
              className={`flex-1 rounded-xl border p-3 text-left text-sm transition disabled:opacity-50 ${
                origem === "OS"
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-surface/40 text-muted hover:border-border-strong/70"
              }`}
            >
              <span className="font-semibold">A partir de uma OS</span>
              <p className="text-xs">
                {ordens.length === 0
                  ? "Nenhuma OS disponível."
                  : "Herda cliente e veículo da OS."}
              </p>
            </button>
          </div>

          {origem === "OS" ? (
            <div>
              <Label required>Ordem de serviço</Label>
              <Select
                value={serviceOrderId}
                onChange={(e) => setServiceOrderId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {ordens.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.numero} — {o.clienteNome} ({o.veiculoLabel})
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label required>Cliente</Label>
                <Select
                  value={customerId}
                  onChange={(e) => handleCliente(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label required>Veículo</Label>
                <Select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  disabled={!customerId}
                >
                  <option value="">
                    {customerId ? "Selecione..." : "Escolha o cliente primeiro"}
                  </option>
                  {veiculosDoCliente.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} — {v.placa}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens</CardTitle>
        </CardHeader>
        <CardBody>
          <ItensEditor
            itens={itens}
            onChange={setItens}
            servicos={servicos}
            pecas={pecas}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condições</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Validade</Label>
            <Input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
            />
          </div>
          <div>
            <Label>Desconto (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={desconto}
              onChange={(e) => setDesconto(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações para o cliente..."
            />
          </div>
        </CardBody>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5 text-sm">
            <p className="text-muted">
              Subtotal:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatBRL(somaItens)}
              </span>
            </p>
            <p className="text-muted">
              Desconto:{" "}
              <span className="font-medium text-foreground tabular-nums">
                - {formatBRL(desconto)}
              </span>
            </p>
            <p className="text-base font-bold text-foreground">
              Total: <span className="tabular-nums">{formatBRL(total)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="button" onClick={submit} disabled={pending}>
              <Save className="h-4 w-4" />
              {pending ? "Salvando..." : "Salvar orçamento"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {erro && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <FileText className="h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}
    </div>
  );
}
