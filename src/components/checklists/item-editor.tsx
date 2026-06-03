"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { TD, TR } from "@/components/ui/table";
import { updateItem } from "@/server/checklists";
import { STATUS_OPCOES, type StatusItem } from "./constants";

export interface ItemEditorProps {
  id: string;
  item: string;
  status: StatusItem;
  observacao: string | null;
}

export function ItemEditor({ id, item, status, observacao }: ItemEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [statusDraft, setStatusDraft] = useState<StatusItem>(status);
  const [obsDraft, setObsDraft] = useState(observacao ?? "");

  function cancelar() {
    setStatusDraft(status);
    setObsDraft(observacao ?? "");
    setErro(null);
    setEditing(false);
  }

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const res = await updateItem({
        itemId: id,
        status: statusDraft,
        observacao: obsDraft.trim() || null,
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setErro(res.error);
      }
    });
  }

  if (!editing) {
    return (
      <TR>
        <TD className="font-medium">{item}</TD>
        <TD>
          <StatusBadge kind="inspecao" status={status} />
        </TD>
        <TD className="text-sm text-muted">
          {observacao?.trim() ? observacao : <span className="text-subtle">—</span>}
        </TD>
        <TD className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditing(true)}
            aria-label="Editar item"
            title="Editar item"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </TD>
      </TR>
    );
  }

  return (
    <TR>
      <TD className="font-medium">{item}</TD>
      <TD>
        <Select
          density="sm"
          value={statusDraft}
          onChange={(e) => setStatusDraft(e.target.value as StatusItem)}
          disabled={isPending}
        >
          {STATUS_OPCOES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </TD>
      <TD>
        <Input
          density="sm"
          value={obsDraft}
          onChange={(e) => setObsDraft(e.target.value)}
          placeholder="Observação"
          disabled={isPending}
        />
        {erro && <p className="mt-1 text-xs text-danger">{erro}</p>}
      </TD>
      <TD className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={salvar}
            disabled={isPending}
            aria-label="Salvar item"
            title="Salvar"
          >
            <Check className="h-4 w-4 text-success" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelar}
            disabled={isPending}
            aria-label="Cancelar edição"
            title="Cancelar"
          >
            <X className="h-4 w-4 text-muted" />
          </Button>
        </div>
      </TD>
    </TR>
  );
}
