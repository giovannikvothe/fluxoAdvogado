import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import {
  criarDemandaPorTemplate,
  listarAdvogados,
  listarClientes,
  listarTemplatesAtivos,
} from "../../lib/api";

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

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function NovaDemandaPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{
    message: string;
    variant: "error" | "success" | "info";
  } | null>(null);

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
  const templatesQuery = useQuery({
    queryKey: ["templates-ativos"],
    queryFn: listarTemplatesAtivos,
  });

  const templatesDisponiveis = useMemo(
    () =>
      (templatesQuery.data ?? []).filter(
        (template) =>
          !template.advogado_id || template.advogado_id === advogadoSelecionado
      ),
    [advogadoSelecionado, templatesQuery.data]
  );

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
    <Card className="border-border/80 bg-card/95 shadow-lg">
      <CardHeader>
        <CardTitle>Nova demanda</CardTitle>
        <CardDescription>
          Crie uma instancia real de fluxo com advogado, cliente e template.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) => criarMutation.mutate(values))}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="grid gap-2 md:col-span-2 xl:col-span-1">
              <Label htmlFor="demanda-titulo">Titulo da demanda</Label>
              <Input id="demanda-titulo" {...form.register("titulo")} />
              <FieldError message={form.formState.errors.titulo?.message} />
            </div>

            <Controller
              control={form.control}
              name="advogado_id"
              render={({ field }) => (
                <div className="grid gap-2">
                  <Label>Advogado</Label>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("template_id", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {advogadosQuery.data?.map((advogado) => (
                        <SelectItem key={advogado.id} value={advogado.id}>
                          {advogado.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={form.formState.errors.advogado_id?.message} />
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientesQuery.data?.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={form.formState.errors.cliente_id?.message} />
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="template_id"
              render={({ field }) => (
                <div className="grid gap-2">
                  <Label>Template</Label>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesDisponiveis.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={form.formState.errors.template_id?.message} />
                </div>
              )}
            />

            <div className="grid gap-2">
              <Label htmlFor="demanda-processo">Numero do processo</Label>
              <Input id="demanda-processo" {...form.register("numero_processo")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="demanda-prazo">Prazo final</Label>
              <Input id="demanda-prazo" type="date" {...form.register("prazo_final")} />
            </div>

            <div className="grid gap-2 md:col-span-2 xl:col-span-3">
              <Label htmlFor="demanda-observacoes">Observacoes</Label>
              <Textarea
                id="demanda-observacoes"
                rows={4}
                {...form.register("observacoes")}
              />
            </div>
          </div>

          {feedback ? (
            <Alert variant={feedback.variant === "error" ? "destructive" : "default"}>
              <AlertTitle>{feedback.variant === "error" ? "Falha" : "Atualizacao"}</AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={criarMutation.isPending}>
              {criarMutation.isPending ? "Processando..." : "Criar demanda"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
