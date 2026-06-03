"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { maskPlaca } from "@/lib/masks";
import { createVeiculo, updateVeiculo, type VeiculoActionState } from "@/server/veiculos";
import { COMBUSTIVEL_OPTIONS } from "@/components/veiculos/constants";

export type ClienteOption = {
  id: string;
  nome: string;
};

export type VeiculoFormValues = {
  customerId: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number | null;
  cor: string | null;
  quilometragem: number | null;
  chassi: string | null;
  renavam: string | null;
  combustivel: string | null;
  observacoes: string | null;
};

interface VeiculoFormProps {
  clientes: ClienteOption[];
  /** Quando informado, o formulário opera em modo edição. */
  veiculoId?: string;
  /** Cliente pré-selecionado (ex.: vindo da tela de cliente). */
  defaultCustomerId?: string;
  initial?: VeiculoFormValues;
}

const INITIAL_STATE: VeiculoActionState = { ok: false };

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Salvando..."
        : editing
          ? "Salvar alterações"
          : "Cadastrar veículo"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

export function VeiculoForm({
  clientes,
  veiculoId,
  defaultCustomerId,
  initial,
}: VeiculoFormProps) {
  const editing = Boolean(veiculoId);
  const action = editing
    ? updateVeiculo.bind(null, veiculoId as string)
    : createVeiculo;

  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const errors = state.fieldErrors ?? {};

  const [placa, setPlaca] = useState(initial?.placa ?? "");

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          {state.error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {state.error}
            </div>
          )}

          <div>
            <Label htmlFor="customerId" required>
              Cliente
            </Label>
            <Select
              id="customerId"
              name="customerId"
              defaultValue={initial?.customerId ?? defaultCustomerId ?? ""}
            >
              <option value="" disabled>
                Selecione o cliente
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
            <FieldError message={errors.customerId} />
            {clientes.length === 0 && (
              <p className="mt-1 text-xs text-muted">
                Nenhum cliente cadastrado. Cadastre um cliente antes de adicionar
                veículos.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="placa" required>
                Placa
              </Label>
              <Input
                id="placa"
                name="placa"
                value={placa}
                onChange={(e) => setPlaca(maskPlaca(e.target.value))}
                placeholder="ABC-1234 ou ABC1D23"
                autoCapitalize="characters"
              />
              <FieldError message={errors.placa} />
            </div>

            <div>
              <Label htmlFor="combustivel">Combustível</Label>
              <Select
                id="combustivel"
                name="combustivel"
                defaultValue={initial?.combustivel ?? ""}
              >
                <option value="">Não informado</option>
                {COMBUSTIVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.combustivel} />
            </div>

            <div>
              <Label htmlFor="marca" required>
                Marca
              </Label>
              <Input
                id="marca"
                name="marca"
                defaultValue={initial?.marca ?? ""}
                placeholder="Ex.: Volkswagen"
              />
              <FieldError message={errors.marca} />
            </div>

            <div>
              <Label htmlFor="modelo" required>
                Modelo
              </Label>
              <Input
                id="modelo"
                name="modelo"
                defaultValue={initial?.modelo ?? ""}
                placeholder="Ex.: Gol 1.6"
              />
              <FieldError message={errors.modelo} />
            </div>

            <div>
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                name="ano"
                type="number"
                inputMode="numeric"
                min={1900}
                max={new Date().getFullYear() + 1}
                defaultValue={initial?.ano ?? ""}
                placeholder="Ex.: 2020"
              />
              <FieldError message={errors.ano} />
            </div>

            <div>
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                name="cor"
                defaultValue={initial?.cor ?? ""}
                placeholder="Ex.: Prata"
              />
              <FieldError message={errors.cor} />
            </div>

            <div>
              <Label htmlFor="quilometragem">Quilometragem</Label>
              <Input
                id="quilometragem"
                name="quilometragem"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={initial?.quilometragem ?? ""}
                placeholder="Ex.: 85000"
              />
              <FieldError message={errors.quilometragem} />
            </div>

            <div>
              <Label htmlFor="renavam">Renavam</Label>
              <Input
                id="renavam"
                name="renavam"
                defaultValue={initial?.renavam ?? ""}
                placeholder="Ex.: 12345678901"
              />
              <FieldError message={errors.renavam} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="chassi">Chassi</Label>
              <Input
                id="chassi"
                name="chassi"
                defaultValue={initial?.chassi ?? ""}
                placeholder="Ex.: 9BWZZZ377VT004251"
                autoCapitalize="characters"
              />
              <FieldError message={errors.chassi} />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              defaultValue={initial?.observacoes ?? ""}
              placeholder="Anotações sobre o veículo..."
            />
            <FieldError message={errors.observacoes} />
          </div>
        </CardBody>

        <CardFooter className="flex justify-end gap-2">
          <Link href={veiculoId ? `/veiculos/${veiculoId}` : "/veiculos"}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <SubmitButton editing={editing} />
        </CardFooter>
      </Card>
    </form>
  );
}
