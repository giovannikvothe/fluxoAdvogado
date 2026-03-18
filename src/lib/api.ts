import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { normalizeOptionalText } from "./format";
import type {
  Advogado,
  Cliente,
  DemandaDetalhe,
  DemandaResumo,
  EtapaTemplate,
  StatusEtapaDemanda,
  TemplateComEtapas,
} from "../types/domain";
import type { Database } from "../types/supabase";

function assertNoError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

function assertData<T>(data: T | null, message: string): T {
  if (data === null) {
    throw new Error(message);
  }
  return data;
}

export async function loginWithPassword(email: string, password: string): Promise<Session | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  assertNoError(error);
  return data.session;
}

export async function registerWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  assertNoError(error);
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  assertNoError(error);
}

export type AdvogadoPayload = {
  id?: string;
  nome: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  ativo: boolean;
};

export async function listarAdvogados(): Promise<Advogado[]> {
  const { data, error } = await supabase.from("advogados").select("*").order("nome");
  assertNoError(error);
  return data ?? [];
}

export async function salvarAdvogado(payload: AdvogadoPayload): Promise<Advogado> {
  const dataToPersist = {
    nome: payload.nome.trim(),
    telefone: normalizeOptionalText(payload.telefone ?? ""),
    email: normalizeOptionalText(payload.email ?? ""),
    observacoes: normalizeOptionalText(payload.observacoes ?? ""),
    ativo: payload.ativo,
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("advogados")
      .update(dataToPersist)
      .eq("id", payload.id)
      .select("*")
      .single();
    assertNoError(error);
    return assertData(data, "Nao foi possivel salvar advogado.");
  }

  const { data, error } = await supabase.from("advogados").insert(dataToPersist).select("*").single();
  assertNoError(error);
  return assertData(data, "Nao foi possivel criar advogado.");
}

export async function alternarAdvogadoAtivo(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from("advogados").update({ ativo }).eq("id", id);
  assertNoError(error);
}

export type ClientePayload = {
  id?: string;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
};

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase.from("clientes").select("*").order("nome");
  assertNoError(error);
  return data ?? [];
}

export async function salvarCliente(payload: ClientePayload): Promise<Cliente> {
  const dataToPersist = {
    nome: payload.nome.trim(),
    documento: normalizeOptionalText(payload.documento ?? ""),
    telefone: normalizeOptionalText(payload.telefone ?? ""),
    email: normalizeOptionalText(payload.email ?? ""),
    observacoes: normalizeOptionalText(payload.observacoes ?? ""),
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("clientes")
      .update(dataToPersist)
      .eq("id", payload.id)
      .select("*")
      .single();
    assertNoError(error);
    return assertData(data, "Nao foi possivel salvar cliente.");
  }

  const { data, error } = await supabase.from("clientes").insert(dataToPersist).select("*").single();
  assertNoError(error);
  return assertData(data, "Nao foi possivel criar cliente.");
}

export type TemplatePayload = {
  id?: string;
  nome: string;
  tipo_servico: string;
  advogado_id?: string;
  ativo: boolean;
  observacoes?: string;
};

export async function listarTemplatesComEtapas(): Promise<TemplateComEtapas[]> {
  const { data, error } = await supabase
    .from("templates_fluxo")
    .select("*, etapas_template(*)")
    .order("nome");
  assertNoError(error);

  return (data ?? []).map((template) => ({
    ...(template as TemplateComEtapas),
    etapas_template: ((template as TemplateComEtapas).etapas_template ?? []).sort(
      (a, b) => a.ordem - b.ordem,
    ),
  }));
}

export async function listarTemplatesAtivos(): Promise<TemplateComEtapas[]> {
  const { data, error } = await supabase
    .from("templates_fluxo")
    .select("*, etapas_template(*)")
    .eq("ativo", true)
    .order("nome");
  assertNoError(error);

  return (data ?? []).map((template) => ({
    ...(template as TemplateComEtapas),
    etapas_template: ((template as TemplateComEtapas).etapas_template ?? []).sort(
      (a, b) => a.ordem - b.ordem,
    ),
  }));
}

