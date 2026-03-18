import type { StatusDemanda, StatusEtapaDemanda } from "../../types/domain";
import { STATUS_DEMANDA_LABEL, STATUS_ETAPA_LABEL } from "../../types/domain";
import { cn } from "../../lib/utils";
import { Badge } from "./badge";

type StatusBadgeProps = {
  status: StatusDemanda | StatusEtapaDemanda;
  className?: string;
};

const STATUS_CLASS: Record<StatusDemanda | StatusEtapaDemanda, string> = {
  nao_iniciada: "border-slate-300 bg-slate-100 text-slate-700",
  em_andamento: "border-sky-300 bg-sky-100 text-sky-700",
  aguardando_retorno: "border-amber-300 bg-amber-100 text-amber-800",
  finalizada: "border-emerald-300 bg-emerald-100 text-emerald-800",
  cancelada: "border-rose-300 bg-rose-100 text-rose-800",
  concluida: "border-emerald-300 bg-emerald-100 text-emerald-800",
  bloqueada: "border-rose-300 bg-rose-100 text-rose-800",
  aguardando_terceiro: "border-amber-300 bg-amber-100 text-amber-800",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label =
    STATUS_DEMANDA_LABEL[status as StatusDemanda] ??
    STATUS_ETAPA_LABEL[status as StatusEtapaDemanda];

  return (
    <Badge
      variant="outline"
      className={cn("font-semibold normal-case tracking-normal", STATUS_CLASS[status], className)}
    >
      {label}
    </Badge>
  );
}
