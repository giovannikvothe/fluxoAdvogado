import type { Database } from "./supabase";

export type StatusDemanda = Database["public"]["Enums"]["status_demanda"];
export type StatusEtapaDemanda = Database["public"]["Enums"]["status_etapa_demanda"];

export type Advogado = Database["public"]["Tables"]["advogados"]["Row"];
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type TemplateFluxo = Database["public"]["Tables"]["templates_fluxo"]["Row"];
export type EtapaTemplate = Database["public"]["Tables"]["etapas_template"]["Row"];
export type Demanda = Database["public"]["Tables"]["demandas"]["Row"];
export type EtapaDemanda = Database["public"]["Tables"]["etapas_demanda"]["Row"];
export type Historico = Database["public"]["Tables"]["historico"]["Row"];

export type TemplateComEtapas = TemplateFluxo & {
  etapas_template: EtapaTemplate[];
};

export type DemandaResumo = Demanda & {
  advogado: Pick<Advogado, "id" | "nome"> | null;
  cliente: Pick<Cliente, "id" | "nome"> | null;
  template: Pick<TemplateFluxo, "id" | "nome"> | null;
  etapas_demanda: Pick<EtapaDemanda, "status" | "obrigatoria" | "prazo">[];
};

export type DemandaDetalhe = Demanda & {
  advogado: Pick<Advogado, "id" | "nome" | "email" | "telefone"> | null;
  cliente: Pick<Cliente, "id" | "nome" | "documento" | "email" | "telefone"> | null;
  template: Pick<TemplateFluxo, "id" | "nome" | "tipo_servico"> | null;
  etapas_demanda: EtapaDemanda[];
  historico: Historico[];
};

export const STATUS_DEMANDA_LABEL: Record<StatusDemanda, string> = {
  nao_iniciada: "Nao iniciada",
  em_andamento: "Em andamento",
  aguardando_retorno: "Aguardando retorno",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

export const STATUS_ETAPA_LABEL: Record<StatusEtapaDemanda, string> = {
  nao_iniciada: "Nao iniciada",
  em_andamento: "Em andamento",
  concluida: "Concluida",
  bloqueada: "Bloqueada",
  cancelada: "Cancelada",
  aguardando_terceiro: "Aguardando terceiro",
};

export const STATUS_DEMANDA_OPTIONS: StatusDemanda[] = [
  "nao_iniciada",
  "em_andamento",
  "aguardando_retorno",
  "finalizada",
  "cancelada",
];

export const STATUS_ETAPA_OPTIONS: StatusEtapaDemanda[] = [
  "nao_iniciada",
  "em_andamento",
  "concluida",
  "bloqueada",
  "cancelada",
  "aguardando_terceiro",
];
