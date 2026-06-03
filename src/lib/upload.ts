import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Salva uploads no diretório público local (single-instance: IIS/Railway).
// Para múltiplas instâncias ou storage durável, troque por S3/Blob mantendo
// a mesma assinatura.

/** Diretório físico onde os arquivos são gravados. */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Prefixo público (URL) servido pelo Next a partir de /public. */
const PUBLIC_PREFIX = "/uploads";

/** Tamanho máximo permitido por arquivo (10 MB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Tipos MIME permitidos -> extensão usada no arquivo salvo. */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export type UploadResult = {
  /** URL pública do arquivo, ex.: "/uploads/abc.png". */
  url: string;
  /** Nome do arquivo gravado (sem caminho). */
  nome: string;
  /** MIME type aceito. */
  tipo: string;
  /** Tamanho em bytes. */
  tamanho: number;
};

function sanitizeBaseName(name: string): string {
  return (name || "arquivo")
    .replace(/\.[^.]+$/, "") // remove extensão original
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "arquivo";
}

/**
 * Salva um File (Web API, vindo de FormData) em /public/uploads.
 * Valida tipo e tamanho. Lança Error (pt-BR) em caso de violação.
 * Retorna a URL pública e metadados.
 */
export async function saveUpload(file: File): Promise<UploadResult> {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Arquivo inválido.");
  }

  const tipo = file.type || "";
  const ext = ALLOWED_TYPES[tipo];
  if (!ext) {
    throw new Error(
      "Tipo de arquivo não permitido. Envie uma imagem (JPG, PNG, WEBP, GIF) ou PDF."
    );
  }

  if (file.size <= 0) {
    throw new Error("Arquivo vazio.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Arquivo muito grande. O limite é de 10 MB.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const base = sanitizeBaseName(file.name);
  const nome = `${base}-${randomUUID()}.${ext}`;
  const destino = path.join(UPLOAD_DIR, nome);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(destino, buffer);

  return {
    url: `${PUBLIC_PREFIX}/${nome}`,
    nome,
    tipo,
    tamanho: file.size,
  };
}

/**
 * Salva múltiplos arquivos. Ignora entradas inválidas individualmente?
 * Não — propaga o primeiro erro (validação) para feedback claro ao usuário.
 */
export async function saveUploads(files: File[]): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  for (const f of files) {
    results.push(await saveUpload(f));
  }
  return results;
}
