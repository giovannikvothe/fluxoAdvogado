# FluxoAdvogado (V1)

Sistema web para gestao de demandas juridicas com fluxos baseados em templates.

## Stack
- Frontend: React + TypeScript + Vite
- Roteamento: HashRouter (compatível com GitHub Pages)
- Dados: Supabase (Postgres + Auth + RLS + RPC)
- Estado remoto: TanStack Query
- Formularios: React Hook Form + Zod
- Testes: Vitest (unit/integration) + Playwright (E2E)

## Funcionalidades entregues (Fase 1)
- Login por e-mail e senha
- CRUD de advogados (com ativar/inativar)
- CRUD de clientes
- CRUD de templates de fluxo
- Cadastro e edicao de etapas por template
- Duplicacao de template
- Criacao de demanda a partir de template (snapshot das etapas)
- Listagem geral de demandas (ativas/finalizadas + filtros)
- Tela de detalhe da demanda (checklist operacional)
- Atualizacao de status/prazo por etapa
- Finalizacao da demanda com validacao de etapas obrigatorias
- Historico de eventos operacionais

## Setup local
1. Instale dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` a partir de `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

3. Aplique a migracao SQL no Supabase:
- Abra o SQL Editor do projeto Supabase.
- Execute o arquivo `supabase/migrations/0001_init.sql`.

4. Rode o projeto:

```bash
npm run dev
```

## Testes
- Unitarios:

```bash
npm run test:unit
```

- Integracao RPC (requer variaveis `TEST_SUPABASE_*` e usuario de teste):

```bash
npm run test:integration
```

- E2E (requer `E2E_EMAIL` e `E2E_PASSWORD`):

```bash
npm run test:e2e
```

## Deploy no GitHub Pages
Workflow pronto em `.github/workflows/deploy-pages.yml`.

Configure os secrets do repositório:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

A cada push em `main`, o build publica automaticamente no GitHub Pages.

## Banco de dados
A migracao cria:
- Tabelas: `advogados`, `clientes`, `templates_fluxo`, `etapas_template`, `demandas`, `etapas_demanda`, `historico`
- Enums de status de demanda e etapa
- Políticas RLS (`auth.uid() = owner_user_id`)
- RPCs criticas:
  - `criar_demanda_por_template`
  - `atualizar_status_etapa`
  - `atualizar_prazo_etapa`
  - `finalizar_demanda`

## Observacoes
- Esta V1 foi desenhada para uso inicial com 1 usuario autenticado.
- Sem anexos, dashboard ou perfis de permissao avancados nesta fase.
