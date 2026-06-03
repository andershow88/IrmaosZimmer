import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Info } from "lucide-react";

const DADOS = [
  { label: "Razão social", value: "Irmãos Zimmer LTDA" },
  { label: "Nome fantasia", value: "Irmãos Zimmer" },
  { label: "Cidade / UF", value: "Santa Maria do Herval / RS" },
];

export function OficinaSecao() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Building2 className="h-5 w-5" />
            </div>
            <CardTitle>Dados da oficina</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <dl className="divide-y divide-border">
            {DADOS.map((d) => (
              <div
                key={d.label}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <dt className="text-sm text-muted">{d.label}</dt>
                <dd className="text-sm font-medium text-foreground text-right">
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center gap-2 rounded-xl bg-surface/50 px-3 py-2 text-sm text-muted">
            <MapPin className="h-4 w-4 shrink-0 text-accent" />
            Santa Maria do Herval, Rio Grande do Sul
          </div>
        </CardBody>
      </Card>

      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-bg-elevated/40 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="text-sm text-muted">
          <span className="font-medium text-foreground">Em construção.</span>{" "}
          A edição dos dados cadastrais da oficina (CNPJ, endereço completo,
          contatos, horários e logotipo) será disponibilizada em breve.
          <div className="mt-2">
            <Badge variant="outline">TODO</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
