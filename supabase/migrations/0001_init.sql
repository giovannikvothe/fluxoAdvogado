create extension if not exists "pgcrypto";

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_demanda') THEN
    CREATE TYPE public.status_demanda AS ENUM (
      'nao_iniciada',
      'em_andamento',
      'aguardando_retorno',
      'finalizada',
      'cancelada'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_etapa_demanda') THEN
    CREATE TYPE public.status_etapa_demanda AS ENUM (
      'nao_iniciada',
      'em_andamento',
      'concluida',
      'bloqueada',
      'cancelada',
      'aguardando_terceiro'
    );
  END IF;
END $$;

-- Tabelas
CREATE TABLE IF NOT EXISTS public.advogados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text,
  email text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  documento text,
  telefone text,
  email text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.templates_fluxo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo_servico text NOT NULL,
  advogado_id uuid REFERENCES public.advogados(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  versao integer NOT NULL DEFAULT 1,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.etapas_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.templates_fluxo(id) ON DELETE CASCADE,
  ordem integer NOT NULL CHECK (ordem > 0),
  nome text NOT NULL,
  descricao text,
  obrigatoria boolean NOT NULL DEFAULT true,
  prazo_padrao_dias integer CHECK (prazo_padrao_dias IS NULL OR prazo_padrao_dias >= 0),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, ordem)
);

CREATE TABLE IF NOT EXISTS public.demandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  advogado_id uuid NOT NULL REFERENCES public.advogados(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  template_id uuid NOT NULL REFERENCES public.templates_fluxo(id),
  titulo text NOT NULL,
  numero_processo text,
  status public.status_demanda NOT NULL DEFAULT 'nao_iniciada',
  data_criacao timestamptz NOT NULL DEFAULT now(),
  data_conclusao timestamptz,
  prazo_final date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.etapas_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  demanda_id uuid NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  etapa_origem_id uuid REFERENCES public.etapas_template(id) ON DELETE SET NULL,
  ordem integer NOT NULL CHECK (ordem > 0),
  nome text NOT NULL,
  descricao text,
  obrigatoria boolean NOT NULL DEFAULT true,
  status public.status_etapa_demanda NOT NULL DEFAULT 'nao_iniciada',
  prazo date,
  data_inicio timestamptz,
  data_conclusao timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (demanda_id, ordem)
);

