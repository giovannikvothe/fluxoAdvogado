import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { StatusBadge } from "../../components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import {
  atualizarObservacoesDemanda,
  atualizarPrazoEtapaDemanda,
  atualizarStatusEtapaDemanda,
  buscarDemandaDetalhe,
  finalizarDemanda,
} from "../../lib/api";
import { formatDate, formatDateTime, toDateInputValue } from "../../lib/format";
import {
  STATUS_ETAPA_LABEL,
  STATUS_ETAPA_OPTIONS,
  type StatusEtapaDemanda,
} from "../../types/domain";
import { canTransitionStage, hasMandatoryPendingStages } from "../../utils/statusRules";

export function DemandaDetalhePage() {
  const { demandaId } = useParams<{ demandaId: string }>();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{
    message: string;
    variant: "error" | "success" | "info";
  } | null>(null);

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
    mutationFn: (args: {
      etapaId: string;
      novoStatus: StatusEtapaDemanda;
      observacoes: string;
    }) =>
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
        message:
          error instanceof Error
            ? error.message
            : "Falha ao atualizar status da etapa.",
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
        message:
          error instanceof Error
            ? error.message
            : "Falha ao atualizar observacoes da demanda.",
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
            demanda.etapas_demanda.map((etapa) => ({
              obrigatoria: etapa.obrigatoria,
              status: etapa.status,
            }))
          )
        : false,
    [demanda]
  );

  if (demandaQuery.isLoading) {
    return (
      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>Carregando demanda...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!demanda) {
    return (
      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>Demanda nao encontrada</CardTitle>
          <CardDescription>Verifique se o registro ainda existe.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{demanda.titulo}</CardTitle>
            <CardDescription>
              Template: {demanda.template?.nome ?? "-"} | Processo:{" "}
              {demanda.numero_processo ?? "-"}
            </CardDescription>
          </div>
          <Button
            onClick={() => finalizarMutation.mutate()}
            disabled={
              !podeFinalizar ||
              demanda.status === "finalizada" ||
              demanda.status === "cancelada" ||
              finalizarMutation.isPending
            }
          >
            {finalizarMutation.isPending ? "Processando..." : "Finalizar demanda"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border/75 bg-background/60 p-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <StatusBadge status={demanda.status} />
            </div>
            <div className="rounded-lg border border-border/75 bg-background/60 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Advogado</p>
              <p className="text-sm font-semibold">{demanda.advogado?.nome ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-border/75 bg-background/60 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
              <p className="text-sm font-semibold">{demanda.cliente?.nome ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-border/75 bg-background/60 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Prazo final</p>
              <p className="text-sm font-semibold">{formatDate(demanda.prazo_final)}</p>
            </div>
          </div>

          {!podeFinalizar ? (
            <Alert>
              <AlertTitle>Atencao</AlertTitle>
              <AlertDescription>
                Existem etapas obrigatorias pendentes.
              </AlertDescription>
            </Alert>
          ) : null}

          {feedback ? (
            <Alert variant={feedback.variant === "error" ? "destructive" : "default"}>
              <AlertTitle>{feedback.variant === "error" ? "Falha" : "Atualizacao"}</AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3">
            <Label htmlFor="demanda-observacoes-gerais">
              Observacoes gerais da demanda
            </Label>
            <Textarea
              id="demanda-observacoes-gerais"
              rows={3}
              value={draftObservacoesDemanda}
              onChange={(event) => setDraftObservacoesDemanda(event.target.value)}
            />
            <div>
              <Button
                variant="secondary"
                disabled={atualizarObservacoesMutation.isPending}
                onClick={() => atualizarObservacoesMutation.mutate()}
              >
                {atualizarObservacoesMutation.isPending
                  ? "Processando..."
                  : "Salvar observacoes da demanda"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>Checklist operacional</CardTitle>
          <CardDescription>
            Atualize status, prazo e observacoes de cada etapa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Ordem</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="min-w-[190px]">Status</TableHead>
                <TableHead className="min-w-[160px]">Prazo</TableHead>
                <TableHead className="min-w-[220px]">Observacoes</TableHead>
                <TableHead className="w-[160px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demanda.etapas_demanda.map((etapa) => {
                const statusSelecionado = draftStatus[etapa.id] ?? etapa.status;
                const prazoSelecionado = draftPrazo[etapa.id] ?? "";
                const observacoesSelecionadas = draftObservacoesEtapa[etapa.id] ?? "";

                return (
                  <TableRow key={etapa.id}>
                    <TableCell>{etapa.ordem}</TableCell>
                    <TableCell>
                      <p className="font-semibold">{etapa.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {etapa.descricao || "-"}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {etapa.obrigatoria ? "Obrigatoria" : "Opcional"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={statusSelecionado}
                        onValueChange={(value) =>
                          setDraftStatus((current) => ({
                            ...current,
                            [etapa.id]: value as StatusEtapaDemanda,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ETAPA_OPTIONS.map((statusOption) => (
                            <SelectItem
                              key={statusOption}
                              value={statusOption}
                              disabled={!canTransitionStage(etapa.status, statusOption)}
                            >
                              {STATUS_ETAPA_LABEL[statusOption]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={prazoSelecionado}
                        onChange={(event) =>
                          setDraftPrazo((current) => ({
                            ...current,
                            [etapa.id]: event.target.value,
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        rows={2}
                        value={observacoesSelecionadas}
                        onChange={(event) =>
                          setDraftObservacoesEtapa((current) => ({
                            ...current,
                            [etapa.id]: event.target.value,
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={atualizarStatusMutation.isPending}
                          onClick={() =>
                            atualizarStatusMutation.mutate({
                              etapaId: etapa.id,
                              novoStatus: statusSelecionado,
                              observacoes: observacoesSelecionadas,
                            })
                          }
                        >
                          {atualizarStatusMutation.isPending
                            ? "Processando..."
                            : "Salvar status"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={atualizarPrazoMutation.isPending}
                          onClick={() =>
                            atualizarPrazoMutation.mutate({
                              etapaId: etapa.id,
                              prazo: prazoSelecionado || null,
                            })
                          }
                        >
                          {atualizarPrazoMutation.isPending
                            ? "Processando..."
                            : "Salvar prazo"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>Historico</CardTitle>
          <CardDescription>Eventos recentes da demanda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {demanda.historico.map((registro) => (
            <article
              key={registro.id}
              className="rounded-lg border border-border/80 bg-background/60 p-4"
            >
              <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <strong className="font-display text-sm">{registro.acao}</strong>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(registro.data)}
                </span>
              </header>
              <p className="text-sm text-muted-foreground">{registro.descricao}</p>
            </article>
          ))}

          {!demanda.historico.length ? (
            <p className="text-sm text-muted-foreground">
              Sem eventos registrados ate o momento.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
