"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import type { CategoriaServico } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createServico,
  updateServico,
  type ServicoActionState,
} from "@/server/servicos";
import { CATEGORIA_OPTIONS } from "./categorias";

export type ServicoFormValues = {
  id?: string;
  nome: string;
  categoria: CategoriaServico | "";
  descricao: string;
  precoPadrao: string;
  tempoEstimadoMin: string;
  ativo: boolean;
};

const initialState: ServicoActionState = { ok: false };

export function ServicoForm({
  initial,
  mode,
}: {
  initial: ServicoFormValues;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const action =
    mode === "edit" && initial.id
      ? updateServico.bind(null, initial.id)
      : createServico;

  const [state, formAction, pending] = useActionState<
    ServicoActionState,
    FormData
  >(action, initialState);

  const [ativo, setAtivo] = useState(initial.ativo);

  useEffect(() => {
    if (state.ok) {
      router.push("/servicos");
      router.refresh();
    }
  }, [state.ok, router]);

  const err = state.errors ?? {};

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          {state.message && !state.ok && (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger">
              {state.message}
            </p>
          )}

          <div>
            <Label htmlFor="nome" required>
              Nome do serviço
            </Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={initial.nome}
              placeholder="Ex.: Troca de óleo e filtro"
              maxLength={160}
              autoFocus
              aria-invalid={!!err.nome}
            />
            {err.nome && <p className="mt-1 text-xs text-danger">{err.nome}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="categoria" required>
                Categoria
              </Label>
              <Select
                id="categoria"
                name="categoria"
                defaultValue={initial.categoria}
                aria-invalid={!!err.categoria}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {CATEGORIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              {err.categoria && (
                <p className="mt-1 text-xs text-danger">{err.categoria}</p>
              )}
            </div>

            <div>
              <Label htmlFor="precoPadrao" required>
                Preço padrão (R$)
              </Label>
              <Input
                id="precoPadrao"
                name="precoPadrao"
                inputMode="decimal"
                defaultValue={initial.precoPadrao}
                placeholder="0,00"
                aria-invalid={!!err.precoPadrao}
              />
              {err.precoPadrao && (
                <p className="mt-1 text-xs text-danger">{err.precoPadrao}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="tempoEstimadoMin">Tempo estimado (minutos)</Label>
              <Input
                id="tempoEstimadoMin"
                name="tempoEstimadoMin"
                type="number"
                min={0}
                step={1}
                defaultValue={initial.tempoEstimadoMin}
                placeholder="Ex.: 60"
                aria-invalid={!!err.tempoEstimadoMin}
              />
              {err.tempoEstimadoMin && (
                <p className="mt-1 text-xs text-danger">{err.tempoEstimadoMin}</p>
              )}
            </div>

            <div>
              <Label>Situação</Label>
              <button
                type="button"
                role="switch"
                aria-checked={ativo}
                onClick={() => setAtivo((v) => !v)}
                className={cn(
                  "flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-sm font-medium transition",
                  ativo
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border bg-bg-elevated text-muted"
                )}
              >
                <span>{ativo ? "Ativo" : "Inativo"}</span>
                <span
                  className={cn(
                    "relative h-6 w-11 rounded-full transition",
                    ativo ? "bg-success" : "bg-surface-2"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                      ativo ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </span>
              </button>
              <input type="hidden" name="ativo" value={ativo ? "true" : "false"} />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              name="descricao"
              defaultValue={initial.descricao}
              placeholder="Detalhes do serviço, escopo, observações..."
              maxLength={2000}
              rows={4}
            />
            {err.descricao && (
              <p className="mt-1 text-xs text-danger">{err.descricao}</p>
            )}
          </div>
        </CardBody>

        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/servicos")}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mode === "edit" ? "Salvar alterações" : "Cadastrar serviço"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