CREATE TABLE IF NOT EXISTS public.historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  demanda_id uuid NOT NULL REFERENCES public.demandas(id) ON DELETE CASCADE,
  etapa_id uuid REFERENCES public.etapas_demanda(id) ON DELETE SET NULL,
  acao text NOT NULL,
  descricao text NOT NULL,
  data timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advogados_owner ON public.advogados(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_owner ON public.clientes(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_templates_owner ON public.templates_fluxo(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_templates_advogado ON public.templates_fluxo(advogado_id);
CREATE INDEX IF NOT EXISTS idx_etapas_template_owner ON public.etapas_template(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_etapas_template_template ON public.etapas_template(template_id);
CREATE INDEX IF NOT EXISTS idx_demandas_owner ON public.demandas(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON public.demandas(status);
CREATE INDEX IF NOT EXISTS idx_etapas_demanda_owner ON public.etapas_demanda(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_etapas_demanda_demanda ON public.etapas_demanda(demanda_id);
CREATE INDEX IF NOT EXISTS idx_historico_owner ON public.historico(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_historico_demanda ON public.historico(demanda_id);

-- Trigger utilitario para updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_advogados_touch_updated_at ON public.advogados;
CREATE TRIGGER trg_advogados_touch_updated_at
BEFORE UPDATE ON public.advogados
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_clientes_touch_updated_at ON public.clientes;
CREATE TRIGGER trg_clientes_touch_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_templates_touch_updated_at ON public.templates_fluxo;
CREATE TRIGGER trg_templates_touch_updated_at
BEFORE UPDATE ON public.templates_fluxo
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_etapas_template_touch_updated_at ON public.etapas_template;
CREATE TRIGGER trg_etapas_template_touch_updated_at
BEFORE UPDATE ON public.etapas_template
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_demandas_touch_updated_at ON public.demandas;
CREATE TRIGGER trg_demandas_touch_updated_at
BEFORE UPDATE ON public.demandas
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_etapas_demanda_touch_updated_at ON public.etapas_demanda;
CREATE TRIGGER trg_etapas_demanda_touch_updated_at
BEFORE UPDATE ON public.etapas_demanda
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.advogados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_fluxo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS advogados_select ON public.advogados;
CREATE POLICY advogados_select ON public.advogados
FOR SELECT USING (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS advogados_insert ON public.advogados;
CREATE POLICY advogados_insert ON public.advogados
FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS advogados_update ON public.advogados;
CREATE POLICY advogados_update ON public.advogados
FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS advogados_delete ON public.advogados;
CREATE POLICY advogados_delete ON public.advogados
FOR DELETE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS clientes_select ON public.clientes;
CREATE POLICY clientes_select ON public.clientes
FOR SELECT USING (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS clientes_insert ON public.clientes;
CREATE POLICY clientes_insert ON public.clientes
FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS clientes_update ON public.clientes;
CREATE POLICY clientes_update ON public.clientes
FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS clientes_delete ON public.clientes;
CREATE POLICY clientes_delete ON public.clientes
FOR DELETE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS templates_select ON public.templates_fluxo;
CREATE POLICY templates_select ON public.templates_fluxo
FOR SELECT USING (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS templates_insert ON public.templates_fluxo;
CREATE POLICY templates_insert ON public.templates_fluxo
FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS templates_update ON public.templates_fluxo;
CREATE POLICY templates_update ON public.templates_fluxo
FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS templates_delete ON public.templates_fluxo;
CREATE POLICY templates_delete ON public.templates_fluxo
FOR DELETE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS etapas_template_select ON public.etapas_template;
CREATE POLICY etapas_template_select ON public.etapas_template
FOR SELECT USING (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS etapas_template_insert ON public.etapas_template;
CREATE POLICY etapas_template_insert ON public.etapas_template
FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS etapas_template_update ON public.etapas_template;
CREATE POLICY etapas_template_update ON public.etapas_template
FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS etapas_template_delete ON public.etapas_template;
CREATE POLICY etapas_template_delete ON public.etapas_template
FOR DELETE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS demandas_select ON public.demandas;
CREATE POLICY demandas_select ON public.demandas
FOR SELECT USING (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS demandas_insert ON public.demandas;
CREATE POLICY demandas_insert ON public.demandas
FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS demandas_update ON public.demandas;
CREATE POLICY demandas_update ON public.demandas
FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS demandas_delete ON public.demandas;
CREATE POLICY demandas_delete ON public.demandas
FOR DELETE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS etapas_demanda_select ON public.etapas_demanda;
CREATE POLICY etapas_demanda_select ON public.etapas_demanda
FOR SELECT USING (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS etapas_demanda_insert ON public.etapas_demanda;
CREATE POLICY etapas_demanda_insert ON public.etapas_demanda
FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS etapas_demanda_update ON public.etapas_demanda;
CREATE POLICY etapas_demanda_update ON public.etapas_demanda
FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS etapas_demanda_delete ON public.etapas_demanda;
CREATE POLICY etapas_demanda_delete ON public.etapas_demanda
FOR DELETE USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS historico_select ON public.historico;
CREATE POLICY historico_select ON public.historico
FOR SELECT USING (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS historico_insert ON public.historico;
CREATE POLICY historico_insert ON public.historico
FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS historico_update ON public.historico;
CREATE POLICY historico_update ON public.historico
FOR UPDATE USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
DROP POLICY IF EXISTS historico_delete ON public.historico;
CREATE POLICY historico_delete ON public.historico
FOR DELETE USING (auth.uid() = owner_user_id);

-- Funcoes auxiliares
CREATE OR REPLACE FUNCTION public.transicao_etapa_valida(
  p_status_atual public.status_etapa_demanda,
  p_novo_status public.status_etapa_demanda
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_status_atual = p_novo_status THEN
    RETURN true;
  END IF;

  RETURN CASE p_status_atual
    WHEN 'nao_iniciada' THEN p_novo_status IN ('em_andamento', 'bloqueada', 'aguardando_terceiro', 'cancelada')
    WHEN 'em_andamento' THEN p_novo_status IN ('concluida', 'bloqueada', 'aguardando_terceiro', 'cancelada')
    WHEN 'bloqueada' THEN p_novo_status IN ('em_andamento', 'cancelada')
    WHEN 'aguardando_terceiro' THEN p_novo_status IN ('em_andamento', 'cancelada')
    WHEN 'concluida' THEN false
    WHEN 'cancelada' THEN false
    ELSE false
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_historico(
  p_demanda_id uuid,
  p_etapa_id uuid,
  p_acao text,
  p_descricao text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  INSERT INTO public.historico (
    owner_user_id,
    demanda_id,
    etapa_id,
    acao,
    descricao
  )
  VALUES (
    auth.uid(),
    p_demanda_id,
    p_etapa_id,
    p_acao,
    p_descricao
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.recalcular_status_demanda(p_demanda_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_status_atual public.status_demanda;
  v_novo_status public.status_demanda;
  v_todas_nao_iniciadas boolean;
  v_tem_aguardando boolean;
BEGIN
  SELECT d.status
    INTO v_status_atual
  FROM public.demandas d
  WHERE d.id = p_demanda_id
    AND d.owner_user_id = auth.uid();

  IF v_status_atual IS NULL THEN
    RAISE EXCEPTION 'Demanda nao encontrada para o usuario autenticado.';
  END IF;

  IF v_status_atual IN ('finalizada', 'cancelada') THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(bool_and(ed.status = 'nao_iniciada'), true),
    COALESCE(bool_or(ed.status IN ('bloqueada', 'aguardando_terceiro')), false)
  INTO v_todas_nao_iniciadas, v_tem_aguardando
  FROM public.etapas_demanda ed
  WHERE ed.demanda_id = p_demanda_id
    AND ed.owner_user_id = auth.uid();

  IF v_todas_nao_iniciadas THEN
    v_novo_status := 'nao_iniciada';
  ELSIF v_tem_aguardando THEN
    v_novo_status := 'aguardando_retorno';
  ELSE
    v_novo_status := 'em_andamento';
  END IF;

  IF v_novo_status <> v_status_atual THEN
    UPDATE public.demandas
       SET status = v_novo_status,
           updated_at = now()
     WHERE id = p_demanda_id
       AND owner_user_id = auth.uid();

    PERFORM public.registrar_historico(
      p_demanda_id,
      NULL,
      'status_demanda',
      format('Status da demanda alterado de %s para %s.', v_status_atual::text, v_novo_status::text)
    );
  END IF;
END;
$$;

-- RPCs principais
CREATE OR REPLACE FUNCTION public.criar_demanda_por_template(
  p_template_id uuid,
  p_advogado_id uuid,
  p_cliente_id uuid,
  p_titulo text,
  p_numero_processo text DEFAULT NULL,
  p_prazo_final date DEFAULT NULL,
  p_observacoes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_demanda_id uuid;
  v_total_etapas integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  PERFORM 1
  FROM public.templates_fluxo t
  WHERE t.id = p_template_id
    AND t.owner_user_id = auth.uid()
    AND t.ativo = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template invalido para o usuario autenticado.';
  END IF;

  PERFORM 1
  FROM public.advogados a
  WHERE a.id = p_advogado_id
    AND a.owner_user_id = auth.uid()
    AND a.ativo = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advogado invalido para o usuario autenticado.';
  END IF;

  PERFORM 1
  FROM public.clientes c
  WHERE c.id = p_cliente_id
    AND c.owner_user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cliente invalido para o usuario autenticado.';
  END IF;

  INSERT INTO public.demandas (
    owner_user_id,
    advogado_id,
    cliente_id,
    template_id,
    titulo,
    numero_processo,
    status,
    prazo_final,
    observacoes
  )
  VALUES (
    auth.uid(),
    p_advogado_id,
    p_cliente_id,
    p_template_id,
    p_titulo,
    p_numero_processo,
    'nao_iniciada',
    p_prazo_final,
    p_observacoes
  )
  RETURNING id INTO v_demanda_id;

  INSERT INTO public.etapas_demanda (
    owner_user_id,
    demanda_id,
    etapa_origem_id,
    ordem,
    nome,
    descricao,
    obrigatoria,
    status,
    prazo,
    observacoes
  )
  SELECT
    auth.uid(),
    v_demanda_id,
    et.id,
    et.ordem,
    et.nome,
    et.descricao,
    et.obrigatoria,
    'nao_iniciada',
    CASE
      WHEN et.prazo_padrao_dias IS NULL THEN NULL
      ELSE (current_date + et.prazo_padrao_dias)::date
    END,
    et.observacoes
  FROM public.etapas_template et
  WHERE et.template_id = p_template_id
    AND et.owner_user_id = auth.uid()
  ORDER BY et.ordem;

  GET DIAGNOSTICS v_total_etapas = ROW_COUNT;

  IF v_total_etapas = 0 THEN
    RAISE EXCEPTION 'O template selecionado nao possui etapas.';
  END IF;

  PERFORM public.registrar_historico(
    v_demanda_id,
    NULL,
    'demanda_criada',
    format('Demanda criada a partir do template %s.', p_template_id::text)
  );

  RETURN v_demanda_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_status_etapa(
  p_etapa_demanda_id uuid,
  p_novo_status public.status_etapa_demanda,
  p_observacoes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_demanda_id uuid;
  v_status_atual public.status_etapa_demanda;
BEGIN
  SELECT ed.demanda_id, ed.status
    INTO v_demanda_id, v_status_atual
  FROM public.etapas_demanda ed
  WHERE ed.id = p_etapa_demanda_id
    AND ed.owner_user_id = auth.uid();

  IF v_demanda_id IS NULL THEN
    RAISE EXCEPTION 'Etapa da demanda nao encontrada para o usuario autenticado.';
  END IF;

  IF NOT public.transicao_etapa_valida(v_status_atual, p_novo_status) THEN
    RAISE EXCEPTION 'Transicao de status invalida: % -> %.', v_status_atual::text, p_novo_status::text;
  END IF;

  UPDATE public.etapas_demanda
     SET status = p_novo_status,
         data_inicio = CASE
           WHEN p_novo_status = 'em_andamento' AND data_inicio IS NULL THEN now()
           ELSE data_inicio
         END,
         data_conclusao = CASE
           WHEN p_novo_status = 'concluida' THEN now()
           WHEN p_novo_status <> 'concluida' THEN NULL
           ELSE data_conclusao
         END,
         observacoes = COALESCE(p_observacoes, observacoes),
         updated_at = now()
   WHERE id = p_etapa_demanda_id
     AND owner_user_id = auth.uid();

  PERFORM public.registrar_historico(
    v_demanda_id,
    p_etapa_demanda_id,
    'status_etapa',
    format('Status da etapa alterado de %s para %s.', v_status_atual::text, p_novo_status::text)
  );

  PERFORM public.recalcular_status_demanda(v_demanda_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_prazo_etapa(
  p_etapa_demanda_id uuid,
  p_novo_prazo date
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_demanda_id uuid;
BEGIN
  SELECT ed.demanda_id
    INTO v_demanda_id
  FROM public.etapas_demanda ed
  WHERE ed.id = p_etapa_demanda_id
    AND ed.owner_user_id = auth.uid();

  IF v_demanda_id IS NULL THEN
    RAISE EXCEPTION 'Etapa da demanda nao encontrada para o usuario autenticado.';
  END IF;

  UPDATE public.etapas_demanda
     SET prazo = p_novo_prazo,
         updated_at = now()
   WHERE id = p_etapa_demanda_id
     AND owner_user_id = auth.uid();

  PERFORM public.registrar_historico(
    v_demanda_id,
    p_etapa_demanda_id,
    'alteracao_prazo',
    format('Prazo da etapa atualizado para %s.', COALESCE(p_novo_prazo::text, 'sem prazo'))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finalizar_demanda(
  p_demanda_id uuid,
  p_justificativa text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_pendentes integer;
BEGIN
  PERFORM 1
  FROM public.demandas d
  WHERE d.id = p_demanda_id
    AND d.owner_user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demanda nao encontrada para o usuario autenticado.';
  END IF;

  SELECT count(*)
    INTO v_pendentes
  FROM public.etapas_demanda ed
  WHERE ed.demanda_id = p_demanda_id
    AND ed.owner_user_id = auth.uid()
    AND ed.obrigatoria = true
    AND ed.status <> 'concluida';

  IF v_pendentes > 0 THEN
    RAISE EXCEPTION 'Nao e possivel finalizar. Existem % etapas obrigatorias pendentes.', v_pendentes;
  END IF;

  UPDATE public.demandas
     SET status = 'finalizada',
         data_conclusao = now(),
         updated_at = now()
   WHERE id = p_demanda_id
     AND owner_user_id = auth.uid();

  PERFORM public.registrar_historico(
    p_demanda_id,
    NULL,
    'finalizacao_demanda',
    format('Demanda finalizada. %s', COALESCE(p_justificativa, 'Sem justificativa adicional.'))
  );
END;
$$;

-- Grants para chamadas RPC via PostgREST
GRANT EXECUTE ON FUNCTION public.criar_demanda_por_template(uuid, uuid, uuid, text, text, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.atualizar_status_etapa(uuid, public.status_etapa_demanda, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.atualizar_prazo_etapa(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalizar_demanda(uuid, text) TO authenticated;
