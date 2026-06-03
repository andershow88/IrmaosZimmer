import Link from "next/link";
import { UserPlus, ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ClienteForm } from "@/components/clientes/cliente-form";

export const dynamic = "force-dynamic";

export default async function NovoClientePage() {
  await requireUser();

  return (
    <div>
      <PageHeader
        title="Novo cliente"
        description="Cadastre um novo cliente da oficina."
        icon={UserPlus}
        action={
          <Link href="/clientes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />
      <ClienteForm />
    </div>
  );
}
