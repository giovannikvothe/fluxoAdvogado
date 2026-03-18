import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { TextArea } from "../../components/ui/TextArea";
import { listarClientes, salvarCliente } from "../../lib/api";

const clienteSchema = z.object({
  nome: z.string().min(3, "Informe ao menos 3 caracteres."),
  documento: z.string().optional(),
  telefone: z.string().optional(),
  email: z.union([z.string().email("E-mail invalido."), z.literal("")]).optional(),
  observacoes: z.string().optional(),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

const EMPTY_CLIENTE: ClienteFormValues = {
  nome: "",
  documento: "",
  telefone: "",
  email: "",
  observacoes: "",
};

export function ClientesPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; variant: "error" | "success" | "info" } | null>(
    null,
  );

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: EMPTY_CLIENTE,
  });

  const clientesQuery = useQuery({
    queryKey: ["clientes"],
    queryFn: listarClientes,
  });

  const salvarMutation = useMutation({
    mutationFn: async (values: ClienteFormValues) => salvarCliente({ ...values, id: editingId ?? undefined }),
    onSuccess: () => {
      setFeedback({ message: "Cliente salvo com sucesso.", variant: "success" });
      setEditingId(null);
      form.reset(EMPTY_CLIENTE);
      void queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (error) =>
      setFeedback({
        message: error instanceof Error ? error.message : "Falha ao salvar cliente.",
        variant: "error",
      }),
  });

  return (
    <div className="page-grid two-columns">
      <Card
        title={editingId ? "Editar cliente" : "Novo cliente"}
        subtitle="Cadastre os clientes finais para vincular aos fluxos."
      >
        <form className="form-grid" onSubmit={form.handleSubmit((values) => salvarMutation.mutate(values))}>
          <Input label="Nome" error={form.formState.errors.nome?.message} {...form.register("nome")} />
          <Input label="Documento" {...form.register("documento")} />
          <Input label="Telefone" {...form.register("telefone")} />
          <Input label="E-mail" error={form.formState.errors.email?.message} {...form.register("email")} />
          <TextArea label="Observacoes" rows={3} {...form.register("observacoes")} />

          <Alert message={feedback?.message} variant={feedback?.variant} />

          <div className="actions-row">
            <Button type="submit" loading={salvarMutation.isPending}>
              {editingId ? "Salvar alteracoes" : "Criar cliente"}
            </Button>
            {editingId && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  form.reset(EMPTY_CLIENTE);
                }}
              >
                Cancelar edicao
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Clientes cadastrados">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Documento</th>
                <th>Contato</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {clientesQuery.data?.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nome}</td>
                  <td>{cliente.documento || "-"}</td>
                  <td>
                    {cliente.email || "-"}
                    <br />
                    {cliente.telefone || "-"}
                  </td>
                  <td>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingId(cliente.id);
                        form.reset({
                          nome: cliente.nome,
                          documento: cliente.documento ?? "",
                          telefone: cliente.telefone ?? "",
                          email: cliente.email ?? "",
                          observacoes: cliente.observacoes ?? "",
                        });
                      }}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}

              {!clientesQuery.data?.length && (
                <tr>
                  <td colSpan={4}>Nenhum cliente cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

