"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";

/**
 * Botão flutuante de WhatsApp (sticky, canto inferior direito). Aparece após
 * rolar a página e reaproveita `waLink` para o link wa.me. Não renderiza nada
 * se não houver número configurado.
 */
export function FloatingWhatsApp({
  phone,
  message,
}: {
  phone: string | null;
  message?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!phone) return null;

  const href = waLink(
    phone,
    message ??
      "Olá! Vim pelo site da Irmãos Zimmer e gostaria de mais informações."
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className={cn(
        "fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[#25D366] text-white shadow-lg shadow-black/25 transition-all",
        "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
