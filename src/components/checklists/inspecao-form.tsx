"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ClipboardCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createInspecao } from "@/server/checklists";
import { ITENS_PADRAO, STATUS_OPCOES, type StatusItem } from "./constants";

type VeiculoOption = {
  id: string;
  label: string;
  clienteNome: string;
};

type OsOption = {
  id: string;
  numero: string;
  vehicleId: string;
};

type MecanicoOption = {
  id: string;
  name: string;
};

type FormItem = {
  uid: string;
  item: string;
  status: StatusItem;
  observacao: string;
};

export interface InspecaoFormProps {
  veiculos: VeiculoOption[];
  ordens: OsOption[];
  mecanicos: MecanicoOption[];
}

let uidCounter = 0;
function nextUid() {
  uidCounter += 1;
  return `item-${uidCounter}`;
}

function itensIniciais(): FormItem[] {
  return ITENS_PADRAO.map((item) => ({
    uid: nextUid(),
    item,
    status: "NAO_VERIFICADO",
    observacao: "",
  }));
}

export function InspecaoForm({ veiculos, ordens, mecanicos }: InspecaoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [vehicleId, setVehicleId] = useState("");
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [mecanicoId, setMecanicoId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [items, setItems] = useState<FormItem[]>(itensIniciais);
  const [erro, setErro] = useState<string | null>(null);

  // Apenas OS do veículo selecionado.
  const ordensFiltradas = vehicleId
    ? ordens.filter((o) => o.vehicleId === vehicleId)
    : [];

  function handleVeiculoChange(id: string) {
    setVehicleId(id);
    // Reseta a OS se ela não pertencer mais ao veículo.
    if (serviceOrderId && !ordens.some((o) => o.id === serviceOrderId && o.vehicleId === id)) {
      setServiceOrderId("");
    }
  }

  function updateItem(uid: string, patch: Partial<FormItem>) {
    setItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it))
    );
  }

  function removeItem(uid: string) {
    setItems((prev) => prev.filter((it) => it.uid !== uid));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { uid: nextUid(), item: "", status: "NAO_VERIFICADO", observacao: "" },
    ]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!vehicleId) {
      setErro("Selecione um veículo.");
      return;
    }
    const itensValidos = items
      .map((it) => ({ ...it, item: it.item.trim() }))
      .filter((it) => it.item.length > 0);

    if (itensValidos.length === 0) {
      setErro("Adicione ao menos um item à inspeção.");
      return;
    }

    startTransition(async () => {
      const res = await createInspecao({
        vehicleId,
        serviceOrderId: serviceOrderId || null,
        mecanicoId: mecanicoId || null,
        observacoes: observacoes.trim() || null,
        items: itensValidos.map((it) => ({
          item: it.item,
          status: it.status,
          observacao: it.observacao.trim() || null,
        })),
      });

      if (res.ok) {
        router.push(`/painel/checklists/${res.id}`);
        router.refresh();
      } else {
        setErro(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Dados da inspeção</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="veiculo" required>
              Veículo
            </Label>
            <Select
              id="veiculo"
              value={vehicleId}
              onChange={(e) => handleVeiculoChange(e.target.value)}
              required
            >
              <option value="">Selecione um veículo</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} — {v.clienteNome}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="os">Ordem de serviço (opcional)</Label>
            <Select
              id="os"
              value={serviceOrderId}
              onChange={(e) => setServiceOrderId(e.target.value)}
              disabled={!vehicleId}
            >
              <option value="">Sem vínculo</option>
              {ordensFiltradas.map((o) => (
                <option key={o.id} value={o.id}>
                  OS {o.numero}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="mecanico">Mecânico (opcional)</Label>
            <Select
              id="mecanico"
              value={mecanicoId}
              onChange={(e) => setMecanicoId(e.target.value)}
            >
              <option value="">Não atribuído</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="observacoes">Observações técnicas</Label>
            <Textarea
              id="observacoes"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas gerais sobre o veículo..."
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Itens verificados</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Adicionar item
          </Button>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {items.length === 0 && (
            <p className="text-sm text-muted">Nenhum item. Adicione ao menos um.</p>
          )}
          {items.map((it) => (
            <div
              key={it.uid}
              className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-surface/40 p-3 sm:grid-cols-12 sm:items-end"
            >
              <div className="sm:col-span-4">
                <Label className="text-xs">Item</Label>
                <Input
                  density="sm"
                  value={it.item}
                  onChange={(e) => updateItem(it.uid, { item: e.target.value })}
                  placeholder="Nome do item"
                />
              </div>
              <div className="sm:col-span-3">
                <Label className="text-xs">Status</Label>
                <Select
                  density="sm"
                  value={it.status}
                  onChange={(e) =>
                    updateItem(it.uid, { status: e.target.value as StatusItem })
                  }
                >
                  {STATUS_OPCOES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-4">
                <Label className="text-xs">Observação</Label>
                <Input
                  density="sm"
                  value={it.observacao}
                  onChange={(e) =>
                    updateItem(it.uid, { observacao: e.target.value })
                  }
                  placeholder="Opcional"
                />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(it.uid)}
                  aria-label="Remover item"
                  title="Remover item"
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {erro && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          <ClipboardCheck className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar inspeção"}
        </Button>
      </div>
    </form>
  );
}
