"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Building2, Loader2, Save, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardBody } from "@/components/ui/card";
import { maskCPFCNPJ, maskTelefone } from "@/lib/masks";
import type { DadosCNPJ } from "@/lib/lookups";
import type { FornecedorActionState } from "@/server/fornecedores";

export type FornecedorFormValues = {
  nome: string;
  cnpj: string;
  contato: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  observacoes: string;
};

type Action = (
  prev: FornecedorActionState,
  formData: FormData
) => Promise<FornecedorActionState>;

const INITIAL_STATE: FornecedorActionState = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Save className="h-4 w-4" />
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function FornecedorForm({
  action,
  defaultValues,
  submitLabel = "Salvar fornecedor",
}: {
  action: Action;
  defaultValues?: Partial<FornecedorFormValues>;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  const [cnpj, setCnpj] = useState(defaultValues?.cnpj ?? "");
  const [telefone, setTelefone] = useState(defaultValues?.telefone ?? "");
  const [whatsapp, setWhatsapp] = useState(defaultValues?.whatsapp ?? "");
  const [nome, setNome] = useState(defaultValues?.nome ?? "");
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [endereco, setEndereco] = useState(defaultValues?.endereco ?? "");

  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjInfo, setCnpjInfo] = useState<string | null>(null);

  async function buscarCnpj() {
    const digits = cnpj.replace(/\D/g, "");
    setCnpjInfo(null);
    if (digits.length !== 14) {
      setCnpjInfo("Informe um CNPJ com 14 dígitos.");
      return;
    }
    setCnpjLoading(true);
    try {
      const res = await fetch(`/api/lookups?tipo=cnpj&cnpj=${digits}`);
      const json = (await res.json()) as { data?: DadosCNPJ; error?: string };
      if (!res.ok || !json.data) {
        setCnpjInfo(json.error ?? "CNPJ não encontrado.");
        return;
      }
      const d = json.data;
      if (d.nome) setNome(d.nome);
      if (d.endereco) {
        const cidadeUf = [d.cidade, d.uf].filter(Boolean).join("/");
        setEndereco([d.endereco, cidadeUf].filter(Boolean).join(", "));
      }
      setEmail((prev) => prev || d.email);
      setTelefone((prev) => prev || (d.telefone ? maskTelefone(d.telefone) : ""));
      setCnpjInfo("Dados preenchidos pelo CNPJ.");
    } catch {
      setCnpjInfo("Falha na consulta do CNPJ. Tente novamente.");
    } finally {
      setCnpjLoading(false);
    }
  }

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </div>
      )}

      <Card>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="nome" required>
              Nome do fornecedor
            </Label>
            <Input
              id="nome"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Auto Peças Central Ltda."
              autoFocus
              required
            />
            {fieldErrors.nome && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.nome}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <div className="flex gap-2">
              <Input
                id="cnpj"
                name="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(maskCPFCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={buscarCnpj}
                disabled={cnpjLoading}
                className="shrink-0"
              >
                {cnpjLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Buscar CNPJ
              </Button>
            </div>
            {fieldErrors.cnpj && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.cnpj}</p>
            )}
            {cnpjInfo && <p className="mt-1 text-xs text-muted">{cnpjInfo}</p>}
          </div>

          <div>
            <Label htmlFor="contato">Pessoa de contato</Label>
            <Input
              id="contato"
              name="contato"
              defaultValue={defaultValues?.contato ?? ""}
              placeholder="Ex.: Carlos (vendas)"
            />
            {fieldErrors.contato && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.contato}</p>
            )}
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              name="telefone"
              value={telefone}
              onChange={(e) => setTelefone(maskTelefone(e.target.value))}
              placeholder="(00) 0000-0000"
              inputMode="tel"
            />
            {fieldErrors.telefone && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.telefone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
            {fieldErrors.whatsapp && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.whatsapp}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@fornecedor.com.br"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              name="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade/UF"
            />
            {fieldErrors.endereco && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.endereco}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              defaultValue={defaultValues?.observacoes ?? ""}
              placeholder="Condições de pagamento, prazos de entrega, anotações..."
              rows={4}
            />
            {fieldErrors.observacoes && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.observacoes}</p>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Link href="/fornecedores" className={buttonVariants({ variant: "outline" })}>
          <Building2 className="h-4 w-4" />
          Cancelar
        </Link>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
