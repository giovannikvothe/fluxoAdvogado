import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { TextArea } from "../../components/ui/TextArea";
import { criarDemandaPorTemplate, listarAdvogados, listarClientes, listarTemplatesAtivos } from "../../lib/api";

const schema = z.object({
  titulo: z.string().min(3, "Informe um titulo para a demanda."),
  advogado_id: z.string().min(1, "Selecione um advogado."),
  cliente_id: z.string().min(1, "Selecione um cliente."),
  template_id: z.string().min(1, "Selecione um template."),
  numero_processo: z.string().optional(),
  prazo_final: z.string().optional(),
  observacoes: z.string().optional(),
});

type NovaDemandaFormValues = z.infer<typeof schema>;

const EMPTY_FORM: NovaDemandaFormValues = {
  titulo: "",
  advogado_id: "",
  cliente_id: "",
  template_id: "",
  numero_processo: "",
  prazo_final: "",
  observacoes: "",
};

export function NovaDemandaPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{ message: string; variant: "error" | "success" | "info" } | null>(
    null,
  );

  const form = useForm<NovaDemandaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_FORM,
  });

  const advogadoSelecionado = useWatch({
    control: form.control,
    name: "advogado_id",
  });

  const advogadosQuery = useQuery({ queryKey: ["advogados"], queryFn: listarAdvogados });
  const clientesQuery = useQuery({ queryKey: ["clientes"], queryFn: listarClientes });
  const templatesQuery = useQuery({ queryKey: ["templates-ativos"], queryFn: listarTemplatesAtivos });

  const templatesDisponiveis = useMemo(() => {
    return (templatesQuery.data ?? []).filter(
      (template) => !template.advogado_id || template.advogado_id === advogadoSelecionado,
    );
  }, [advogadoSelecionado, templatesQuery.data]);

  const criarMutation = useMutation({
    mutationFn: criarDemandaPorTemplate,
    onSuccess: (demandaId) => {
      form.reset(EMPTY_FORM);
      navigate(`/demandas/${demandaId}`);
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao criar demanda.",
        variant: "error",
      }),
  });

  return (
    <Card
      title="Nova demanda"
      subtitle="Crie uma instancia real de fluxo com advogado, cliente e template."
    >
      <form className="form-grid three-columns" onSubmit={form.handleSubmit((values) => criarMutation.mutate(values))}>
        <Input label="Titulo da demanda" error={form.formState.errors.titulo?.message} {...form.register("titulo")} />

        <Select
          label="Advogado"
          error={form.formState.errors.advogado_id?.message}
          {...form.register("advogado_id")}
        >
          <option value="">Selecione</option>
          {advogadosQuery.data?.map((advogado) => (
            <option key={advogado.id} value={advogado.id}>
              {advogado.nome}
            </option>
          ))}
        </Select>

        <Select
          label="Cliente"
          error={form.formState.errors.cliente_id?.message}
          {...form.register("cliente_id")}
        >
          <option value="">Selecione</option>
          {clientesQuery.data?.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </Select>

        <Select
          label="Template"
          error={form.formState.errors.template_id?.message}
          {...form.register("template_id")}
        >
          <option value="">Selecione</option>
          {templatesDisponiveis.map((template) => (
            <option key={template.id} value={template.id}>
              {template.nome}
            </option>
          ))}
        </Select>

        <Input label="Numero do processo" {...form.register("numero_processo")} />
        <Input label="Prazo final" type="date" {...form.register("prazo_final")} />
        <TextArea label="Observacoes" rows={3} {...form.register("observacoes")} />

        <Alert message={feedback?.message} variant={feedback?.variant} />

        <div className="actions-row">
          <Button type="submit" loading={criarMutation.isPending}>
            Criar demanda
          </Button>
        </div>
      </form>
    </Card>
  );
}

