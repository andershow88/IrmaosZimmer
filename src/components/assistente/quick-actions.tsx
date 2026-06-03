"use client";

import { useState, type FormEvent } from "react";
import {
  Wrench,
  MessageSquareText,
  Search,
  Loader2,
  ChevronRight,
  Car,
  ClipboardList,
  Package,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionModal } from "@/components/assistente/action-modal";
import { ResultBox } from "@/components/assistente/result-box";
import {
  acaoSugerirManutencao,
  acaoGerarMensagemCliente,
  acaoBuscarEmDados,
} from "@/server/assistente-actions";
import type { SearchHit } from "@/server/assistente";

type ActiveAction = "manutencao" | "mensagem" | "busca" | null;

export function QuickActions() {
  const [active, setActive] = useState<ActiveAction>(null);

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-foreground">Ações rápidas</p>
      <div className="grid grid-cols-1 gap-3">
        <ActionCard
          icon={Wrench}
          title="Sugerir manutenção"
          description="Recomendações preventivas por quilometragem"
          onClick={() => setActive("manutencao")}
        />
        <ActionCard
          icon={MessageSquareText}
          title="Gerar mensagem ao cliente"
          description="Texto cordial pronto para WhatsApp"
          onClick={() => setActive("mensagem")}
        />
        <ActionCard
          icon={Search}
          title="Buscar em dados"
          description="Clientes, veículos, OS e peças"
          onClick={() => setActive("busca")}
        />
      </div>

      <ManutencaoModal open={active === "manutencao"} onClose={() => setActive(null)} />
      <MensagemModal open={active === "mensagem"} onClose={() => setActive(null)} />
      <BuscaModal open={active === "busca"} onClose={() => setActive(null)} />
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card className="cursor-pointer transition hover:border-accent/50 hover:shadow-md">
      <CardBody className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <button type="button" onClick={onClick} className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted">{description}</p>
        </button>
        <ChevronRight className="h-4 w-4 text-muted" />
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sugerir manutenção
// ---------------------------------------------------------------------------

function ManutencaoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [veiculo, setVeiculo] = useState("");
  const [km, setKm] = useState("");
  const [historico, setHistorico] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  function reset() {
    setVeiculo("");
    setKm("");
    setHistorico("");
    setError(null);
    setResultado(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResultado(null);
    const kmNum = Number(km.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(kmNum) || kmNum < 0) {
      setError("Informe uma quilometragem válida.");
      return;
    }
    setLoading(true);
    const res = await acaoSugerirManutencao({
      veiculo: veiculo || undefined,
      km: kmNum,
      historico: historico || undefined,
    });
    setLoading(false);
    if (res.ok) setResultado(res.data.texto);
    else setError(res.error);
  }

  return (
    <ActionModal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      icon={Wrench}
      title="Sugerir manutenção"
      description="Recomendações preventivas com base na quilometragem."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="man-veiculo">Veículo</Label>
          <Input
            id="man-veiculo"
            value={veiculo}
            onChange={(e) => setVeiculo(e.target.value)}
            placeholder="Ex.: Volkswagen Gol 2018"
          />
        </div>
        <div>
          <Label htmlFor="man-km" required>
            Quilometragem atual
          </Label>
          <Input
            id="man-km"
            inputMode="numeric"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            placeholder="Ex.: 80000"
          />
        </div>
        <div>
          <Label htmlFor="man-hist">Histórico recente (opcional)</Label>
          <Textarea
            id="man-hist"
            value={historico}
            onChange={(e) => setHistorico(e.target.value)}
            placeholder={"Uma linha por item. Ex.:\nTroca de óleo há 6 meses\nPastilhas trocadas em 2024"}
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
          {loading ? "Gerando..." : "Gerar sugestão"}
        </Button>
      </form>

      {resultado && <ResultBox content={resultado} />}
    </ActionModal>
  );
}

// ---------------------------------------------------------------------------
// Gerar mensagem ao cliente
// ---------------------------------------------------------------------------

function MensagemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cliente, setCliente] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [assunto, setAssunto] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  function reset() {
    setCliente("");
    setVeiculo("");
    setAssunto("");
    setDetalhes("");
    setError(null);
    setResultado(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResultado(null);
    if (!cliente.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }
    if (!assunto.trim()) {
      setError("Informe o assunto da mensagem.");
      return;
    }
    setLoading(true);
    const res = await acaoGerarMensagemCliente({
      cliente,
      veiculo: veiculo || undefined,
      assunto,
      detalhes: detalhes || undefined,
    });
    setLoading(false);
    if (res.ok) setResultado(res.data.texto);
    else setError(res.error);
  }

  return (
    <ActionModal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      icon={MessageSquareText}
      title="Gerar mensagem ao cliente"
      description="Mensagem cordial pronta para enviar ao cliente."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="msg-cliente" required>
            Cliente
          </Label>
          <Input
            id="msg-cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Ex.: João Silva"
          />
        </div>
        <div>
          <Label htmlFor="msg-veiculo">Veículo</Label>
          <Input
            id="msg-veiculo"
            value={veiculo}
            onChange={(e) => setVeiculo(e.target.value)}
            placeholder="Ex.: Fiat Uno 2015"
          />
        </div>
        <div>
          <Label htmlFor="msg-assunto" required>
            Assunto
          </Label>
          <Input
            id="msg-assunto"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Ex.: Veículo pronto para retirada"
          />
        </div>
        <div>
          <Label htmlFor="msg-detalhes">Detalhes (opcional)</Label>
          <Textarea
            id="msg-detalhes"
            value={detalhes}
            onChange={(e) => setDetalhes(e.target.value)}
            placeholder="Informações adicionais para a mensagem."
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquareText className="h-4 w-4" />
          )}
          {loading ? "Gerando..." : "Gerar mensagem"}
        </Button>
      </form>

      {resultado && <ResultBox content={resultado} />}
    </ActionModal>
  );
}

// ---------------------------------------------------------------------------
// Buscar em dados
// ---------------------------------------------------------------------------

const HIT_ICONS: Record<SearchHit["tipo"], LucideIcon> = {
  Cliente: Users,
  Veículo: Car,
  "Ordem de serviço": ClipboardList,
  Peça: Package,
};

function BuscaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [termo, setTermo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<SearchHit[] | null>(null);

  function reset() {
    setTermo("");
    setError(null);
    setHits(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setHits(null);
    if (!termo.trim()) {
      setError("Digite um termo para buscar.");
      return;
    }
    setLoading(true);
    const res = await acaoBuscarEmDados(termo);
    setLoading(false);
    if (res.ok) setHits(res.data.hits);
    else setError(res.error);
  }

  return (
    <ActionModal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      icon={Search}
      title="Buscar em dados"
      description="Procure por clientes, veículos, ordens de serviço e peças."
    >
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Ex.: nome, placa, número da OS, código da peça"
          autoFocus
        />
        <Button type="submit" size="icon" disabled={loading} className="h-11 w-11 shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {hits && hits.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={Search}
            title="Nada encontrado"
            message={`Nenhum resultado para "${termo}". Tente outro termo.`}
          />
        </div>
      )}

      {hits && hits.length > 0 && (
        <ul className="mt-4 space-y-2">
          {hits.map((hit, i) => {
            const Icon = HIT_ICONS[hit.tipo];
            return (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{hit.titulo}</p>
                    <Badge variant="outline">{hit.tipo}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{hit.detalhe}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ActionModal>
  );
}
