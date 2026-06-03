"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/assistente/markdown";

type Role = "user" | "assistant";
type Message = { role: Role; content: string };

const SUGESTOES = [
  "Quantas ordens de serviço estão em aberto?",
  "Quais peças estão abaixo do estoque mínimo?",
  "Qual o valor total a receber?",
  "Resuma as ordens de serviço recentes.",
];

const BOAS_VINDAS: Message = {
  role: "assistant",
  content:
    "Olá! Sou o assistente da **Irmãos Zimmer**. Posso consultar os dados da oficina (clientes, veículos, ordens de serviço, peças e pagamentos) e ajudar a redigir mensagens. Como posso ajudar?",
};

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([BOAS_VINDAS]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text: string) {
    const pergunta = text.trim();
    if (!pergunta || loading) return;

    setError(null);
    const novaLista: Message[] = [...messages, { role: "user", content: pergunta }];
    setMessages(novaLista);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: novaLista.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };

      if (!res.ok || !data.reply) {
        setError(data.error ?? "Não foi possível obter uma resposta.");
        setLoading(false);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function limpar() {
    setMessages([BOAS_VINDAS]);
    setError(null);
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[28rem] flex-col rounded-2xl border border-border bg-bg-elevated shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Conversa</p>
            <p className="text-xs text-muted">Pergunte sobre os dados da oficina</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={limpar}
          disabled={messages.length <= 1 || loading}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar
        </Button>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-2.5 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Pensando...
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        {messages.length <= 1 && !loading && (
          <div className="pt-2">
            <p className="mb-2 text-xs font-medium text-muted">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent/50 hover:bg-accent-soft"
                >
                  <Sparkles className="h-3 w-3 text-accent" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entrada */}
      <form onSubmit={onSubmit} className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Digite sua pergunta... (Enter envia, Shift+Enter quebra linha)"
            rows={1}
            className="max-h-32 min-h-[2.75rem] resize-none"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="h-11 w-11 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          isUser ? "bg-surface-2 text-foreground" : "bg-accent-soft text-accent"
        )}
      >
        {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5",
          isUser
            ? "rounded-tr-sm bg-accent text-white"
            : "rounded-tl-sm border border-border bg-surface"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        ) : (
          <Markdown content={message.content} />
        )}
      </div>
    </div>
  );
}
