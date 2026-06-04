import { Sparkles, Bot, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isAIAvailable } from "@/lib/ai/client";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { AssistantChat } from "@/components/assistente/chat";
import { QuickActions } from "@/components/assistente/quick-actions";

export const dynamic = "force-dynamic";

export default async function AssistentePage() {
  await requireUser();
  const aiOn = isAIAvailable();

  return (
    <div>
      <PageHeader
        title="Assistente AI"
        description="Consulte os dados da oficina e gere comunicações com apoio de IA."
        icon={Sparkles}
        action={
          aiOn ? (
            <Badge variant="success">
              <Bot className="h-3 w-3" /> IA ativa
            </Badge>
          ) : (
            <Badge variant="warning">
              <Info className="h-3 w-3" /> Modo demonstração
            </Badge>
          )
        }
      />

      {!aiOn && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            A chave de IA não está configurada. O assistente responde em{" "}
            <strong>modo demonstração</strong>, usando os dados reais do sistema. Para
            respostas completas em linguagem natural, defina a variável{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">
              OPENAI_API_KEY
            </code>
            .
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AssistantChat />
        </div>
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
