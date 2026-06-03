"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnexoUploadProps {
  /** Ao menos um dos vínculos deve ser informado. */
  serviceOrderId?: string;
  vehicleId?: string;
  inspectionId?: string;
  /** Rótulo do botão. */
  label?: string;
}

/**
 * Upload de anexos (imagens/PDF) via FormData -> /api/upload.
 * Permite múltiplos arquivos; envia um a um para feedback claro de erro.
 */
export function AnexoUpload({
  serviceOrderId,
  vehicleId,
  inspectionId,
  label = "Enviar arquivo",
}: AnexoUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function enviarArquivo(file: File): Promise<void> {
    const fd = new FormData();
    fd.set("file", file);
    if (serviceOrderId) fd.set("serviceOrderId", serviceOrderId);
    if (vehicleId) fd.set("vehicleId", vehicleId);
    if (inspectionId) fd.set("inspectionId", inspectionId);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      let msg = "Falha ao enviar o arquivo.";
      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) msg = data.error;
      } catch {
        // resposta sem JSON — mantém mensagem padrão.
      }
      throw new Error(msg);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);

    startTransition(async () => {
      try {
        for (const file of files) {
          await enviarArquivo(file);
        }
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao enviar o arquivo."
        );
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        multiple
        className="hidden"
        onChange={handleChange}
        disabled={pending}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {pending ? "Enviando…" : label}
      </Button>

      <p className="mt-1.5 text-xs text-subtle">
        Imagens (JPG, PNG, WEBP, GIF) ou PDF — até 10 MB cada.
      </p>

      {error && (
        <p className="mt-1 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
