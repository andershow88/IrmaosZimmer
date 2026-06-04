"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { maskPlaca } from "@/lib/masks";
import type { MarcaFipe, PrecoFipe } from "@/lib/lookups";
import { createVeiculo, updateVeiculo, type VeiculoActionState } from "@/server/veiculos";
import { COMBUSTIVEL_OPTIONS } from "@/components/veiculos/constants";

type TipoFipe = "carros" | "motos" | "caminhoes";

const TIPO_FIPE_OPTIONS: { value: TipoFipe; label: string }[] = [
  { value: "carros", label: "Carros" },
  { value: "motos", label: "Motos" },
  { value: "caminhoes", label: "Caminhões" },
];

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
  const [marca, setMarca] = useState(initial?.marca ?? "");

  // Auxílio FIPE: lista de marcas por tipo + consulta de valor por código FIPE.
  const [fipeTipo, setFipeTipo] = useState<TipoFipe>("carros");
  const [marcas, setMarcas] = useState<MarcaFipe[]>([]);
  const [marcasLoading, setMarcasLoading] = useState(false);
  const [fipeInfo, setFipeInfo] = useState<string | null>(null);

  const [codigoFipe, setCodigoFipe] = useState("");
  const [precoLoading, setPrecoLoading] = useState(false);
  const [precos, setPrecos] = useState<PrecoFipe[]>([]);
  const [precoInfo, setPrecoInfo] = useState<string | null>(null);

  async function carregarMarcas(tipo: TipoFipe) {
    setFipeInfo(null);
    setMarcasLoading(true);
    try {
      const res = await fetch(
        `/api/lookups?tipo=fipe&fipe=marcas&veiculo=${tipo}`
      );
      const json = (await res.json()) as { data?: MarcaFipe[]; error?: string };
      if (!res.ok || !json.data) {
        setFipeInfo(json.error ?? "Não foi possível carregar as marcas.");
        setMarcas([]);
        return;
      }
      setMarcas(json.data);
      if (json.data.length === 0) {
        setFipeInfo("Nenhuma marca retornada pela FIPE.");
      }
    } catch {
      setFipeInfo("Falha ao consultar a tabela FIPE. Tente novamente.");
      setMarcas([]);
    } finally {
      setMarcasLoading(false);
    }
  }

  async function consultarValorFipe() {
    const code = codigoFipe.trim();
    setPrecoInfo(null);
    setPrecos([]);
    if (!code) {
      setPrecoInfo("Informe o código FIPE (ex.: 001234-5).");
      return;
    }
    setPrecoLoading(true);
    try {
      const res = await fetch(
        `/api/lookups?tipo=fipe&fipe=preco&codigo=${encodeURIComponent(code)}`
      );
      const json = (await res.json()) as { data?: PrecoFipe[]; error?: string };
      if (!res.ok || !json.data || json.data.length === 0) {
        setPrecoInfo(json.error ?? "Nenhum valor FIPE encontrado.");
        return;
      }
      setPrecos(json.data);
    } catch {
      setPrecoInfo("Falha ao consultar o valor FIPE. Tente novamente.");
    } finally {
      setPrecoLoading(false);
    }
  }

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
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
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

          <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Auxílio FIPE
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                Consulte as marcas oficiais e o valor de referência FIPE. As
                marcas listadas podem ser aplicadas ao campo Marca acima.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fipeTipo">Tipo de veículo (FIPE)</Label>
                <div className="flex gap-2">
                  <Select
                    id="fipeTipo"
                    value={fipeTipo}
                    onChange={(e) => setFipeTipo(e.target.value as TipoFipe)}
                    className="flex-1"
                  >
                    {TIPO_FIPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => carregarMarcas(fipeTipo)}
                    disabled={marcasLoading}
                    className="shrink-0"
                  >
                    {marcasLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar marcas
                  </Button>
                </div>
              </div>

              {marcas.length > 0 && (
                <div>
                  <Label htmlFor="fipeMarca">Marca FIPE</Label>
                  <Select
                    id="fipeMarca"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                  >
                    <option value="">Selecione para aplicar à Marca</option>
                    {marcas.map((m) => (
                      <option key={m.codigo} value={m.nome}>
                        {m.nome}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            {fipeInfo && <p className="text-xs text-muted">{fipeInfo}</p>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="codigoFipe">Código FIPE (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="codigoFipe"
                    value={codigoFipe}
                    onChange={(e) => setCodigoFipe(e.target.value)}
                    placeholder="Ex.: 001234-5"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={consultarValorFipe}
                    disabled={precoLoading}
                    className="shrink-0"
                  >
                    {precoLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Ver valor
                  </Button>
                </div>
              </div>
            </div>

            {precoInfo && <p className="text-xs text-muted">{precoInfo}</p>}

            {precos.length > 0 && (
              <ul className="space-y-1 text-xs text-foreground">
                {precos.map((p, i) => (
                  <li
                    key={`${p.codigoFipe}-${p.ano}-${i}`}
                    className="rounded-lg border border-border bg-bg-elevated px-3 py-2"
                  >
                    <span className="font-semibold">{p.valor}</span>
                    {" — "}
                    {[p.marca, p.modelo].filter(Boolean).join(" ")}
                    {p.ano ? ` (${p.ano}` : ""}
                    {p.ano && p.combustivel ? ` · ${p.combustivel})` : p.ano ? ")" : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>

        <CardFooter className="flex justify-end gap-2">
          <Link href={veiculoId ? `/painel/veiculos/${veiculoId}` : "/painel/veiculos"}>
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
