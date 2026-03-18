import type { EtapaDemanda, StatusDemanda, StatusEtapaDemanda } from "../types/domain";

export const TRANSICOES_PERMITIDAS: Record<StatusEtapaDemanda, StatusEtapaDemanda[]> = {
  nao_iniciada: ["em_andamento", "bloqueada", "aguardando_terceiro", "cancelada"],
  em_andamento: ["concluida", "bloqueada", "aguardando_terceiro", "cancelada"],
  bloqueada: ["em_andamento", "cancelada"],
  aguardando_terceiro: ["em_andamento", "cancelada"],
  concluida: [],
  cancelada: [],
};

export function canTransitionStage(
  statusAtual: StatusEtapaDemanda,
  novoStatus: StatusEtapaDemanda,
): boolean {
  if (statusAtual === novoStatus) {
    return true;
  }

  return TRANSICOES_PERMITIDAS[statusAtual].includes(novoStatus);
}

export function hasMandatoryPendingStages(
  etapas: Array<Pick<EtapaDemanda, "obrigatoria" | "status">>,
): boolean {
  return etapas.some((etapa) => etapa.obrigatoria && etapa.status !== "concluida");
}

export function computeDemandStatus(etapas: EtapaDemanda[]): StatusDemanda {
  if (etapas.length === 0) {
    return "nao_iniciada";
  }

  const todasNaoIniciadas = etapas.every((etapa) => etapa.status === "nao_iniciada");
  if (todasNaoIniciadas) {
    return "nao_iniciada";
  }

  const temBloqueioOuDependencia = etapas.some(
    (etapa) => etapa.status === "bloqueada" || etapa.status === "aguardando_terceiro",
  );
  if (temBloqueioOuDependencia) {
    return "aguardando_retorno";
  }

  return "em_andamento";
}
