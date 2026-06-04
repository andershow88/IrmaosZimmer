"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  CalendarX2,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { maskTelefone, maskPlaca } from "@/lib/masks";
import { SERVICE_CATEGORIES } from "@/components/site/site-data";

type Status = "idle" | "loading" | "success" | "error";
type SlotsStatus = "idle" | "loading" | "ready" | "empty" | "error";

type Slot = { hora: string; disponivel: boolean; vagasRestantes: number };

type ApiResponse = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

type SlotsResponse = {
  ok?: boolean;
  error?: string;
  slots?: Slot[];
};

type AgendarFormProps = {
  /** Data mínima selecionável "YYYY-MM-DD" (hoje + antecedência). */
  minData: string;
  /** Data máxima selecionável "YYYY-MM-DD" (hoje + janela máxima). */
  maxData: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

export function AgendarForm({ minData, maxData }: AgendarFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Campos controlados que precisam de máscara.
  const [telefone, setTelefone] = useState("");
  const [placa, setPlaca] = useState("");
  // Honeypot (oculto) — humanos deixam vazio.
  const [website, setWebsite] = useState("");

  // Seleção de data/hora amigável.
  const [data, setData] = useState("");
  const [horaSelecionada, setHoraSelecionada] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsStatus, setSlotsStatus] = useState<SlotsStatus>("idle");
  const [slotsErro, setSlotsErro] = useState<string | null>(null);

  // Ao escolher uma data, busca os horários livres daquele dia.
  useEffect(() => {
    if (!data) {
      setSlots([]);
      setSlotsStatus("idle");
      setSlotsErro(null);
      return;
    }

    setHoraSelecionada("");
    setSlots([]);
    setSlotsErro(null);
    setSlotsStatus("loading");

    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/agendar/slots?data=${encodeURIComponent(data)}`,
          { signal: ctrl.signal }
        );
        const json = (await res.json().catch(() => ({}))) as SlotsResponse;

        if (!res.ok || !json.ok || !Array.isArray(json.slots)) {
          setSlotsStatus("error");
          setSlotsErro(
            json.error ?? "Não foi possível carregar os horários desta data."
          );
          return;
        }

        // Mostra apenas horários com vaga (disponivel = true).
        const livres = json.slots.filter((s) => s.disponivel);
        setSlots(livres);
        setSlotsStatus(livres.length > 0 ? "ready" : "empty");
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        setSlotsStatus("error");
        setSlotsErro(
          "Falha ao carregar os horários. Verifique a conexão e tente novamente."
        );
      }
    })();

    return () => ctrl.abort();
  }, [data]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    // Garante data + hora antes de enviar.
    if (!data || !horaSelecionada) {
      setStatus("error");
      setFieldErrors({ dataHora: "Escolha uma data e um horário disponível." });
      setErro("Escolha uma data e um horário disponível.");
      return;
    }

    setStatus("loading");
    setErro(null);
    setFieldErrors({});

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      nome: String(fd.get("nome") ?? ""),
      telefone: String(fd.get("telefone") ?? ""),
      email: String(fd.get("email") ?? ""),
      marca: String(fd.get("marca") ?? ""),
      modelo: String(fd.get("modelo") ?? ""),
      placa: String(fd.get("placa") ?? ""),
      servicoDesejado: String(fd.get("servicoDesejado") ?? ""),
      data,
      hora: horaSelecionada,
      mensagem: String(fd.get("mensagem") ?? ""),
      consentimento: fd.get("consentimento") === "on",
      website: String(fd.get("website") ?? ""),
    };

    try {
      const res = await fetch("/api/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as ApiResponse;

      if (!res.ok || !json.ok) {
        setStatus("error");
        setFieldErrors(json.fieldErrors ?? {});
        setErro(
          json.error ??
            "Não foi possível enviar a sua solicitação agora. Tente novamente."
        );
        // O horário pode ter sido preenchido por outra pessoa: limpa a seleção
        // e recarrega a grade da data atual (refetch via toggle do estado).
        if ((json.fieldErrors?.dataHora || json.fieldErrors?.hora) && data) {
          setHoraSelecionada("");
          const atual = data;
          setData("");
          requestAnimationFrame(() => setData(atual));
        }
        return;
      }

      setStatus("success");
      form.reset();
      setTelefone("");
      setPlaca("");
      setData("");
      setHoraSelecionada("");
      setSlots([]);
      setSlotsStatus("idle");
    } catch {
      setStatus("error");
      setErro(
        "Falha de conexão. Verifique sua internet e tente novamente em instantes."
      );
    }
  }

  if (status === "success") {
    return (
      <Card className="overflow-hidden">
        <CardBody className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Recebemos a sua solicitação!
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Entraremos em contato para confirmar o seu horário. Obrigado por
            escolher a Irmãos Zimmer.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setStatus("idle")}
          >
            Fazer outra solicitação
          </Button>
        </CardBody>
      </Card>
    );
  }

  const loading = status === "loading";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardBody className="space-y-5">
          {status === "error" && erro && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {erro}
            </div>
          )}

          {/* Honeypot anti-spam — oculto a usuários reais */}
          <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
            <label htmlFor="website">Não preencha este campo</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {/* Data e horário — destaque no topo */}
          <div className="rounded-xl border border-accent/30 bg-accent-soft/40 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarCheck className="h-4 w-4 text-accent" />
              Quando você quer ser atendido?
            </h3>

            <div className="mt-4">
              <Label htmlFor="data" required>
                Escolha a data
              </Label>
              <Input
                id="data"
                name="data"
                type="date"
                min={minData}
                max={maxData}
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={loading}
                className="max-w-xs"
              />
              <FieldError message={fieldErrors.data} />
            </div>

            {/* Horários (chips) */}
            {data && (
              <div className="mt-4">
                <Label required>Escolha o horário</Label>

                {slotsStatus === "loading" && (
                  <div className="flex items-center gap-2 py-3 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando horários livres...
                  </div>
                )}

                {slotsStatus === "error" && (
                  <div className="mt-1 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {slotsErro}
                  </div>
                )}

                {slotsStatus === "empty" && (
                  <div className="mt-1 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-bg-elevated px-4 py-6 text-center">
                    <CalendarX2 className="h-7 w-7 text-muted" />
                    <p className="text-sm font-medium text-foreground">
                      Nenhum horário livre nesta data
                    </p>
                    <p className="text-xs text-muted">
                      Tente escolher outro dia.
                    </p>
                  </div>
                )}

                {slotsStatus === "ready" && (
                  <>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {slots.map((s) => {
                        const ativo = horaSelecionada === s.hora;
                        return (
                          <button
                            key={s.hora}
                            type="button"
                            disabled={loading}
                            onClick={() => setHoraSelecionada(s.hora)}
                            aria-pressed={ativo}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                              ativo
                                ? "border-accent bg-accent text-white shadow-sm"
                                : "border-border bg-bg-elevated text-foreground hover:border-accent hover:bg-accent-soft",
                              loading && "cursor-not-allowed opacity-60"
                            )}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {s.hora}
                          </button>
                        );
                      })}
                    </div>
                    <FieldError message={fieldErrors.dataHora ?? fieldErrors.hora} />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dados de contato */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nome" required>
                Nome completo
              </Label>
              <Input
                id="nome"
                name="nome"
                placeholder="Ex.: João da Silva"
                autoComplete="name"
                disabled={loading}
              />
              <FieldError message={fieldErrors.nome} />
            </div>

            <div>
              <Label htmlFor="telefone" required>
                Telefone / WhatsApp
              </Label>
              <Input
                id="telefone"
                name="telefone"
                type="tel"
                inputMode="numeric"
                placeholder="(51) 99999-9999"
                autoComplete="tel"
                value={telefone}
                onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                disabled={loading}
              />
              <FieldError message={fieldErrors.telefone} />
            </div>

            <div>
              <Label htmlFor="email">E-mail (opcional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={loading}
              />
              <FieldError message={fieldErrors.email} />
            </div>
          </div>

          {/* Veículo (opcional) */}
          <div className="rounded-xl border border-border bg-surface/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Seu veículo{" "}
              <span className="font-normal text-muted">(opcional)</span>
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  name="marca"
                  placeholder="Ex.: Volkswagen"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  name="modelo"
                  placeholder="Ex.: Gol 1.6"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  name="placa"
                  placeholder="ABC-1234"
                  autoCapitalize="characters"
                  value={placa}
                  onChange={(e) => setPlaca(maskPlaca(e.target.value))}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Serviço desejado */}
          <div>
            <Label htmlFor="servicoDesejado">Serviço desejado</Label>
            <Select id="servicoDesejado" name="servicoDesejado" defaultValue="" disabled={loading}>
              <option value="">Selecione (opcional)</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <optgroup key={cat.slug} label={cat.titulo}>
                  {cat.itens.map((item) => (
                    <option key={`${cat.slug}-${item}`} value={`${cat.titulo} — ${item}`}>
                      {item}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="Outro / Não sei">Outro / Não tenho certeza</option>
            </Select>
            <FieldError message={fieldErrors.servicoDesejado} />
          </div>

          <div>
            <Label htmlFor="mensagem">Mensagem (opcional)</Label>
            <Textarea
              id="mensagem"
              name="mensagem"
              placeholder="Descreva o problema ou o que você precisa..."
              disabled={loading}
            />
            <FieldError message={fieldErrors.mensagem} />
          </div>

          {/* Consentimento LGPD */}
          <div>
            <label
              htmlFor="consentimento"
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface/40 p-4 text-sm text-foreground"
            >
              <input
                id="consentimento"
                name="consentimento"
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-accent"
                disabled={loading}
              />
              <span className="leading-relaxed text-muted">
                Autorizo a Irmãos Zimmer a usar os meus dados para entrar em
                contato e agendar o atendimento, conforme a Lei Geral de Proteção
                de Dados (LGPD).
                <span className="ml-0.5 text-danger">*</span>
              </span>
            </label>
            <FieldError message={fieldErrors.consentimento} />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CalendarCheck className="h-4 w-4" />
                Solicitar agendamento
              </>
            )}
          </Button>
        </CardBody>
      </Card>
    </form>
  );
}
