import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
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

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function ClientesPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    variant: "error" | "success" | "info";
  } | null>(null);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: EMPTY_CLIENTE,
  });

  const clientesQuery = useQuery({
    queryKey: ["clientes"],
    queryFn: listarClientes,
  });

  const salvarMutation = useMutation({
    mutationFn: async (values: ClienteFormValues) =>
      salvarCliente({ ...values, id: editingId ?? undefined }),
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
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>{editingId ? "Editar cliente" : "Novo cliente"}</CardTitle>
          <CardDescription>
            Cadastre os clientes finais para vincular aos fluxos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => salvarMutation.mutate(values))}
          >
            <div className="grid gap-2">
              <Label htmlFor="cliente-nome">Nome</Label>
              <Input id="cliente-nome" {...form.register("nome")} />
              <FieldError message={form.formState.errors.nome?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cliente-documento">Documento</Label>
              <Input id="cliente-documento" {...form.register("documento")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cliente-telefone">Telefone</Label>
              <Input id="cliente-telefone" {...form.register("telefone")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cliente-email">E-mail</Label>
              <Input id="cliente-email" {...form.register("email")} />
              <FieldError message={form.formState.errors.email?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cliente-observacoes">Observacoes</Label>
              <Textarea
                id="cliente-observacoes"
                rows={3}
                {...form.register("observacoes")}
              />
            </div>

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
                    : "Criar cliente"}
              </Button>
              {editingId ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    form.reset(EMPTY_CLIENTE);
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
          <CardTitle>Clientes cadastrados</CardTitle>
          <CardDescription>Base ativa de clientes vinculados aos fluxos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="w-[130px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesQuery.data?.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-semibold">{cliente.nome}</TableCell>
                  <TableCell>{cliente.documento || "-"}</TableCell>
                  <TableCell>
                    <p>{cliente.email || "-"}</p>
                    <p className="text-xs text-muted-foreground">{cliente.telefone || "-"}</p>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
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
                  </TableCell>
                </TableRow>
              ))}

              {!clientesQuery.data?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                    Nenhum cliente cadastrado.
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
