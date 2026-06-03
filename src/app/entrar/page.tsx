import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar · ZimmerOS AI",
};

export default async function EntrarPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-6 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/20">
            <Wrench className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ZimmerOS AI</h1>
          <p className="text-sm text-muted text-center">
            Gestão Inteligente para Oficina Mecânica
            <br />
            Irmãos Zimmer
          </p>
        </div>

        <LoginForm />

        <div className="rounded-xl border border-border bg-surface/50 px-4 py-3 text-center">
          <p className="text-xs font-medium text-foreground">Acesso de demonstração</p>
          <p className="mt-1 text-xs text-muted">
            E-mail: <span className="font-semibold text-foreground">admin@zimmer.com</span>
            <br />
            Senha: <span className="font-semibold text-foreground">zimmer123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