export async function salvarTemplate(payload: TemplatePayload): Promise<TemplateComEtapas> {
  const dataToPersist: Database["public"]["Tables"]["templates_fluxo"]["Insert"] = {
    nome: payload.nome.trim(),
    tipo_servico: payload.tipo_servico.trim(),
    advogado_id: payload.advogado_id ? payload.advogado_id : null,
    ativo: payload.ativo,
    observacoes: normalizeOptionalText(payload.observacoes ?? ""),
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("templates_fluxo")
      .update(dataToPersist)
      .eq("id", payload.id)
      .select("*, etapas_template(*)")
      .single();
    assertNoError(error);
    const template = assertData(data, "Nao foi possivel salvar template.") as TemplateComEtapas;
    return {
      ...template,
      etapas_template: (template.etapas_template ?? []).sort((a, b) => a.ordem - b.ordem),
    };
  }

  const { data, error } = await supabase
    .from("templates_fluxo")
    .insert(dataToPersist)
    .select("*, etapas_template(*)")
    .single();
  assertNoError(error);
  const template = assertData(data, "Nao foi possivel criar template.") as TemplateComEtapas;
  return {
    ...template,
    etapas_template: (template.etapas_template ?? []).sort((a, b) => a.ordem - b.ordem),
  };
}

export async function alternarTemplateAtivo(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from("templates_fluxo").update({ ativo }).eq("id", id);
  assertNoError(error);
}

export async function duplicarTemplate(templateId: string): Promise<TemplateComEtapas> {
  const { data: templateData, error: templateError } = await supabase
    .from("templates_fluxo")
    .select("*, etapas_template(*)")
    .eq("id", templateId)
    .single();
  assertNoError(templateError);
  const template = assertData(templateData, "Template nao encontrado para duplicacao.") as TemplateComEtapas;

  const { data: newTemplate, error: insertTemplateError } = await supabase
    .from("templates_fluxo")
    .insert({
      nome: `${template.nome} (copia)`,
      tipo_servico: template.tipo_servico,
      advogado_id: template.advogado_id,
      ativo: true,
      versao: template.versao + 1,
      observacoes: template.observacoes,
    })
    .select("*")
    .single();
  assertNoError(insertTemplateError);
  const templateDuplicado = assertData(newTemplate, "Falha ao criar template duplicado.");

  const etapasToInsert = (template.etapas_template ?? []).map((etapa) => ({
    template_id: templateDuplicado.id,
    ordem: etapa.ordem,
    nome: etapa.nome,
    descricao: etapa.descricao,
    obrigatoria: etapa.obrigatoria,
    prazo_padrao_dias: etapa.prazo_padrao_dias,
    observacoes: etapa.observacoes,
  }));

  if (etapasToInsert.length > 0) {
    const { error: insertEtapasError } = await supabase.from("etapas_template").insert(etapasToInsert);
    assertNoError(insertEtapasError);
  }

  const { data: completeData, error: completeError } = await supabase
    .from("templates_fluxo")
    .select("*, etapas_template(*)")
    .eq("id", templateDuplicado.id)
    .single();
  assertNoError(completeError);
  const completeTemplate = assertData(
    completeData,
    "Falha ao carregar dados completos do template duplicado.",
  ) as TemplateComEtapas;

  return {
    ...completeTemplate,
    etapas_template: (completeTemplate.etapas_template ?? []).sort((a, b) => a.ordem - b.ordem),
  };
}

export type EtapaTemplatePayload = {
  id?: string;
  template_id: string;
  ordem: number;
  nome: string;
  descricao?: string;
  obrigatoria: boolean;
  prazo_padrao_dias?: number | null;
  observacoes?: string;
};

export async function salvarEtapaTemplate(payload: EtapaTemplatePayload): Promise<EtapaTemplate> {
  const dataToPersist: Database["public"]["Tables"]["etapas_template"]["Insert"] = {
    template_id: payload.template_id,
    ordem: payload.ordem,
    nome: payload.nome.trim(),
    descricao: normalizeOptionalText(payload.descricao ?? ""),
    obrigatoria: payload.obrigatoria,
    prazo_padrao_dias: payload.prazo_padrao_dias ?? null,
    observacoes: normalizeOptionalText(payload.observacoes ?? ""),
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("etapas_template")
      .update(dataToPersist)
      .eq("id", payload.id)
      .select("*")
      .single();
    assertNoError(error);
    return assertData(data, "Nao foi possivel salvar etapa do template.");
  }

  const { data, error } = await supabase.from("etapas_template").insert(dataToPersist).select("*").single();
  assertNoError(error);
  return assertData(data, "Nao foi possivel criar etapa do template.");
}

