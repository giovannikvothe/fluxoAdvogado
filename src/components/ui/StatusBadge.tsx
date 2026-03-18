import type { StatusDemanda, StatusEtapaDemanda } from "../../types/domain";
import { STATUS_DEMANDA_LABEL, STATUS_ETAPA_LABEL } from "../../types/domain";
import { cn } from "../../lib/utils";

type StatusBadgeProps = {
  status: StatusDemanda | StatusEtapaDemanda;
  className?: string;
};

const STATUS_CLASS: Record<StatusDemanda | StatusEtapaDemanda, string> = {
  nao_iniciada: "neutral",
  em_andamento: "info",
  aguardando_retorno: "warning",
  finalizada: "success",
  cancelada: "danger",
  concluida: "success",
  bloqueada: "danger",
  aguardando_terceiro: "warning",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_DEMANDA_LABEL[status as StatusDemanda] ?? STATUS_ETAPA_LABEL[status as StatusEtapaDemanda];

  return <span className={cn("status-badge", STATUS_CLASS[status], className)}>{label}</span>;
}

