import { beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/supabase";

const SUPABASE_URL = process.env.TEST_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

const shouldRun = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && TEST_USER_EMAIL && TEST_USER_PASSWORD);

const client = shouldRun
  ? createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : createClient<Database>("https://example.supabase.co", "anon-key");

describe.runIf(shouldRun)("RPCs criticas", () => {
  let advogadoId = "";
  let clienteId = "";
  let templateId = "";

  beforeAll(async () => {
    const { error: signInError } = await client.auth.signInWithPassword({
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });
    if (signInError) {
      throw signInError;
    }

    const { data: advogado, error: advogadoError } = await client
      .from("advogados")
      .insert({ nome: `Advogado Teste ${Date.now()}`, ativo: true })
      .select("*")
      .single();
    if (advogadoError) {
      throw advogadoError;
    }
    advogadoId = advogado.id;

    const { data: cliente, error: clienteError } = await client
      .from("clientes")
      .insert({ nome: `Cliente Teste ${Date.now()}` })
      .select("*")
      .single();
    if (clienteError) {
      throw clienteError;
    }
    clienteId = cliente.id;

    const { data: template, error: templateError } = await client
      .from("templates_fluxo")
      .insert({
        nome: `Template Teste ${Date.now()}`,
        tipo_servico: "peticao_inicial",
        advogado_id: advogadoId,
        ativo: true,
      })
      .select("*")
      .single();
    if (templateError) {
      throw templateError;
    }
    templateId = template.id;

    const { error: etapaError } = await client.from("etapas_template").insert([
      {
        template_id: templateId,
        ordem: 1,
        nome: "Receber documentos",
        obrigatoria: true,
      },
    ]);
    if (etapaError) {
      throw etapaError;
    }
  });

  it("cria demanda por template, exige etapa obrigatoria concluida e finaliza", async () => {
    const { data: demandaId, error: criarError } = await client.rpc("criar_demanda_por_template", {
      p_template_id: templateId,
      p_advogado_id: advogadoId,
      p_cliente_id: clienteId,
      p_titulo: "Demanda de teste",
    });
    expect(criarError).toBeNull();
    expect(demandaId).toBeTruthy();

    const { data: etapas, error: etapasError } = await client
      .from("etapas_demanda")
      .select("*")
      .eq("demanda_id", demandaId!);
    expect(etapasError).toBeNull();
    expect((etapas ?? []).length).toBeGreaterThan(0);

    const { error: finalizarComPendenciaError } = await client.rpc("finalizar_demanda", {
      p_demanda_id: demandaId!,
    });
    expect(finalizarComPendenciaError).not.toBeNull();

    const etapa = etapas![0];
    const { error: updateEtapaError } = await client.rpc("atualizar_status_etapa", {
      p_etapa_demanda_id: etapa.id,
      p_novo_status: "em_andamento",
    });
    expect(updateEtapaError).toBeNull();

    const { error: concluirEtapaError } = await client.rpc("atualizar_status_etapa", {
      p_etapa_demanda_id: etapa.id,
      p_novo_status: "concluida",
    });
    expect(concluirEtapaError).toBeNull();

    const { error: finalizarError } = await client.rpc("finalizar_demanda", {
      p_demanda_id: demandaId!,
    });
    expect(finalizarError).toBeNull();
  });
});

if (!shouldRun) {
  describe("RPCs criticas", () => {
    it("pula quando variaveis de ambiente de integracao nao existem", () => {
      expect(true).toBe(true);
    });
  });
}
