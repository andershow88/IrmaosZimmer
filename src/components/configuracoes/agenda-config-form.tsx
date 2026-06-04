"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCog, Clock, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  saveAgendaConfig,
  saveExpediente,
  type AgendaConfigData,
  type ExpedienteDiaData,
} from "@/server/agenda-config";

// Rótulos dos dias (0=Dom..6=Sáb). Exibidos a partir da Segunda.
const DIAS: { value: number; label: string }[] = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

// Opções de granularidade de slot mais comuns.
const SLOT_OPCOES = [15, 20, 30, 45, 60, 90, 120];

type Aviso = { tipo: "ok" | "erro"; texto: string } | null;

export function AgendaConfigForm({
  config,
  expediente,
  resumo,
}: {
  config: AgendaConfigData;
  expediente: ExpedienteDiaData[];
  resumo: string;
}) {
  const router = useRouter();

  // --- Parâmetros gerais ---
  const [slotMinutos, setSlotMinutos] = useState(config.slotMinutos);
  const [capacidade, setCapacidade] = useState(config.capacidadePorSlot);
  const [antecedencia, setAntecedencia] = useState(config.antecedenciaMinHoras);
  const [maxDias, setMaxDias] = useState(config.maxDiasAntecedencia);
  const [avisoParam, setAvisoParam] = useState<Aviso>(null);
  const [pendingParam, startParam] = useTransition();

  // --- Expediente (mapa por dia da semana) ---
  const inicial = useMemo(() => {
    const m = new Map<number, ExpedienteDiaData>();
    for (const e of expediente) m.set(e.diaSemana, e);
    return m;
  }, [expediente]);

  const [diasState, setDiasState] = useState<Record<number, ExpedienteDiaData>>(
    () => {
      const obj: Record<number, ExpedienteDiaData> = {};
      for (const d of DIAS) {
        obj[d.value] =
          inicial.get(d.value) ??
          ({
            diaSemana: d.value,
            aberto: false,
            abre: "08:00",
            fecha: "18:00",
            pausaInicio: null,
            pausaFim: null,
          } satisfies ExpedienteDiaData);
      }
      return obj;
    }
  );
  const [avisoExped, setAvisoExped] = useState<Aviso>(null);
  const [pendingExped, startExped] = useTransition();

  function updateDia(dia: number, patch: Partial<ExpedienteDiaData>) {
    setDiasState((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], ...patch },
    }));
  }

  function salvarParametros(e: React.FormEvent) {
    e.preventDefault();
    setAvisoParam(null);
    startParam(async () => {
      const res = await saveAgendaConfig({
        slotMinutos: Number(slotMinutos),
        capacidadePorSlot: Number(capacidade),
        antecedenciaMinHoras: Number(antecedencia),
        maxDiasAntecedencia: Number(maxDias),
      });
      if (!res.ok) {
        setAvisoParam({ tipo: "erro", texto: res.error });
        return;
      }
      setAvisoParam({ tipo: "ok", texto: "Parâmetros da agenda salvos." });
      router.refresh();
    });
  }

  function salvarExpediente(e: React.FormEvent) {
    e.preventDefault();
    setAvisoExped(null);
    startExped(async () => {
      const payload = DIAS.map((d) => {
        const v = diasState[d.value];
        return {
          diaSemana: d.value,
          aberto: v.aberto,
          abre: v.abre,
          fecha: v.fecha,
          pausaInicio: v.pausaInicio ? v.pausaInicio : null,
          pausaFim: v.pausaFim ? v.pausaFim : null,
        } satisfies ExpedienteDiaData;
      });
      const res = await saveExpediente(payload);
      if (!res.ok) {
        setAvisoExped({ tipo: "erro", texto: res.error });
        return;
      }
      setAvisoExped({ tipo: "ok", texto: "Expediente semanal salvo." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Resumo legível */}
      <Card>
        <CardBody className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <CalendarCog className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Resumo da agenda
            </p>
            <p className="mt-0.5 text-sm text-muted">{resumo}</p>
          </div>
        </CardBody>
      </Card>

      {/* Parâmetros gerais */}
      <form onSubmit={salvarParametros}>
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros gerais</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Aviso aviso={avisoParam} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="slotMinutos">Duração do slot (min)</Label>
                <Select
                  id="slotMinutos"
                  value={String(slotMinutos)}
                  onChange={(e) => setSlotMinutos(Number(e.target.value))}
                >
                  {SLOT_OPCOES.map((m) => (
                    <option key={m} value={m}>
                      {m} minutos
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-muted">
                  Granularidade da grade de horários.
                </p>
              </div>

              <div>
                <Label htmlFor="capacidade">Capacidade por slot</Label>
                <Input
                  id="capacidade"
                  type="number"
                  min={1}
                  max={50}
                  value={capacidade}
                  onChange={(e) => setCapacidade(Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-muted">
                  Agendamentos simultâneos permitidos no mesmo horário.
                </p>
              </div>

              <div>
                <Label htmlFor="antecedencia">Antecedência mínima (h)</Label>
                <Input
                  id="antecedencia"
                  type="number"
                  min={0}
                  max={720}
                  value={antecedencia}
                  onChange={(e) => setAntecedencia(Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-muted">
                  Tempo mínimo entre agora e o horário agendado.
                </p>
              </div>

              <div>
                <Label htmlFor="maxDias">Janela máxima (dias)</Label>
                <Input
                  id="maxDias"
                  type="number"
                  min={1}
                  max={365}
                  value={maxDias}
                  onChange={(e) => setMaxDias(Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-muted">
                  Até quantos dias à frente é possível agendar.
                </p>
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={pendingParam}>
              <Save className="h-4 w-4" />
              {pendingParam ? "Salvando..." : "Salvar parâmetros"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Expediente por dia da semana */}
      <form onSubmit={salvarExpediente}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <Clock className="h-5 w-5" />
              </div>
              <CardTitle>Horários de expediente</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <Aviso aviso={avisoExped} />

            {DIAS.map((d) => {
              const v = diasState[d.value];
              return (
                <div
                  key={d.value}
                  className="rounded-xl border border-border bg-surface/40 p-3"
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <label className="flex w-40 shrink-0 cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={v.aberto}
                        onChange={(e) =>
                          updateDia(d.value, { aberto: e.target.checked })
                        }
                        className="h-4 w-4 shrink-0 cursor-pointer accent-accent"
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {d.label}
                      </span>
                    </label>

                    {v.aberto ? (
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <Label
                            htmlFor={`abre-${d.value}`}
                            className="mb-1 text-xs"
                          >
                            Abre
                          </Label>
                          <Input
                            id={`abre-${d.value}`}
                            type="time"
                            density="sm"
                            className="w-28"
                            value={v.abre}
                            onChange={(e) =>
                              updateDia(d.value, { abre: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`fecha-${d.value}`}
                            className="mb-1 text-xs"
                          >
                            Fecha
                          </Label>
                          <Input
                            id={`fecha-${d.value}`}
                            type="time"
                            density="sm"
                            className="w-28"
                            value={v.fecha}
                            onChange={(e) =>
                              updateDia(d.value, { fecha: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`pi-${d.value}`}
                            className="mb-1 text-xs"
                          >
                            Pausa início
                          </Label>
                          <Input
                            id={`pi-${d.value}`}
                            type="time"
                            density="sm"
                            className="w-28"
                            value={v.pausaInicio ?? ""}
                            onChange={(e) =>
                              updateDia(d.value, {
                                pausaInicio: e.target.value || null,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`pf-${d.value}`}
                            className="mb-1 text-xs"
                          >
                            Pausa fim
                          </Label>
                          <Input
                            id={`pf-${d.value}`}
                            type="time"
                            density="sm"
                            className="w-28"
                            value={v.pausaFim ?? ""}
                            onChange={(e) =>
                              updateDia(d.value, {
                                pausaFim: e.target.value || null,
                              })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted">Fechado</span>
                    )}
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted">
              Deixe a pausa em branco se não houver intervalo de almoço.
            </p>
          </CardBody>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={pendingExped}>
              <Save className="h-4 w-4" />
              {pendingExped ? "Salvando..." : "Salvar expediente"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

function Aviso({ aviso }: { aviso: Aviso }) {
  if (!aviso) return null;
  if (aviso.tipo === "erro") {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
        {aviso.texto}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {aviso.texto}
    </div>
  );
}
