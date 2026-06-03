"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImprimirRecibo() {
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      Imprimir
    </Button>
  );
}
