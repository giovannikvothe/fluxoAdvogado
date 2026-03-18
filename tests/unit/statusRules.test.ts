import { describe, expect, it } from "vitest";
import { canTransitionStage, computeDemandStatus, hasMandatoryPendingStages } from "../../src/utils/statusRules";
import type { EtapaDemanda } from "../../src/types/domain";

function makeStage(partial: Partial<EtapaDemanda>): EtapaDemanda {
  return {
    id: partial.id ?? "stage-id",
    owner_user_id: partial.owner_user_id ?? "owner-id",
    demanda_id: partial.demanda_id ?? "demanda-id",
    etapa_origem_id: partial.etapa_origem_id ?? null,
    ordem: partial.ordem ?? 1,
    nome: partial.nome ?? "Etapa",
    descricao: partial.descricao ?? null,
    obrigatoria: partial.obrigatoria ?? true,
    status: partial.status ?? "nao_iniciada",
    prazo: partial.prazo ?? null,
    data_inicio: partial.data_inicio ?? null,
    data_conclusao: partial.data_conclusao ?? null,
    observacoes: partial.observacoes ?? null,
    created_at: partial.created_at ?? new Date().toISOString(),
    updated_at: partial.updated_at ?? new Date().toISOString(),
  };
}

describe("statusRules", () => {
  it("permite transicao valida de nao iniciada para em andamento", () => {
    expect(canTransitionStage("nao_iniciada", "em_andamento")).toBe(true);
  });

  it("bloqueia transicao invalida de concluida para em andamento", () => {
    expect(canTransitionStage("concluida", "em_andamento")).toBe(false);
  });

  it("identifica pendencia em etapa obrigatoria nao concluida", () => {
    const etapas = [
      makeStage({ obrigatoria: true, status: "concluida" }),
      makeStage({ id: "2", obrigatoria: true, status: "em_andamento" }),
      makeStage({ id: "3", obrigatoria: false, status: "cancelada" }),
    ];

    expect(hasMandatoryPendingStages(etapas)).toBe(true);
  });

  it("nao considera pendencia quando obrigatorias estao concluidas", () => {
    const etapas = [
      makeStage({ obrigatoria: true, status: "concluida" }),
      makeStage({ id: "2", obrigatoria: false, status: "cancelada" }),
    ];

    expect(hasMandatoryPendingStages(etapas)).toBe(false);
  });

  it("calcula status de demanda aguardando retorno quando ha bloqueio", () => {
    const etapas = [
      makeStage({ status: "concluida" }),
      makeStage({ id: "2", status: "bloqueada" }),
    ];

    expect(computeDemandStatus(etapas)).toBe("aguardando_retorno");
  });
});
