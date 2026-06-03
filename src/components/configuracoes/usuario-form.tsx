"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { createUsuario, updateUsuario } from "@/server/configuracoes";

const ALL_ROLES: Role[] = [
  "ADMINISTRADOR",
  "ATENDENTE",
  "MECANICO",
  "FINANCEIRO",
  "ESTOQUE",
];

type Mode = "novo" | "editar";

export function UsuarioForm({
  mode,
  usuario,
}: {
  mode: Mode;
  usuario?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    ativo: boolean;
    telefone: string | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [name, setName] = useState(usuario?.name ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [telefone, setTelefone] = useState(usuario?.telefone ?? "");
  const [role, setRole] = useState<Role>(usuario?.role ?? "ATENDENTE");
  const [ativo, setAtivo] = useState<boolean>(usuario?.ativo ?? true);
  const [senha, setSenha] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const res =
        mode === "novo"
          ? await createUsuario({
              name,
              email,
              role,
              ativo,
              telefone,
              senha,
            })
          : await updateUsuario({
              id: usuario!.id,
              name,
              email,
              role,
              ativo,
              telefone,
            });

      if (!res.ok) {
        setErro(res.error);
        return;
      }
      router.push("/configuracoes");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardBody className="space-y-4">
          {erro && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" required>
                Nome completo
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: João da Silva"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" required>
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@irmaoszimmer.com.br"
                required
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(51) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="role" required>
                Função
              </Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>

            {mode === "novo" && (
              <div className="sm:col-span-2">
                <Label htmlFor="senha" required>
                  Senha
                </Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                />
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[var(--color-accent,#00a651)] cursor-pointer"
            />
            <span className="text-sm">
              <span className="font-medium text-foreground">Usuário ativo</span>
              <span className="block text-xs text-muted">
                Usuários inativos não conseguem acessar o sistema.
              </span>
            </span>
          </label>
        </CardBody>

        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={pending}
          >
            <ArrowLeft className="h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            <Save className="h-4 w-4" />
            {mode === "novo" ? "Cadastrar usuário" : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
