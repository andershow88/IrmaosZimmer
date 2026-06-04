import {
  Wrench,
  CircuitBoard,
  Timer,
  Crosshair,
  SprayCan,
  Cog,
  Car,
  BellRing,
  Sun,
  Radar,
  Music,
  Lock,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

// Mapa de nomes (strings vindas de site-data) -> componentes lucide.
const ICONS: Record<string, LucideIcon> = {
  Wrench,
  CircuitBoard,
  Timer,
  Crosshair,
  SprayCan,
  Cog,
  Car,
  BellRing,
  Sun,
  Radar,
  Music,
  Lock,
  ShieldCheck,
};

export function SiteIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Wrench;
  return <Icon className={className} aria-hidden="true" />;
}
