import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatDate, isDemandOverdue } from "../../lib/format";
import { listarAdvogados, listarClientes, listarDemandasComRelacoes, listarTemplatesComEtapas } from "../../lib/api";
import type { StatusDemanda } from "../../types/domain";

type AbaListagem = "ativas" | "finalizadas";

const STATUS_FILTERS: Array<{ value: StatusDemanda | "todas"; label: string }> = [
  { value: "todas", label: "Todos status" },
  { value: "nao_iniciada", label: "Nao iniciada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aguardando_retorno", label: "Aguardando retorno" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
];

function isClosedStatus(status: StatusDemanda): boolean {
  return status === "finalizada" || status === "cancelada";
}

export function DemandasPage() {
  const [aba, setAba] = useState<AbaListagem>("ativas");
  const [statusFilter, setStatusFilter] = useState<StatusDemanda | "todas">("todas");
  const [advogadoFilter, setAdvogadoFilter] = useState<string>("");
  const [clienteFilter, setClienteFilter] = useState<string>("");
  const [templateFilter, setTemplateFilter] = useState<string>("");
  const [busca, setBusca] = useState("");

  const demandasQuery = useQuery({
    queryKey: ["demandas"],
    queryFn: listarDemandasComRelacoes,
  });
  const advogadosQuery = useQuery({ queryKey: ["advogados"], queryFn: listarAdvogados });
  const clientesQuery = useQuery({ queryKey: ["clientes"], queryFn: listarClientes });
  const templatesQuery = useQuery({ queryKey: ["templates"], queryFn: listarTemplatesComEtapas });

  const demandasFiltradas = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();

    return (demandasQuery.data ?? []).filter((demanda) => {
      if (aba === "ativas" && isClosedStatus(demanda.status)) {
        return false;
      }

      if (aba === "finalizadas" && !isClosedStatus(demanda.status)) {
        return false;
      }

      if (statusFilter !== "todas" && demanda.status !== statusFilter) {
        return false;
      }

      if (advogadoFilter && demanda.advogado_id !== advogadoFilter) {
        return false;
      }

      if (clienteFilter && demanda.cliente_id !== clienteFilter) {
        return false;
      }

      if (templateFilter && demanda.template_id !== templateFilter) {
        return false;
      }

      if (!termoBusca) {
        return true;
      }

      const searchable = [
        demanda.titulo,
        demanda.numero_processo,
        demanda.advogado?.nome,
        demanda.cliente?.nome,
        demanda.template?.nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(termoBusca);
    });
  }, [aba, advogadoFilter, busca, clienteFilter, demandasQuery.data, statusFilter, templateFilter]);

  const totalAtivas = (demandasQuery.data ?? []).filter((d) => !isClosedStatus(d.status)).length;
  const totalFinalizadas = (demandasQuery.data ?? []).filter((d) => isClosedStatus(d.status)).length;
  const totalAtrasadas = (demandasQuery.data ?? []).filter((d) => isDemandOverdue(d.status, d.prazo_final)).length;

  return (
    <div className="page-grid">
      <Card
        title="Listagem geral de demandas"
        subtitle="Visualize ativas, finalizadas e pendencias com filtros operacionais."
        actions={
          <Link to="/demandas/nova">
            <Button>Criar demanda</Button>
          </Link>
        }
      >
        <div className="kpi-grid">
          <div className="kpi">
            <span>Ativas</span>
            <strong>{totalAtivas}</strong>
          </div>
          <div className="kpi">
            <span>Finalizadas</span>
            <strong>{totalFinalizadas}</strong>
          </div>
          <div className="kpi kpi-alert">
            <span>Atrasadas</span>
            <strong>{totalAtrasadas}</strong>
          </div>
        </div>

        <div className="tabs">
          <button className={aba === "ativas" ? "tab active" : "tab"} onClick={() => setAba("ativas")}>
            Ativas
          </button>
          <button
            className={aba === "finalizadas" ? "tab active" : "tab"}
            onClick={() => setAba("finalizadas")}
          >
            Finalizadas
          </button>
        </div>

        <div className="form-grid four-columns">
          <label className="field">
            <span>Busca textual</span>
            <input
              className="input"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Titulo, cliente, processo..."
            />
          </label>

          <Select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusDemanda | "todas")}>
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select label="Advogado" value={advogadoFilter} onChange={(event) => setAdvogadoFilter(event.target.value)}>
            <option value="">Todos</option>
            {advogadosQuery.data?.map((advogado) => (
              <option key={advogado.id} value={advogado.id}>
                {advogado.nome}
              </option>
            ))}
          </Select>

          <Select label="Cliente" value={clienteFilter} onChange={(event) => setClienteFilter(event.target.value)}>
            <option value="">Todos</option>
            {clientesQuery.data?.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </Select>

          <Select label="Template" value={templateFilter} onChange={(event) => setTemplateFilter(event.target.value)}>
            <option value="">Todos</option>
            {templatesQuery.data?.map((template) => (
              <option key={template.id} value={template.id}>
                {template.nome}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card title="Demandas">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Titulo</th>
                <th>Advogado</th>
                <th>Cliente</th>
                <th>Template</th>
                <th>Status</th>
                <th>Prazo final</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {demandasFiltradas.map((demanda) => (
                <tr key={demanda.id} className={isDemandOverdue(demanda.status, demanda.prazo_final) ? "is-overdue" : ""}>
                  <td>
                    <strong>{demanda.titulo}</strong>
                    <br />
                    Processo: {demanda.numero_processo || "-"}
                  </td>
                  <td>{demanda.advogado?.nome ?? "-"}</td>
                  <td>{demanda.cliente?.nome ?? "-"}</td>
                  <td>{demanda.template?.nome ?? "-"}</td>
                  <td>
                    <StatusBadge status={demanda.status} />
                  </td>
                  <td>{formatDate(demanda.prazo_final)}</td>
                  <td>
                    <Link to={`/demandas/${demanda.id}`}>
                      <Button variant="secondary">Abrir</Button>
                    </Link>
                  </td>
                </tr>
              ))}

              {!demandasFiltradas.length && (
                <tr>
                  <td colSpan={7}>Nenhuma demanda encontrada com os filtros atuais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

