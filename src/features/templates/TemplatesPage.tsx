import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TextArea } from "../../components/ui/TextArea";
import {
  alternarTemplateAtivo,
  duplicarTemplate,
  listarAdvogados,
  listarTemplatesComEtapas,
  removerEtapaTemplate,
  salvarEtapaTemplate,
  salvarTemplate,
} from "../../lib/api";

const templateSchema = z.object({
  nome: z.string().min(3, "Informe ao menos 3 caracteres."),
  tipo_servico: z.string().min(3, "Informe o tipo de servico."),
  advogado_id: z.string().optional(),
  ativo: z.boolean(),
  observacoes: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const etapaSchema = z.object({
  nome: z.string().min(2, "Informe o nome da etapa."),
  descricao: z.string().optional(),
  ordem: z.number().int().min(1, "Ordem minima: 1."),
  obrigatoria: z.boolean(),
  prazo_padrao_dias: z.string().optional(),
  observacoes: z.string().optional(),
});

type EtapaFormValues = z.infer<typeof etapaSchema>;

const EMPTY_TEMPLATE: TemplateFormValues = {
  nome: "",
  tipo_servico: "",
  advogado_id: "",
  ativo: true,
  observacoes: "",
};

export function TemplatesPage() {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingEtapaId, setEditingEtapaId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; variant: "error" | "success" | "info" } | null>(
    null,
  );

  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: EMPTY_TEMPLATE,
  });

  const etapaForm = useForm<EtapaFormValues>({
    resolver: zodResolver(etapaSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      ordem: 1,
      obrigatoria: true,
      prazo_padrao_dias: "",
      observacoes: "",
    },
  });

  const templatesQuery = useQuery({
    queryKey: ["templates"],
    queryFn: listarTemplatesComEtapas,
  });

  const advogadosQuery = useQuery({
    queryKey: ["advogados"],
    queryFn: listarAdvogados,
  });

  const selectedTemplate = useMemo(
    () => templatesQuery.data?.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templatesQuery.data],
  );

  useEffect(() => {
    if (!selectedTemplate) {
      templateForm.reset(EMPTY_TEMPLATE);
      etapaForm.reset({
        nome: "",
        descricao: "",
        ordem: 1,
        obrigatoria: true,
        prazo_padrao_dias: "",
        observacoes: "",
      });
      setEditingEtapaId(null);
      return;
    }

    templateForm.reset({
      nome: selectedTemplate.nome,
      tipo_servico: selectedTemplate.tipo_servico,
      advogado_id: selectedTemplate.advogado_id ?? "",
      ativo: selectedTemplate.ativo,
      observacoes: selectedTemplate.observacoes ?? "",
    });

    etapaForm.reset({
      nome: "",
      descricao: "",
      ordem: selectedTemplate.etapas_template.length + 1,
      obrigatoria: true,
      prazo_padrao_dias: "",
      observacoes: "",
    });
    setEditingEtapaId(null);
  }, [etapaForm, selectedTemplate, templateForm]);

  const salvarTemplateMutation = useMutation({
    mutationFn: async (values: TemplateFormValues) =>
      salvarTemplate({
        id: selectedTemplateId ?? undefined,
        nome: values.nome,
        tipo_servico: values.tipo_servico,
        advogado_id: values.advogado_id,
        ativo: values.ativo,
        observacoes: values.observacoes,
      }),
    onSuccess: (template) => {
      setSelectedTemplateId(template.id);
      setFeedback({ message: "Template salvo com sucesso.", variant: "success" });
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao salvar template.",
        variant: "error",
      }),
  });

  const toggleTemplateMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => alternarTemplateAtivo(id, ativo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const duplicarTemplateMutation = useMutation({
    mutationFn: (templateId: string) => duplicarTemplate(templateId),
    onSuccess: (template) => {
      setFeedback({ message: "Template duplicado com sucesso.", variant: "success" });
      setSelectedTemplateId(template.id);
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao duplicar template.",
        variant: "error",
      }),
  });

  const salvarEtapaMutation = useMutation({
    mutationFn: async (values: EtapaFormValues) => {
      if (!selectedTemplateId) {
        throw new Error("Selecione um template antes de adicionar etapas.");
      }

      return salvarEtapaTemplate({
        id: editingEtapaId ?? undefined,
        template_id: selectedTemplateId,
        nome: values.nome,
        descricao: values.descricao,
        ordem: values.ordem,
        obrigatoria: values.obrigatoria,
        prazo_padrao_dias: values.prazo_padrao_dias ? Number(values.prazo_padrao_dias) : null,
        observacoes: values.observacoes,
      });
    },
    onSuccess: () => {
      setFeedback({ message: "Etapa salva com sucesso.", variant: "success" });
      setEditingEtapaId(null);
      etapaForm.reset({
        nome: "",
        descricao: "",
        ordem: (selectedTemplate?.etapas_template.length ?? 0) + 1,
        obrigatoria: true,
        prazo_padrao_dias: "",
        observacoes: "",
      });
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao salvar etapa.",
        variant: "error",
      }),
  });

  const removerEtapaMutation = useMutation({
    mutationFn: (etapaId: string) => removerEtapaTemplate(etapaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  return (
    <div className="page-grid">
      <Card
        title={selectedTemplateId ? "Editar template" : "Novo template"}
        subtitle="Defina fluxo, tipo de servico e advogado vinculado."
        actions={
          selectedTemplateId ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedTemplateId(null);
                setFeedback(null);
              }}
            >
              Novo template
            </Button>
          ) : undefined
        }
      >
        <form className="form-grid three-columns" onSubmit={templateForm.handleSubmit((v) => salvarTemplateMutation.mutate(v))}>
          <Input label="Nome do fluxo" error={templateForm.formState.errors.nome?.message} {...templateForm.register("nome")} />
          <Input
            label="Tipo de servico"
            error={templateForm.formState.errors.tipo_servico?.message}
            {...templateForm.register("tipo_servico")}
          />
          <Select label="Advogado (opcional)" {...templateForm.register("advogado_id")}>
            <option value="">Template generico</option>
            {advogadosQuery.data?.map((advogado) => (
              <option key={advogado.id} value={advogado.id}>
                {advogado.nome}
              </option>
            ))}
          </Select>

          <TextArea label="Observacoes internas" rows={2} {...templateForm.register("observacoes")} />

          <label className="field-inline">
            <input type="checkbox" {...templateForm.register("ativo")} />
            <span>Template ativo</span>
          </label>

          <Alert message={feedback?.message} variant={feedback?.variant} />

          <div className="actions-row">
            <Button type="submit" loading={salvarTemplateMutation.isPending}>
              {selectedTemplateId ? "Salvar alteracoes" : "Criar template"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Templates cadastrados">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Fluxo</th>
                <th>Tipo</th>
                <th>Advogado</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {templatesQuery.data?.map((template) => {
                const advogado = advogadosQuery.data?.find((item) => item.id === template.advogado_id);

                return (
                  <tr key={template.id} className={template.id === selectedTemplateId ? "is-selected" : ""}>
                    <td>{template.nome}</td>
                    <td>{template.tipo_servico}</td>
                    <td>{advogado?.nome ?? "Generico"}</td>
                    <td>
                      <StatusBadge status={template.ativo ? "em_andamento" : "cancelada"} />
                    </td>
                    <td>
                      <div className="actions-row">
                        <Button variant="secondary" onClick={() => setSelectedTemplateId(template.id)}>
                          Editar
                        </Button>
                        <Button
                          variant={template.ativo ? "danger" : "primary"}
                          onClick={() =>
                            toggleTemplateMutation.mutate({ id: template.id, ativo: !template.ativo })
                          }
                        >
                          {template.ativo ? "Inativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => duplicarTemplateMutation.mutate(template.id)}
                          loading={duplicarTemplateMutation.isPending}
                        >
                          Duplicar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!templatesQuery.data?.length && (
                <tr>
                  <td colSpan={5}>Nenhum template cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Etapas do template"
        subtitle={
          selectedTemplate
            ? `Organize as etapas de "${selectedTemplate.nome}" com ordem e obrigatoriedade.`
            : "Selecione um template para cadastrar etapas."
        }
      >
        {!selectedTemplate && <p>Escolha um template na tabela acima para continuar.</p>}

        {selectedTemplate && (
          <>
            <form
              className="form-grid three-columns"
              onSubmit={etapaForm.handleSubmit((values) => salvarEtapaMutation.mutate(values))}
            >
              <Input label="Nome da etapa" error={etapaForm.formState.errors.nome?.message} {...etapaForm.register("nome")} />
              <Input label="Ordem" type="number" error={etapaForm.formState.errors.ordem?.message} {...etapaForm.register("ordem", { valueAsNumber: true })} />
              <Input label="Prazo padrao (dias)" type="number" {...etapaForm.register("prazo_padrao_dias")} />
              <TextArea label="Descricao" rows={2} {...etapaForm.register("descricao")} />
              <TextArea label="Observacoes" rows={2} {...etapaForm.register("observacoes")} />
              <label className="field-inline">
                <input type="checkbox" {...etapaForm.register("obrigatoria")} />
                <span>Etapa obrigatoria</span>
              </label>

              <div className="actions-row">
                <Button type="submit" loading={salvarEtapaMutation.isPending}>
                  {editingEtapaId ? "Salvar etapa" : "Adicionar etapa"}
                </Button>
                {editingEtapaId && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingEtapaId(null);
                      etapaForm.reset({
                        nome: "",
                        descricao: "",
                        ordem: selectedTemplate.etapas_template.length + 1,
                        obrigatoria: true,
                        prazo_padrao_dias: "",
                        observacoes: "",
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ordem</th>
                    <th>Etapa</th>
                    <th>Obrigatoria</th>
                    <th>Prazo</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTemplate.etapas_template.map((etapa) => (
                    <tr key={etapa.id}>
                      <td>{etapa.ordem}</td>
                      <td>
                        <strong>{etapa.nome}</strong>
                        <br />
                        {etapa.descricao || "-"}
                      </td>
                      <td>{etapa.obrigatoria ? "Sim" : "Nao"}</td>
                      <td>{etapa.prazo_padrao_dias ?? "-"} dias</td>
                      <td>
                        <div className="actions-row">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingEtapaId(etapa.id);
                              etapaForm.reset({
                                nome: etapa.nome,
                                descricao: etapa.descricao ?? "",
                                ordem: etapa.ordem,
                                obrigatoria: etapa.obrigatoria,
                                prazo_padrao_dias: etapa.prazo_padrao_dias?.toString() ?? "",
                                observacoes: etapa.observacoes ?? "",
                              });
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => removerEtapaMutation.mutate(etapa.id)}
                            loading={removerEtapaMutation.isPending}
                          >
                            Remover
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!selectedTemplate.etapas_template.length && (
                    <tr>
                      <td colSpan={5}>Nenhuma etapa cadastrada para este template.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

