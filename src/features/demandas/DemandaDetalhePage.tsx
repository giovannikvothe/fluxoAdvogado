import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TextArea } from "../../components/ui/TextArea";
import {
  atualizarObservacoesDemanda,
  atualizarPrazoEtapaDemanda,
  atualizarStatusEtapaDemanda,
  buscarDemandaDetalhe,
  finalizarDemanda,
} from "../../lib/api";
import { formatDate, formatDateTime, toDateInputValue } from "../../lib/format";
import { STATUS_ETAPA_LABEL, STATUS_ETAPA_OPTIONS, type StatusEtapaDemanda } from "../../types/domain";
import { canTransitionStage, hasMandatoryPendingStages } from "../../utils/statusRules";

export function DemandaDetalhePage() {
  const { demandaId } = useParams<{ demandaId: string }>();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ message: string; variant: "error" | "success" | "info" } | null>(
    null,
  );

  const [draftStatus, setDraftStatus] = useState<Record<string, StatusEtapaDemanda>>({});
  const [draftPrazo, setDraftPrazo] = useState<Record<string, string>>({});
  const [draftObservacoesEtapa, setDraftObservacoesEtapa] = useState<Record<string, string>>({});
  const [draftObservacoesDemanda, setDraftObservacoesDemanda] = useState("");

  const demandaQuery = useQuery({
    queryKey: ["demanda", demandaId],
    queryFn: async () => {
      if (!demandaId) {
        throw new Error("Demanda nao encontrada.");
      }
      return buscarDemandaDetalhe(demandaId);
    },
    enabled: Boolean(demandaId),
  });

  useEffect(() => {
    const demanda = demandaQuery.data;
    if (!demanda) {
      return;
    }

    const statusMap: Record<string, StatusEtapaDemanda> = {};
    const prazoMap: Record<string, string> = {};
    const observacoesEtapaMap: Record<string, string> = {};

    demanda.etapas_demanda.forEach((etapa) => {
      statusMap[etapa.id] = etapa.status;
      prazoMap[etapa.id] = toDateInputValue(etapa.prazo);
      observacoesEtapaMap[etapa.id] = etapa.observacoes ?? "";
    });

    setDraftStatus(statusMap);
    setDraftPrazo(prazoMap);
    setDraftObservacoesEtapa(observacoesEtapaMap);
    setDraftObservacoesDemanda(demanda.observacoes ?? "");
  }, [demandaQuery.data]);

  const invalidateAll = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["demanda", demandaId] }),
      queryClient.invalidateQueries({ queryKey: ["demandas"] }),
    ]);
  };

  const atualizarStatusMutation = useMutation({
    mutationFn: (args: { etapaId: string; novoStatus: StatusEtapaDemanda; observacoes: string }) =>
      atualizarStatusEtapaDemanda({
        etapa_demanda_id: args.etapaId,
        novo_status: args.novoStatus,
        observacoes: args.observacoes,
      }),
    onSuccess: async () => {
      setFeedback({ message: "Status da etapa atualizado.", variant: "success" });
      await invalidateAll();
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao atualizar status da etapa.",
        variant: "error",
      }),
  });

  const atualizarPrazoMutation = useMutation({
    mutationFn: (args: { etapaId: string; prazo: string | null }) =>
      atualizarPrazoEtapaDemanda({ etapa_demanda_id: args.etapaId, prazo: args.prazo }),
    onSuccess: async () => {
      setFeedback({ message: "Prazo da etapa atualizado.", variant: "success" });
      await invalidateAll();
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao atualizar prazo.",
        variant: "error",
      }),
  });

  const atualizarObservacoesMutation = useMutation({
    mutationFn: async () => {
      if (!demandaId) {
        throw new Error("Demanda nao encontrada.");
      }
      return atualizarObservacoesDemanda(demandaId, draftObservacoesDemanda);
    },
    onSuccess: async () => {
      setFeedback({ message: "Observacoes da demanda atualizadas.", variant: "success" });
      await invalidateAll();
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao atualizar observacoes da demanda.",
        variant: "error",
      }),
  });

  const finalizarMutation = useMutation({
    mutationFn: async () => {
      if (!demandaId) {
        throw new Error("Demanda nao encontrada.");
      }
      return finalizarDemanda(demandaId);
    },
    onSuccess: async () => {
      setFeedback({ message: "Demanda finalizada com sucesso.", variant: "success" });
      await invalidateAll();
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao finalizar demanda.",
        variant: "error",
      }),
  });

  const demanda = demandaQuery.data;
  const podeFinalizar = useMemo(
    () =>
      demanda
        ? !hasMandatoryPendingStages(
            demanda.etapas_demanda.map((etapa) => ({ obrigatoria: etapa.obrigatoria, status: etapa.status })),
          )
        : false,
    [demanda],
  );

  if (demandaQuery.isLoading) {
    return <Card title="Carregando demanda..." />;
  }

  if (!demanda) {
    return <Card title="Demanda nao encontrada" subtitle="Verifique se o registro ainda existe." />;
  }

  return (
    <div className="page-grid">
      <Card
        title={demanda.titulo}
        subtitle={`Template: ${demanda.template?.nome ?? "-"} | Processo: ${demanda.numero_processo ?? "-"}`}
        actions={
          <Button
            variant="primary"
            onClick={() => finalizarMutation.mutate()}
            disabled={!podeFinalizar || demanda.status === "finalizada" || demanda.status === "cancelada"}
            loading={finalizarMutation.isPending}
          >
            Finalizar demanda
          </Button>
        }
      >
        <div className="detail-grid">
          <div>
            <strong>Status</strong>
            <div>
              <StatusBadge status={demanda.status} />
            </div>
          </div>
          <div>
            <strong>Advogado</strong>
            <p>{demanda.advogado?.nome ?? "-"}</p>
          </div>
          <div>
            <strong>Cliente</strong>
            <p>{demanda.cliente?.nome ?? "-"}</p>
          </div>
          <div>
            <strong>Prazo final</strong>
            <p>{formatDate(demanda.prazo_final)}</p>
          </div>
        </div>

        {!podeFinalizar && <Alert message="Existem etapas obrigatorias pendentes." variant="info" />}
        <Alert message={feedback?.message} variant={feedback?.variant} />

        <div className="form-grid">
          <TextArea
            label="Observacoes gerais da demanda"
            rows={3}
            value={draftObservacoesDemanda}
            onChange={(event) => setDraftObservacoesDemanda(event.target.value)}
          />
          <Button variant="secondary" loading={atualizarObservacoesMutation.isPending} onClick={() => atualizarObservacoesMutation.mutate()}>
            Salvar observacoes da demanda
          </Button>
        </div>
      </Card>

      <Card title="Checklist operacional">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Etapa</th>
                <th>Status</th>
                <th>Prazo</th>
                <th>Observacoes</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {demanda.etapas_demanda.map((etapa) => {
                const statusSelecionado = draftStatus[etapa.id] ?? etapa.status;
                const prazoSelecionado = draftPrazo[etapa.id] ?? "";
                const observacoesSelecionadas = draftObservacoesEtapa[etapa.id] ?? "";

                return (
                  <tr key={etapa.id}>
                    <td>{etapa.ordem}</td>
                    <td>
                      <strong>{etapa.nome}</strong>
                      <br />
                      {etapa.descricao || "-"}
                      <br />
                      {etapa.obrigatoria ? "Obrigatoria" : "Opcional"}
                    </td>
                    <td>
                      <Select
                        label="Status"
                        value={statusSelecionado}
                        onChange={(event) =>
                          setDraftStatus((current) => ({
                            ...current,
                            [etapa.id]: event.target.value as StatusEtapaDemanda,
                          }))
                        }
                      >
                        {STATUS_ETAPA_OPTIONS.map((statusOption) => (
                          <option
                            key={statusOption}
                            value={statusOption}
                            disabled={!canTransitionStage(etapa.status, statusOption)}
                          >
                            {STATUS_ETAPA_LABEL[statusOption]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      <input
                        className="input"
                        type="date"
                        value={prazoSelecionado}
                        onChange={(event) =>
                          setDraftPrazo((current) => ({
                            ...current,
                            [etapa.id]: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <textarea
                        className="input textarea"
                        rows={2}
                        value={observacoesSelecionadas}
                        onChange={(event) =>
                          setDraftObservacoesEtapa((current) => ({
                            ...current,
                            [etapa.id]: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <div className="actions-col">
                        <Button
                          variant="secondary"
                          onClick={() =>
                            atualizarStatusMutation.mutate({
                              etapaId: etapa.id,
                              novoStatus: statusSelecionado,
                              observacoes: observacoesSelecionadas,
                            })
                          }
                          loading={atualizarStatusMutation.isPending}
                        >
                          Salvar status
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            atualizarPrazoMutation.mutate({
                              etapaId: etapa.id,
                              prazo: prazoSelecionado || null,
                            })
                          }
                          loading={atualizarPrazoMutation.isPending}
                        >
                          Salvar prazo
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Historico">
        <div className="timeline">
          {demanda.historico.map((registro) => (
            <article key={registro.id} className="timeline-item">
              <header>
                <strong>{registro.acao}</strong>
                <span>{formatDateTime(registro.data)}</span>
              </header>
              <p>{registro.descricao}</p>
            </article>
          ))}

          {!demanda.historico.length && <p>Sem eventos registrados ate o momento.</p>}
        </div>
      </Card>
    </div>
  );
}

