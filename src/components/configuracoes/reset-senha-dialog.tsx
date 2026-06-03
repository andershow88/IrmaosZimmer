"use client";

import { useEffect, useState, useTransition } from "react";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/server/configuracoes";

export function ResetSenhaDialog({
  open,
  usuarioNome,
  onClose,
  onSubmit,
}: {
  open: boolean;
  usuarioNome: string;
  onClose: () => void;
  onSubmit: (senha: string) => Promise<ActionResult>;
}) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setSenha("");
      setErro(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleConfirm() {
    if (senha.length < 6) {
      setErro("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      const res = await onSubmit(senha);
      if (!res.ok) {
        setErro(res.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-senha-title"
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-elevated p-5 shadow-xl animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface hover:text-foreground transition cursor-pointer"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="pt-0.5">
            <h2 id="reset-senha-title" className="text-base font-bold text-foreground">
              Redefinir senha
            </h2>
            {usuarioNome && (
              <p className="mt-1 text-sm text-muted">
                Defina uma nova senha para {usuarioNome}.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="reset-senha-input" required>
            Nova senha
          </Label>
          <Input
            id="reset-senha-input"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
            }}
          />
          {erro && <p className="mt-1.5 text-xs text-danger">{erro}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={pending}>
            Redefinir senha
          </Button>
        </div>
      </div>
    </div>
  );
}
