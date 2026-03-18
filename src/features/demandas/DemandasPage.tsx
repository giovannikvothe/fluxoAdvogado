import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { formatDate, isDemandOverdue } from "../../lib/format";
import {
  listarAdvogados,
  listarClientes,
  listarDemandasComRelacoes,
  listarTemplatesComEtapas,
} from "../../lib/api";
import type { StatusDemanda } from "../../types/domain";

type AbaListagem = "ativas" | "finalizadas";
type GenericFilterValue = "all" | string;

const STATUS_FILTERS: Array<{ value: StatusDemanda | "todas"; label: string }> = [
  { value: "todas", label: "Todos status" },
  { value: "nao_iniciada", label: "Nao iniciada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "aguardando_retorno", label: "Aguardando retorno" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
];

function isClosedStatus(status: StatusDemanda): boolean {
  return status === "finalizada" || status === "cancelada";
}

function KpiCard(props: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card/70 p-4 shadow-sm ${
        props.alert ? "border-destructive/35" : "border-border/70"
      }`}
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {props.label}
      </p>
      <p className="font-display text-3xl font-semibold">{props.value}</p>
    </div>
  );
}

export function DemandasPage() {
  const [aba, setAba] = useState<AbaListagem>("ativas");
  const [statusFilter, setStatusFilter] = useState<StatusDemanda | "todas">("todas");
  const [advogadoFilter, setAdvogadoFilter] = useState<GenericFilterValue>("all");
  const [clienteFilter, setClienteFilter] = useState<GenericFilterValue>("all");
  const [templateFilter, setTemplateFilter] = useState<GenericFilterValue>("all");
  const [busca, setBusca] = useState("");

  const demandasQuery = useQuery({
    queryKey: ["demandas"],
    queryFn: listarDemandasComRelacoes,
  });
  const advogadosQuery = useQuery({ queryKey: ["advogados"], queryFn: listarAdvogados });
  const clientesQuery = useQuery({ queryKey: ["clientes"], queryFn: listarClientes });
  const templatesQuery = useQuery({ queryKey: ["templates"], queryFn: listarTemplatesComEtapas });

  const demandasFiltradas = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();

    return (demandasQuery.data ?? []).filter((demanda) => {
      if (aba === "ativas" && isClosedStatus(demanda.status)) {
        return false;
      }

      if (aba === "finalizadas" && !isClosedStatus(demanda.status)) {
        return false;
      }

      if (statusFilter !== "todas" && demanda.status !== statusFilter) {
        return false;
      }

      if (advogadoFilter !== "all" && demanda.advogado_id !== advogadoFilter) {
        return false;
      }

      if (clienteFilter !== "all" && demanda.cliente_id !== clienteFilter) {
        return false;
      }

      if (templateFilter !== "all" && demanda.template_id !== templateFilter) {
        return false;
      }

      if (!termoBusca) {
        return true;
      }

      const searchable = [
        demanda.titulo,
        demanda.numero_processo,
        demanda.advogado?.nome,
        demanda.cliente?.nome,
        demanda.template?.nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(termoBusca);
    });
  }, [
    aba,
    advogadoFilter,
    busca,
    clienteFilter,
    demandasQuery.data,
    statusFilter,
    templateFilter,
  ]);

  const totalAtivas = (demandasQuery.data ?? []).filter(
    (demanda) => !isClosedStatus(demanda.status)
  ).length;
  const totalFinalizadas = (demandasQuery.data ?? []).filter((demanda) =>
    isClosedStatus(demanda.status)
  ).length;
  const totalAtrasadas = (demandasQuery.data ?? []).filter((demanda) =>
    isDemandOverdue(demanda.status, demanda.prazo_final)
  ).length;

  return (
    <div className="grid gap-5">
      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Listagem geral de demandas</CardTitle>
            <CardDescription>
              Visualize ativas, finalizadas e pendencias com filtros operacionais.
            </CardDescription>
          </div>
          <Button asChild>
            <Link to="/demandas/nova">Criar demanda</Link>
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <KpiCard label="Ativas" value={totalAtivas} />
            <KpiCard label="Finalizadas" value={totalFinalizadas} />
            <KpiCard label="Atrasadas" value={totalAtrasadas} alert />
          </div>

          <Tabs value={aba} onValueChange={(value) => setAba(value as AbaListagem)}>
            <TabsList className="grid w-full grid-cols-2 sm:w-[360px]">
              <TabsTrigger value="ativas">Ativas</TabsTrigger>
              <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="grid gap-2 xl:col-span-2">
              <Label htmlFor="busca-demandas">Busca textual</Label>
              <Input
                id="busca-demandas"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Titulo, cliente, processo..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusDemanda | "todas")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Advogado</Label>
              <Select value={advogadoFilter} onValueChange={setAdvogadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {advogadosQuery.data?.map((advogado) => (
                    <SelectItem key={advogado.id} value={advogado.id}>
                      {advogado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Cliente</Label>
              <Select value={clienteFilter} onValueChange={setClienteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clientesQuery.data?.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:col-span-2 xl:col-span-1">
              <Label>Template</Label>
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {templatesQuery.data?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>Demandas</CardTitle>
          <CardDescription>
            Resultado da aba {aba === "ativas" ? "ativas" : "finalizadas"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Advogado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prazo final</TableHead>
                <TableHead className="w-[130px]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandasFiltradas.map((demanda) => (
                <TableRow
                  key={demanda.id}
                  className={isDemandOverdue(demanda.status, demanda.prazo_final) ? "bg-destructive/5" : ""}
                >
                  <TableCell>
                    <p className="font-semibold">{demanda.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      Processo: {demanda.numero_processo || "-"}
                    </p>
                  </TableCell>
                  <TableCell>{demanda.advogado?.nome ?? "-"}</TableCell>
                  <TableCell>{demanda.cliente?.nome ?? "-"}</TableCell>
                  <TableCell>{demanda.template?.nome ?? "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={demanda.status} />
                  </TableCell>
                  <TableCell>{formatDate(demanda.prazo_final)}</TableCell>
                  <TableCell>
                    <Button asChild variant="secondary" size="sm">
                      <Link to={`/demandas/${demanda.id}`}>Abrir</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {!demandasFiltradas.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                    Nenhuma demanda encontrada com os filtros atuais.
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
