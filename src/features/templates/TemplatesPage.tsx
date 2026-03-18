import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
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

const EMPTY_ETAPA: EtapaFormValues = {
  nome: "",
  descricao: "",
  ordem: 1,
  obrigatoria: true,
  prazo_padrao_dias: "",
  observacoes: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function TemplatesPage() {
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingEtapaId, setEditingEtapaId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    variant: "error" | "success" | "info";
  } | null>(null);

  const templateForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: EMPTY_TEMPLATE,
  });

  const etapaForm = useForm<EtapaFormValues>({
    resolver: zodResolver(etapaSchema),
    defaultValues: EMPTY_ETAPA,
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
    () =>
      templatesQuery.data?.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templatesQuery.data]
  );

  useEffect(() => {
    if (!selectedTemplate) {
      templateForm.reset(EMPTY_TEMPLATE);
      etapaForm.reset(EMPTY_ETAPA);
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
      ...EMPTY_ETAPA,
      ordem: selectedTemplate.etapas_template.length + 1,
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
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      alternarTemplateAtivo(id, ativo),
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
        ...EMPTY_ETAPA,
        ordem: (selectedTemplate?.etapas_template.length ?? 0) + 1,
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
    <div className="grid gap-5">
      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{selectedTemplateId ? "Editar template" : "Novo template"}</CardTitle>
            <CardDescription>
              Defina fluxo, tipo de servico e advogado vinculado.
            </CardDescription>
          </div>
          {selectedTemplateId ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedTemplateId(null);
                setFeedback(null);
              }}
            >
              Novo template
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={templateForm.handleSubmit((values) =>
              salvarTemplateMutation.mutate(values)
            )}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="template-nome">Nome do fluxo</Label>
                <Input id="template-nome" {...templateForm.register("nome")} />
                <FieldError message={templateForm.formState.errors.nome?.message} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template-tipo">Tipo de servico</Label>
                <Input id="template-tipo" {...templateForm.register("tipo_servico")} />
                <FieldError message={templateForm.formState.errors.tipo_servico?.message} />
              </div>

              <Controller
                control={templateForm.control}
                name="advogado_id"
                render={({ field }) => (
                  <div className="grid gap-2">
                    <Label>Advogado (opcional)</Label>
                    <Select value={field.value || "generic"} onValueChange={(value) => field.onChange(value === "generic" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Template generico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">Template generico</SelectItem>
                        {advogadosQuery.data?.map((advogado) => (
                          <SelectItem key={advogado.id} value={advogado.id}>
                            {advogado.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <div className="grid gap-2 md:col-span-2 xl:col-span-3">
                <Label htmlFor="template-observacoes">Observacoes internas</Label>
                <Textarea
                  id="template-observacoes"
                  rows={2}
                  {...templateForm.register("observacoes")}
                />
              </div>

              <Controller
                control={templateForm.control}
                name="ativo"
                render={({ field }) => (
                  <label className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                    <span className="text-sm font-medium">Template ativo</span>
                  </label>
                )}
              />
            </div>

            {feedback ? (
              <Alert variant={feedback.variant === "error" ? "destructive" : "default"}>
                <AlertTitle>{feedback.variant === "error" ? "Falha" : "Atualizacao"}</AlertTitle>
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            ) : null}

            <div>
              <Button type="submit" disabled={salvarTemplateMutation.isPending}>
                {salvarTemplateMutation.isPending
                  ? "Processando..."
                  : selectedTemplateId
                    ? "Salvar alteracoes"
                    : "Criar template"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>Templates cadastrados</CardTitle>
          <CardDescription>Selecione um template para editar e gerenciar etapas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fluxo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Advogado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[250px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesQuery.data?.map((template) => {
                const advogado = advogadosQuery.data?.find(
                  (item) => item.id === template.advogado_id
                );

                return (
                  <TableRow
                    key={template.id}
                    className={template.id === selectedTemplateId ? "bg-muted/35" : ""}
                  >
                    <TableCell className="font-semibold">{template.nome}</TableCell>
                    <TableCell>{template.tipo_servico}</TableCell>
                    <TableCell>{advogado?.nome ?? "Generico"}</TableCell>
                    <TableCell>
                      <StatusBadge status={template.ativo ? "em_andamento" : "cancelada"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedTemplateId(template.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant={template.ativo ? "destructive" : "default"}
                          size="sm"
                          onClick={() =>
                            toggleTemplateMutation.mutate({
                              id: template.id,
                              ativo: !template.ativo,
                            })
                          }
                        >
                          {template.ativo ? "Inativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={duplicarTemplateMutation.isPending}
                          onClick={() => duplicarTemplateMutation.mutate(template.id)}
                        >
                          {duplicarTemplateMutation.isPending ? "Processando..." : "Duplicar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!templatesQuery.data?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    Nenhum template cadastrado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>Etapas do template</CardTitle>
          <CardDescription>
            {selectedTemplate
              ? `Organize as etapas de "${selectedTemplate.nome}" com ordem e obrigatoriedade.`
              : "Selecione um template para cadastrar etapas."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!selectedTemplate ? (
            <p className="text-sm text-muted-foreground">
              Escolha um template na tabela acima para continuar.
            </p>
          ) : (
            <>
              <form
                className="grid gap-4"
                onSubmit={etapaForm.handleSubmit((values) =>
                  salvarEtapaMutation.mutate(values)
                )}
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="etapa-nome">Nome da etapa</Label>
                    <Input id="etapa-nome" {...etapaForm.register("nome")} />
                    <FieldError message={etapaForm.formState.errors.nome?.message} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="etapa-ordem">Ordem</Label>
                    <Input
                      id="etapa-ordem"
                      type="number"
                      {...etapaForm.register("ordem", { valueAsNumber: true })}
                    />
                    <FieldError message={etapaForm.formState.errors.ordem?.message} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="etapa-prazo">Prazo padrao (dias)</Label>
                    <Input
                      id="etapa-prazo"
                      type="number"
                      {...etapaForm.register("prazo_padrao_dias")}
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2 xl:col-span-3">
                    <Label htmlFor="etapa-descricao">Descricao</Label>
                    <Textarea
                      id="etapa-descricao"
                      rows={2}
                      {...etapaForm.register("descricao")}
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2 xl:col-span-3">
                    <Label htmlFor="etapa-observacoes">Observacoes</Label>
                    <Textarea
                      id="etapa-observacoes"
                      rows={2}
                      {...etapaForm.register("observacoes")}
                    />
                  </div>

                  <Controller
                    control={etapaForm.control}
                    name="obrigatoria"
                    render={({ field }) => (
                      <label className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                        />
                        <span className="text-sm font-medium">Etapa obrigatoria</span>
                      </label>
                    )}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={salvarEtapaMutation.isPending}>
                    {salvarEtapaMutation.isPending
                      ? "Processando..."
                      : editingEtapaId
                        ? "Salvar etapa"
                        : "Adicionar etapa"}
                  </Button>
                  {editingEtapaId ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingEtapaId(null);
                        etapaForm.reset({
                          ...EMPTY_ETAPA,
                          ordem: selectedTemplate.etapas_template.length + 1,
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                  ) : null}
                </div>
              </form>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70px]">Ordem</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead className="w-[130px]">Obrigatoria</TableHead>
                    <TableHead className="w-[140px]">Prazo</TableHead>
                    <TableHead className="w-[170px]">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTemplate.etapas_template.map((etapa) => (
                    <TableRow key={etapa.id}>
                      <TableCell>{etapa.ordem}</TableCell>
                      <TableCell>
                        <p className="font-semibold">{etapa.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {etapa.descricao || "-"}
                        </p>
                      </TableCell>
                      <TableCell>{etapa.obrigatoria ? "Sim" : "Nao"}</TableCell>
                      <TableCell>{etapa.prazo_padrao_dias ?? "-"} dias</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingEtapaId(etapa.id);
                              etapaForm.reset({
                                nome: etapa.nome,
                                descricao: etapa.descricao ?? "",
                                ordem: etapa.ordem,
                                obrigatoria: etapa.obrigatoria,
                                prazo_padrao_dias:
                                  etapa.prazo_padrao_dias?.toString() ?? "",
                                observacoes: etapa.observacoes ?? "",
                              });
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={removerEtapaMutation.isPending}
                            onClick={() => removerEtapaMutation.mutate(etapa.id)}
                          >
                            {removerEtapaMutation.isPending ? "Processando..." : "Remover"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!selectedTemplate.etapas_template.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                        Nenhuma etapa cadastrada para este template.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
