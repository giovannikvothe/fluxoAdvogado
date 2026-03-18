import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TextArea } from "../../components/ui/TextArea";
import { alternarAdvogadoAtivo, listarAdvogados, salvarAdvogado } from "../../lib/api";

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

export function AdvogadosPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; variant: "error" | "success" | "info" } | null>(
    null,
  );

  const form = useForm<AdvogadoFormValues>({
    resolver: zodResolver(advogadoSchema),
    defaultValues: EMPTY_ADVOGADO,
  });

  const advogadosQuery = useQuery({
    queryKey: ["advogados"],
    queryFn: listarAdvogados,
  });

  const salvarMutation = useMutation({
    mutationFn: async (values: AdvogadoFormValues) => salvarAdvogado({ ...values, id: editingId ?? undefined }),
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
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => alternarAdvogadoAtivo(id, ativo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["advogados"] });
    },
  });

  return (
    <div className="page-grid two-columns">
      <Card
        title={editingId ? "Editar advogado" : "Novo advogado"}
        subtitle="Cadastre os profissionais contratantes para vincular as demandas."
      >
        <form className="form-grid" onSubmit={form.handleSubmit((values) => salvarMutation.mutate(values))}>
          <Input label="Nome" error={form.formState.errors.nome?.message} {...form.register("nome")} />
          <Input label="Telefone" {...form.register("telefone")} />
          <Input label="E-mail" error={form.formState.errors.email?.message} {...form.register("email")} />
          <TextArea label="Observacoes" rows={3} {...form.register("observacoes")} />

          <label className="field-inline">
            <input type="checkbox" {...form.register("ativo")} />
            <span>Ativo</span>
          </label>

          <Alert message={feedback?.message} variant={feedback?.variant} />

          <div className="actions-row">
            <Button type="submit" loading={salvarMutation.isPending}>
              {editingId ? "Salvar alteracoes" : "Criar advogado"}
            </Button>
            {editingId && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  form.reset(EMPTY_ADVOGADO);
                }}
              >
                Cancelar edicao
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Advogados cadastrados">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {advogadosQuery.data?.map((advogado) => (
                <tr key={advogado.id}>
                  <td>{advogado.nome}</td>
                  <td>
                    {advogado.email || "-"}
                    <br />
                    {advogado.telefone || "-"}
                  </td>
                  <td>
                    <StatusBadge status={advogado.ativo ? "em_andamento" : "cancelada"} />
                  </td>
                  <td>
                    <div className="actions-row">
                      <Button
                        variant="secondary"
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
                        variant={advogado.ativo ? "danger" : "primary"}
                        onClick={() => toggleMutation.mutate({ id: advogado.id, ativo: !advogado.ativo })}
                        loading={toggleMutation.isPending}
                      >
                        {advogado.ativo ? "Inativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!advogadosQuery.data?.length && (
                <tr>
                  <td colSpan={4}>Nenhum advogado cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

