"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardBody } from "@/components/ui/card";
import { maskCPFCNPJ, maskTelefone, maskCEP } from "@/lib/masks";
import {
  createCliente,
  updateCliente,
  type ClienteInput,
} from "@/server/clientes";

export type ClienteFormValues = {
  id?: string;
  nome: string;
  tipoPessoa: "FISICA" | "JURIDICA";
  cpfCnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
  lgpdConsent: boolean;
};

const EMPTY: ClienteFormValues = {
  nome: "",
  tipoPessoa: "FISICA",
  cpfCnpj: "",
  telefone: "",
  whatsapp: "",
  email: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  observacoes: "",
  lgpdConsent: false,
};

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export function ClienteForm({
  initial,
}: {
  initial?: Partial<ClienteFormValues> & { id?: string };
}) {
  const router = useRouter();
  const [values, setValues] = useState<ClienteFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(initial?.id);

  function set<K extends keyof ClienteFormValues>(
    key: K,
    value: ClienteFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    const payload: ClienteInput = {
      nome: values.nome,
      tipoPessoa: values.tipoPessoa,
      cpfCnpj: values.cpfCnpj || null,
      telefone: values.telefone || null,
      whatsapp: values.whatsapp || null,
      email: values.email || null,
      endereco: values.endereco || null,
      cidade: values.cidade || null,
      estado: values.estado || null,
      cep: values.cep || null,
      observacoes: values.observacoes || null,
      lgpdConsent: values.lgpdConsent,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateCliente(initial!.id!, payload)
        : await createCliente(payload);

      if (result.ok) {
        router.push(`/clientes/${result.id}`);
        router.refresh();
        return;
      }
      setFormError(result.error);
      if (result.fieldErrors) setErrors(result.fieldErrors);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {formError}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nome" required>
                Nome / Razão social
              </Label>
              <Input
                id="nome"
                value={values.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Nome completo do cliente"
                autoFocus
              />
              {errors.nome && <FieldError msg={errors.nome} />}
            </div>

            <div>
              <Label htmlFor="tipoPessoa" required>
                Tipo de pessoa
              </Label>
              <Select
                id="tipoPessoa"
                value={values.tipoPessoa}
                onChange={(e) =>
                  set("tipoPessoa", e.target.value as "FISICA" | "JURIDICA")
                }
              >
                <option value="FISICA">Pessoa física</option>
                <option value="JURIDICA">Pessoa jurídica</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="cpfCnpj">
                {values.tipoPessoa === "FISICA" ? "CPF" : "CNPJ"}
              </Label>
              <Input
                id="cpfCnpj"
                inputMode="numeric"
                value={values.cpfCnpj}
                onChange={(e) => set("cpfCnpj", maskCPFCNPJ(e.target.value))}
                placeholder={
                  values.tipoPessoa === "FISICA"
                    ? "000.000.000-00"
                    : "00.000.000/0000-00"
                }
              />
              {errors.cpfCnpj && <FieldError msg={errors.cpfCnpj} />}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-sm font-semibold text-muted">Contato</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                inputMode="numeric"
                value={values.telefone}
                onChange={(e) => set("telefone", maskTelefone(e.target.value))}
                placeholder="(00) 0000-0000"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                inputMode="numeric"
                value={values.whatsapp}
                onChange={(e) => set("whatsapp", maskTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="cliente@email.com"
              />
              {errors.email && <FieldError msg={errors.email} />}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-sm font-semibold text-muted">Endereço</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={values.endereco}
                onChange={(e) => set("endereco", e.target.value)}
                placeholder="Rua, número, complemento"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                inputMode="numeric"
                value={values.cep}
                onChange={(e) => set("cep", maskCEP(e.target.value))}
                placeholder="00000-000"
              />
            </div>
            <div className="sm:col-span-4">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={values.cidade}
                onChange={(e) => set("cidade", e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="estado">UF</Label>
              <Select
                id="estado"
                value={values.estado}
                onChange={(e) => set("estado", e.target.value)}
              >
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={values.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Anotações internas sobre o cliente"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border bg-surface/40 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={values.lgpdConsent}
              onChange={(e) => set("lgpdConsent", e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-accent"
            />
            <span className="text-sm text-foreground">
              O cliente autorizou o uso dos seus dados pessoais (LGPD) para
              contato e prestação de serviços.
            </span>
          </label>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending
            ? "Salvando..."
            : isEdit
              ? "Salvar alterações"
              : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1 text-xs font-medium text-danger">{msg}</p>;
}
