"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { maskCPFCNPJ, maskTelefone, maskCEP } from "@/lib/masks";
import { saveWorkshopSettings } from "@/server/configuracoes";
import type { WorkshopSettingsData } from "@/server/configuracoes";

export function OficinaForm({
  settings,
}: {
  settings: WorkshopSettingsData | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [nome, setNome] = useState(settings?.nome ?? "");
  const [cnpj, setCnpj] = useState(settings?.cnpj ?? "");
  const [endereco, setEndereco] = useState(settings?.endereco ?? "");
  const [cidade, setCidade] = useState(settings?.cidade ?? "");
  const [estado, setEstado] = useState(settings?.estado ?? "");
  const [cep, setCep] = useState(settings?.cep ?? "");
  const [telefone, setTelefone] = useState(settings?.telefone ?? "");
  const [whatsapp, setWhatsapp] = useState(settings?.whatsapp ?? "");
  const [email, setEmail] = useState(settings?.email ?? "");
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl ?? "");
  const [horarios, setHorarios] = useState(settings?.horarios ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(false);
    startTransition(async () => {
      const res = await saveWorkshopSettings({
        nome,
        cnpj,
        endereco,
        cidade,
        estado,
        cep,
        telefone,
        whatsapp,
        email,
        logoUrl,
        horarios,
      });
      if (!res.ok) {
        setErro(res.error);
        return;
      }
      setOk(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Building2 className="h-5 w-5" />
            </div>
            <CardTitle>Dados da oficina</CardTitle>
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
              Dados da oficina salvos com sucesso.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nome" required>
                Nome da oficina
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Irmãos Zimmer"
                required
              />
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(maskCPFCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@irmaoszimmer.com.br"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                placeholder="(51) 3000-0000"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskTelefone(e.target.value))}
                placeholder="(51) 99999-9999"
                inputMode="numeric"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Santa Maria do Herval"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estado">UF</Label>
                <Input
                  id="estado"
                  value={estado}
                  onChange={(e) =>
                    setEstado(e.target.value.toUpperCase().slice(0, 2))
                  }
                  placeholder="RS"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={cep}
                  onChange={(e) => setCep(maskCEP(e.target.value))}
                  placeholder="93180-000"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="logoUrl">URL do logotipo</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="horarios">Horários de atendimento</Label>
              <Textarea
                id="horarios"
                value={horarios}
                onChange={(e) => setHorarios(e.target.value)}
                placeholder="Seg. a Sex.: 08h às 18h&#10;Sáb.: 08h às 12h"
                rows={4}
              />
            </div>
          </div>
        </CardBody>

        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? "Salvando..." : "Salvar dados da oficina"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
