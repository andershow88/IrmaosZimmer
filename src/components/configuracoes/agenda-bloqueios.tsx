"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  addDiaBloqueado,
  removeDiaBloqueado,
  type DiaBloqueadoData,
} from "@/server/agenda-config";

/** "YYYY-MM-DD" -> "dd/MM/yyyy" (sem armadilha de fuso; é uma data pura). */
function isoParaBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function AgendaBloqueios({
  diasBloqueados,
}: {
  diasBloqueados: DiaBloqueadoData[];
}) {
  const router = useRouter();

  const [data, setData] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const [removendo, setRemovendo] = useState<DiaBloqueadoData | null>(null);
  const [pendingRemove, startRemove] = useTransition();

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(false);
    if (!data) {
      setErro("Selecione uma data.");
      return;
    }
    startTransition(async () => {
      const res = await addDiaBloqueado({ data, motivo });
      if (!res.ok) {
        setErro(res.error);
        return;
      }
      setData("");
      setMotivo("");
      setOk(true);
      router.refresh();
    });
  }

  function confirmarRemocao() {
    if (!removendo) return;
    const alvo = removendo;
    startRemove(async () => {
      const res = await removeDiaBloqueado({ id: alvo.id });
      if (!res.ok) {
        setErro(res.error);
      }
      setRemovendo(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
            <CalendarX2 className="h-5 w-5" />
          </div>
          <CardTitle>Dias bloqueados (feriados / férias)</CardTitle>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {erro && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
            {erro}
          </div>
        )}
        {ok && (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Dia bloqueado adicionado.
          </div>
        )}

        <form
          onSubmit={adicionar}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface/40 p-3"
        >
          <div>
            <Label htmlFor="bloq-data">Data</Label>
            <Input
              id="bloq-data"
              type="date"
              className="w-44"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <div className="min-w-48 flex-1">
            <Label htmlFor="bloq-motivo">Motivo (opcional)</Label>
            <Input
              id="bloq-motivo"
              value={motivo}
              maxLength={120}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: Feriado de Natal, férias coletivas"
            />
          </div>
          <Button type="submit" disabled={pending}>
            <Plus className="h-4 w-4" />
            {pending ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>

        {diasBloqueados.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="Nenhum dia bloqueado"
            message="Adicione feriados ou períodos de férias para impedir agendamentos nessas datas."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Data</TH>
                <TH>Motivo</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {diasBloqueados.map((b) => (
                <TR key={b.id}>
                  <TD className="font-medium">{isoParaBR(b.data)}</TD>
                  <TD className="text-muted">{b.motivo ?? "—"}</TD>
                  <TD className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemovendo(b)}
                      className="text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardBody>

      <ConfirmDialog
        open={removendo !== null}
        title="Remover dia bloqueado"
        description={
          removendo
            ? `Liberar agendamentos em ${isoParaBR(removendo.data)}${
                removendo.motivo ? ` (${removendo.motivo})` : ""
              }?`
            : undefined
        }
        confirmLabel="Remover"
        loading={pendingRemove}
        onConfirm={confirmarRemocao}
        onCancel={() => setRemovendo(null)}
      />
    </Card>
  );
}
