"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { createOS } from "@/server/ordens";

export type ClienteOption = {
  id: string;
  nome: string;
  vehicles: { id: string; placa: string; marca: string; modelo: string }[];
};

export type MecanicoOption = { id: string; name: string };

const PRIORIDADES: { value: string; label: string }[] = [
  { value: "BAIXA", label: "Baixa" },
  { value: "NORMAL", label: "Normal" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

export function OSForm({
  clientes,
  mecanicos,
}: {
  clientes: ClienteOption[];
  mecanicos: MecanicoOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const veiculos = useMemo(() => {
    return clientes.find((c) => c.id === customerId)?.vehicles ?? [];
  }, [clientes, customerId]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createOS(formData);
      if (res.ok) {
        router.push(`/painel/ordens-servico/${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="customerId" required>
              Cliente
            </Label>
            <Select
              id="customerId"
              name="customerId"
              required
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setVehicleId("");
              }}
            >
              <option value="">Selecione o cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="vehicleId" required>
              Veículo
            </Label>
            <Select
              id="vehicleId"
              name="vehicleId"
              required
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={!customerId}
            >
              <option value="">
                {customerId
                  ? veiculos.length
                    ? "Selecione o veículo…"
                    : "Cliente sem veículos cadastrados"
                  : "Selecione o cliente primeiro"}
              </option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo} — {v.placa}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="quilometragem">Quilometragem</Label>
            <Input
              id="quilometragem"
              name="quilometragem"
              type="number"
              min={0}
              placeholder="Ex.: 85000"
            />
          </div>

          <div>
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select id="prioridade" name="prioridade" defaultValue="NORMAL">
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="mecanicoId">Mecânico responsável</Label>
            <Select id="mecanicoId" name="mecanicoId" defaultValue="">
              <option value="">Não atribuído</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="problemaRelatado">Problema relatado</Label>
            <Textarea
              id="problemaRelatado"
              name="problemaRelatado"
              placeholder="Descreva o problema relatado pelo cliente…"
              rows={4}
            />
          </div>

          {error && (
            <p className="sm:col-span-2 text-sm font-medium text-danger">{error}</p>
          )}
        </CardBody>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/painel/ordens-servico")}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? "Salvando…" : "Abrir OS"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
