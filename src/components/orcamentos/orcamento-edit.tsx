"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2, Wrench, Package } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/dialog";
import { formatBRL } from "@/lib/utils";
import { updateOrcamento, addItem, removeItem } from "@/server/orcamentos";
import { ItensEditor, novoItemDraft, type ItemDraft } from "./itens-editor";
import type { OrcamentoView, ServicoOption, PecaOption } from "./types";

export function OrcamentoEdit({
  orcamento,
  servicos,
  pecas,
}: {
  orcamento: OrcamentoView;
  servicos: ServicoOption[];
  pecas: PecaOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [validade, setValidade] = useState(
    orcamento.validade ? orcamento.validade.slice(0, 10) : ""
  );
  const [desconto, setDesconto] = useState(orcamento.desconto);
  const [observacoes, setObservacoes] = useState(orcamento.observacoes ?? "");

  const [novos, setNovos] = useState<ItemDraft[]>([]);
  const [removendo, setRemovendo] = useState<string | null>(null);

  function salvarCabecalho() {
    setErro(null);
    startTransition(async () => {
      const res = await updateOrcamento({
        id: orcamento.id,
        validade: validade || null,
        desconto,
        observacoes: observacoes || null,
      });
      if (!res.ok) setErro(res.error);
      else router.push(`/painel/orcamentos/${orcamento.id}`);
    });
  }

  function adicionarNovos() {
    setErro(null);
    if (novos.length === 0) return;
    if (novos.some((i) => !i.descricao.trim())) {
      setErro("Preencha a descrição dos novos itens.");
      return;
    }
    startTransition(async () => {
      for (const i of novos) {
        const res = await addItem({
          quoteId: orcamento.id,
          tipo: i.tipo,
          serviceId: i.serviceId,
          partId: i.partId,
          descricao: i.descricao,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
        });
        if (!res.ok) {
          setErro(res.error);
          return;
        }
      }
      setNovos([]);
      router.refresh();
    });
  }

  function confirmarRemocao() {
    if (!removendo) return;
    setErro(null);
    startTransition(async () => {
      const res = await removeItem(removendo);
      if (!res.ok) setErro(res.error);
      setRemovendo(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Itens existentes */}
      <Card>
        <CardHeader>
          <CardTitle>Itens atuais</CardTitle>
        </CardHeader>
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Tipo</TH>
                <TH>Descrição</TH>
                <TH className="text-right">Qtd.</TH>
                <TH className="text-right">Preço unit.</TH>
                <TH className="text-right">Subtotal</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {orcamento.items.map((i) => (
                <TR key={i.id}>
                  <TD>
                    <Badge variant={i.tipo === "SERVICO" ? "accent" : "info"}>
                      {i.tipo === "SERVICO" ? (
                        <Wrench className="h-3 w-3" />
                      ) : (
                        <Package className="h-3 w-3" />
                      )}
                      {i.tipo === "SERVICO" ? "Serviço" : "Peça"}
                    </Badge>
                  </TD>
                  <TD className="font-medium">{i.descricao}</TD>
                  <TD className="text-right tabular-nums">{i.quantidade}</TD>
                  <TD className="text-right tabular-nums">
                    {formatBRL(i.precoUnitario)}
                  </TD>
                  <TD className="text-right font-semibold tabular-nums">
                    {formatBRL(i.subtotal)}
                  </TD>
                  <TD className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemovendo(i.id)}
                      aria-label="Remover item"
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      {/* Novos itens */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar itens</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {novos.length > 0 && (
            <ItensEditor
              itens={novos}
              onChange={setNovos}
              servicos={servicos}
              pecas={pecas}
            />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNovos([...novos, novoItemDraft()])}
            >
              <Plus className="h-4 w-4" />
              Novo item
            </Button>
            {novos.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={adicionarNovos}
                disabled={pending}
              >
                <Save className="h-4 w-4" />
                Salvar itens
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Condições */}
      <Card>
        <CardHeader>
          <CardTitle>Condições</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Validade</Label>
            <Input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
            />
          </div>
          <div>
            <Label>Desconto (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={desconto}
              onChange={(e) => setDesconto(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </CardBody>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/painel/orcamentos/${orcamento.id}`)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={salvarCabecalho} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>

      {erro && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {erro}
        </p>
      )}

      <ConfirmDialog
        open={removendo !== null}
        title="Remover item?"
        description="O item será removido do orçamento e o total recalculado."
        confirmLabel="Remover"
        variant="danger"
        loading={pending}
        onConfirm={confirmarRemocao}
        onCancel={() => setRemovendo(null)}
      />
    </div>
  );
}
