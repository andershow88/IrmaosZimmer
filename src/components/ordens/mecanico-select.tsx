"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { atribuirMecanico } from "@/server/ordens";

export type MecanicoOption = { id: string; name: string };

export function MecanicoSelect({
  serviceOrderId,
  mecanicoId,
  mecanicos,
}: {
  serviceOrderId: string;
  mecanicoId: string | null;
  mecanicos: MecanicoOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(mecanicoId ?? "");
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const novo = e.target.value;
    setValue(novo);
    setError(null);
    startTransition(async () => {
      const res = await atribuirMecanico(serviceOrderId, novo || null);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao atribuir mecânico.");
      }
    });
  }

  return (
    <div>
      <Select density="sm" value={value} onChange={onChange} disabled={pending}>
        <option value="">Não atribuído</option>
        {mecanicos.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </Select>
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