export async function removerEtapaTemplate(etapaId: string): Promise<void> {
  const { error } = await supabase.from("etapas_template").delete().eq("id", etapaId);
  assertNoError(error);
}

export type CriarDemandaPayload = {
  template_id: string;
  advogado_id: string;
  cliente_id: string;
  titulo: string;
  numero_processo?: string;
  prazo_final?: string;
  observacoes?: string;
};

export async function criarDemandaPorTemplate(payload: CriarDemandaPayload): Promise<string> {
  const { data, error } = await supabase.rpc("criar_demanda_por_template", {
    p_template_id: payload.template_id,
    p_advogado_id: payload.advogado_id,
    p_cliente_id: payload.cliente_id,
    p_titulo: payload.titulo.trim(),
    p_numero_processo: normalizeOptionalText(payload.numero_processo ?? ""),
    p_prazo_final: payload.prazo_final ? payload.prazo_final : null,
    p_observacoes: normalizeOptionalText(payload.observacoes ?? ""),
  });
  assertNoError(error);
  return assertData(data, "Nao foi possivel criar demanda.");
}

export async function listarDemandasComRelacoes(): Promise<DemandaResumo[]> {
  const { data, error } = await supabase
    .from("demandas")
    .select(
      "*, advogado:advogados(id, nome), cliente:clientes(id, nome), template:templates_fluxo(id, nome), etapas_demanda(status, obrigatoria, prazo)",
    )
    .order("data_criacao", { ascending: false });
  assertNoError(error);
  return (data as DemandaResumo[]) ?? [];
}

export async function buscarDemandaDetalhe(demandaId: string): Promise<DemandaDetalhe> {
  const { data, error } = await supabase
    .from("demandas")
    .select(
      "*, advogado:advogados(id, nome, email, telefone), cliente:clientes(id, nome, documento, email, telefone), template:templates_fluxo(id, nome, tipo_servico), etapas_demanda(*), historico(*)",
    )
    .eq("id", demandaId)
    .single();
  assertNoError(error);
  const demanda = assertData(data, "Demanda nao encontrada.") as DemandaDetalhe;
  return {
    ...demanda,
    etapas_demanda: (demanda.etapas_demanda ?? []).sort((a, b) => a.ordem - b.ordem),
    historico: (demanda.historico ?? []).sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    ),
  };
}

export async function atualizarStatusEtapaDemanda(args: {
  etapa_demanda_id: string;
  novo_status: StatusEtapaDemanda;
  observacoes?: string;
}): Promise<void> {
  const { error } = await supabase.rpc("atualizar_status_etapa", {
    p_etapa_demanda_id: args.etapa_demanda_id,
    p_novo_status: args.novo_status,
    p_observacoes: normalizeOptionalText(args.observacoes ?? ""),
  });
  assertNoError(error);
}

export async function atualizarPrazoEtapaDemanda(args: {
  etapa_demanda_id: string;
  prazo: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc("atualizar_prazo_etapa", {
    p_etapa_demanda_id: args.etapa_demanda_id,
    p_novo_prazo: args.prazo,
  });
  assertNoError(error);
}

export async function atualizarObservacoesDemanda(demandaId: string, observacoes: string): Promise<void> {
  const { error } = await supabase
    .from("demandas")
    .update({ observacoes: normalizeOptionalText(observacoes) })
    .eq("id", demandaId);
  assertNoError(error);
}

export async function finalizarDemanda(demandaId: string, justificativa?: string): Promise<void> {
  const { error } = await supabase.rpc("finalizar_demanda", {
    p_demanda_id: demandaId,
    p_justificativa: normalizeOptionalText(justificativa ?? ""),
  });
  assertNoError(error);
}
