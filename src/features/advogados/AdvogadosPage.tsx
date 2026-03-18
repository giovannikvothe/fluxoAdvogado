import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  alternarAdvogadoAtivo,
  listarAdvogados,
  salvarAdvogado,
} from "../../lib/api";

const advogadoSchema = z.object({
  nome: z.string().min(3, "Informe ao menos 3 caracteres."),
  telefone: z.string().optional(),
  email: z.union([z.string().email("E-mail invalido."), z.literal("")]).optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean(),
});

type AdvogadoFormValues = z.infer<typeof advogadoSchema>;

const EMPTY_ADVOGADO: AdvogadoFormValues = {
  nome: "",
  telefone: "",
  email: "",
  observacoes: "",
  ativo: true,
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function AdvogadosPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    variant: "error" | "success" | "info";
  } | null>(null);

  const form = useForm<AdvogadoFormValues>({
    resolver: zodResolver(advogadoSchema),
    defaultValues: EMPTY_ADVOGADO,
  });

  const advogadosQuery = useQuery({
    queryKey: ["advogados"],
    queryFn: listarAdvogados,
  });

  const salvarMutation = useMutation({
    mutationFn: async (values: AdvogadoFormValues) =>
      salvarAdvogado({ ...values, id: editingId ?? undefined }),
    onSuccess: () => {
      setFeedback({ message: "Advogado salvo com sucesso.", variant: "success" });
      setEditingId(null);
      form.reset(EMPTY_ADVOGADO);
      void queryClient.invalidateQueries({ queryKey: ["advogados"] });
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao salvar advogado.",
        variant: "error",
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      alternarAdvogadoAtivo(id, ativo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["advogados"] });
    },
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>{editingId ? "Editar advogado" : "Novo advogado"}</CardTitle>
          <CardDescription>
            Cadastre os profissionais contratantes para vincular as demandas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => salvarMutation.mutate(values))}
          >
            <div className="grid gap-2">
              <Label htmlFor="advogado-nome">Nome</Label>
              <Input id="advogado-nome" {...form.register("nome")} />
              <FieldError message={form.formState.errors.nome?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="advogado-telefone">Telefone</Label>
              <Input id="advogado-telefone" {...form.register("telefone")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="advogado-email">E-mail</Label>
              <Input id="advogado-email" {...form.register("email")} />
              <FieldError message={form.formState.errors.email?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="advogado-observacoes">Observacoes</Label>
              <Textarea
                id="advogado-observacoes"
                rows={3}
                {...form.register("observacoes")}
              />
            </div>

            <Controller
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <label className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  />
                  <span className="text-sm font-medium">Ativo</span>
                </label>
              )}
            />

            {feedback ? (
              <Alert variant={feedback.variant === "error" ? "destructive" : "default"}>
                <AlertTitle>{feedback.variant === "error" ? "Falha" : "Atualizacao"}</AlertTitle>
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={salvarMutation.isPending}>
                {salvarMutation.isPending
                  ? "Processando..."
                  : editingId
                    ? "Salvar alteracoes"
                    : "Criar advogado"}
              </Button>
              {editingId ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    form.reset(EMPTY_ADVOGADO);
                  }}
                >
                  Cancelar edicao
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>Advogados cadastrados</CardTitle>
          <CardDescription>Lista operacional para vinculacao de demandas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[220px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advogadosQuery.data?.map((advogado) => (
                <TableRow key={advogado.id}>
                  <TableCell className="font-semibold">{advogado.nome}</TableCell>
                  <TableCell>
                    <p>{advogado.email || "-"}</p>
                    <p className="text-xs text-muted-foreground">{advogado.telefone || "-"}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={advogado.ativo ? "em_andamento" : "cancelada"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingId(advogado.id);
                          form.reset({
                            nome: advogado.nome,
                            telefone: advogado.telefone ?? "",
                            email: advogado.email ?? "",
                            observacoes: advogado.observacoes ?? "",
                            ativo: advogado.ativo,
                          });
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant={advogado.ativo ? "destructive" : "default"}
                        size="sm"
                        disabled={toggleMutation.isPending}
                        onClick={() =>
                          toggleMutation.mutate({ id: advogado.id, ativo: !advogado.ativo })
                        }
                      >
                        {advogado.ativo ? "Inativar" : "Ativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!advogadosQuery.data?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                    Nenhum advogado cadastrado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
