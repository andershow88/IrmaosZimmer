"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardBody } from "@/components/ui/card";
import {
  createAgendamento,
  updateAgendamento,
  type AgendaActionState,
} from "@/server/agenda";

export type ClienteOption = {
  id: string;
  nome: string;
};

export type VeiculoOption = {
  id: string;
  customerId: string;
  label: string;
};

export type MecanicoOption = {
  id: string;
  nome: string;
};

export type AgendamentoFormValues = {
  customerId: string;
  vehicleId: string;
  mecanicoId: string;
  servicoDesejado: string;
  dataHora: string; // formato datetime-local: yyyy-MM-ddTHH:mm
  duracaoMin: number;
  observacoes: string;
};

export interface AgendamentoFormProps {
  clientes: ClienteOption[];
  veiculos: VeiculoOption[];
  mecanicos: MecanicoOption[];
  /** Quando presente, o formulário edita o agendamento existente. */
  agendamentoId?: string;
  initialValues?: Partial<AgendamentoFormValues>;
}

const INITIAL_STATE: AgendaActionState = { ok: false };

export function AgendamentoForm({
  clientes,
  veiculos,
  mecanicos,
  agendamentoId,
  initialValues,
}: AgendamentoFormProps) {
  const router = useRouter();

  const action = agendamentoId
    ? updateAgendamento.bind(null, agendamentoId)
    : createAgendamento;

  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  const [customerId, setCustomerId] = useState(initialValues?.customerId ?? "");
  const [vehicleId, setVehicleId] = useState(initialValues?.vehicleId ?? "");

  const veiculosDoCliente = useMemo(
    () => veiculos.filter((v) => v.customerId === customerId),
    [veiculos, customerId]
  );

  // Se mudar de cliente e o veículo atual não pertencer mais, limpa.
  const veiculoValido = veiculosDoCliente.some((v) => v.id === vehicleId);
  const vehicleValue = veiculoValido ? vehicleId : "";

  // Redireciona para o detalhe após sucesso (efeito, não durante o render).
  useEffect(() => {
    if (state.ok && state.id) {
      router.push(`/painel/agenda/${state.id}`);
    }
  }, [state.ok, state.id, router]);

  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Cliente */}
          <div>
            <Label htmlFor="customerId" required>
              Cliente
            </Label>
            <Select
              id="customerId"
              name="customerId"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setVehicleId("");
              }}
            >
              <option value="">Selecione o cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
            {fe.customerId && <p className="mt-1 text-xs text-danger">{fe.customerId}</p>}
          </div>

          {/* Veículo */}
          <div>
            <Label htmlFor="vehicleId">Veículo</Label>
            <Select
              id="vehicleId"
              name="vehicleId"
              value={vehicleValue}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={!customerId}
            >
              <option value="">
                {customerId
                  ? veiculosDoCliente.length
                    ? "Selecione o veículo"
                    : "Cliente sem veículos cadastrados"
                  : "Selecione um cliente primeiro"}
              </option>
              {veiculosDoCliente.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </Select>
            {fe.vehicleId && <p className="mt-1 text-xs text-danger">{fe.vehicleId}</p>}
          </div>

          {/* Serviço desejado */}
          <div className="md:col-span-2">
            <Label htmlFor="servicoDesejado">Serviço desejado</Label>
            <Input
              id="servicoDesejado"
              name="servicoDesejado"
              defaultValue={initialValues?.servicoDesejado ?? ""}
              placeholder="Ex.: Revisão, troca de óleo, alinhamento..."
            />
            {fe.servicoDesejado && (
              <p className="mt-1 text-xs text-danger">{fe.servicoDesejado}</p>
            )}
          </div>

          {/* Data e hora */}
          <div>
            <Label htmlFor="dataHora" required>
              Data e hora
            </Label>
            <Input
              id="dataHora"
              name="dataHora"
              type="datetime-local"
              defaultValue={initialValues?.dataHora ?? ""}
            />
            {fe.dataHora && <p className="mt-1 text-xs text-danger">{fe.dataHora}</p>}
          </div>

          {/* Duração */}
          <div>
            <Label htmlFor="duracaoMin" required>
              Duração (minutos)
            </Label>
            <Input
              id="duracaoMin"
              name="duracaoMin"
              type="number"
              min={5}
              max={1440}
              step={5}
              defaultValue={initialValues?.duracaoMin ?? 60}
            />
            {fe.duracaoMin && <p className="mt-1 text-xs text-danger">{fe.duracaoMin}</p>}
          </div>

          {/* Mecânico */}
          <div>
            <Label htmlFor="mecanicoId">Mecânico responsável</Label>
            <Select
              id="mecanicoId"
              name="mecanicoId"
              defaultValue={initialValues?.mecanicoId ?? ""}
            >
              <option value="">Sem responsável definido</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Select>
            {fe.mecanicoId && <p className="mt-1 text-xs text-danger">{fe.mecanicoId}</p>}
          </div>

          {/* Observações */}
          <div className="md:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              defaultValue={initialValues?.observacoes ?? ""}
              placeholder="Anotações internas sobre o agendamento..."
            />
            {fe.observacoes && <p className="mt-1 text-xs text-danger">{fe.observacoes}</p>}
          </div>

          {state.error && (
            <div className="md:col-span-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
              {state.error}
            </div>
          )}

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              <CalendarClock className="h-4 w-4" />
              {pending
                ? "Salvando..."
                : agendamentoId
                  ? "Salvar alterações"
                  : "Criar agendamento"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
