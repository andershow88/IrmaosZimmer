"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPeca, updatePeca, type ActionResult } from "@/server/estoque";
import { CATEGORIAS_PECA } from "./categorias";

export interface FornecedorOption {
  id: string;
  nome: string;
}

export interface PecaFormValues {
  id?: string;
  nome: string;
  codigoInterno: string;
  categoria: string;
  supplierId: string;
  precoCusto: number;
  precoVenda: number;
  quantidade: number;
  estoqueMinimo: number;
  localizacao: string;
  compatibilidade: string;
}

interface PecaFormProps {
  fornecedores: FornecedorOption[];
  initial?: PecaFormValues;
}

const EMPTY: PecaFormValues = {
  nome: "",
  codigoInterno: "",
  categoria: "",
  supplierId: "",
  precoCusto: 0,
  precoVenda: 0,
  quantidade: 0,
  estoqueMinimo: 0,
  localizacao: "",
  compatibilidade: "",
};

export function PecaForm({ fornecedores, initial }: PecaFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const values = initial ?? EMPTY;

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let result: ActionResult;
      if (isEdit && initial?.id) {
        result = await updatePeca(initial.id, formData);
      } else {
        result = await createPeca(formData);
      }

      if (result.ok) {
        router.push("/painel/estoque");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardBody className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nome" required>
                Nome da peça
              </Label>
              <Input
                id="nome"
                name="nome"
                defaultValue={values.nome}
                placeholder="Ex.: Filtro de óleo"
                required
              />
            </div>

            <div>
              <Label htmlFor="codigoInterno" required>
                Código interno
              </Label>
              <Input
                id="codigoInterno"
                name="codigoInterno"
                defaultValue={values.codigoInterno}
                placeholder="Ex.: FLT-0001"
                required
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                id="categoria"
                name="categoria"
                defaultValue={values.categoria}
              >
                <option value="">Sem categoria</option>
                {CATEGORIAS_PECA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {/* Mantém categoria personalizada já gravada */}
                {values.categoria &&
                  !CATEGORIAS_PECA.includes(
                    values.categoria as (typeof CATEGORIAS_PECA)[number]
                  ) && <option value={values.categoria}>{values.categoria}</option>}
              </Select>
            </div>

            <div>
              <Label htmlFor="supplierId">Fornecedor</Label>
              <Select
                id="supplierId"
                name="supplierId"
                defaultValue={values.supplierId}
              >
                <option value="">Sem fornecedor</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="precoCusto">Preço de custo (R$)</Label>
              <Input
                id="precoCusto"
                name="precoCusto"
                type="number"
                step="0.01"
                min="0"
                defaultValue={values.precoCusto}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="precoVenda">Preço de venda (R$)</Label>
              <Input
                id="precoVenda"
                name="precoVenda"
                type="number"
                step="0.01"
                min="0"
                defaultValue={values.precoVenda}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="quantidade">Quantidade em estoque</Label>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                step="1"
                min="0"
                defaultValue={values.quantidade}
                disabled={isEdit}
              />
              {isEdit && (
                <p className="mt-1 text-xs text-muted">
                  Use Movimentações para alterar o saldo de uma peça existente.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
              <Input
                id="estoqueMinimo"
                name="estoqueMinimo"
                type="number"
                step="1"
                min="0"
                defaultValue={values.estoqueMinimo}
              />
            </div>

            <div>
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                name="localizacao"
                defaultValue={values.localizacao}
                placeholder="Ex.: Prateleira A3"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="compatibilidade">Compatibilidade</Label>
            <Textarea
              id="compatibilidade"
              name="compatibilidade"
              defaultValue={values.compatibilidade}
              placeholder="Modelos e anos compatíveis..."
              rows={3}
            />
          </div>
        </CardBody>
      </Card>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/painel/estoque")}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar peça"}
        </Button>
      </div>
    </form>
  );
}
