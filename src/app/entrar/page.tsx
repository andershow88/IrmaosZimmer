import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar · ZimmerOS AI",
};

export default async function EntrarPage() {
  const session = await getSession();
  if (session) redirect("/painel");

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-6 py-12">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo.png"
            alt="Mecânica Irmãos Zimmer"
            className="logo-plate w-64 max-w-full"
          />
          <p className="text-sm text-muted text-center">
            Gestão Inteligente para Oficina Mecânica
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
