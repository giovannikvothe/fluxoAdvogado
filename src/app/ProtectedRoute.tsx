import { Navigate, Outlet } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "./AuthProvider";

function CenterMessage(props: {
  title: string;
  description?: ReactNode;
}): ReactElement {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-lg border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
          {props.description ? (
            <CardDescription>{props.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Aguarde alguns instantes.
        </CardContent>
      </Card>
    </div>
  );
}

export function ProtectedRoute() {
  const { isLoading, isSupabaseConfigured, session } = useAuth();

  if (isLoading) {
    return <CenterMessage title="Carregando sessao..." />;
  }

  if (!isSupabaseConfigured) {
    return (
      <CenterMessage
        title="Configure o Supabase"
        description={
          <>
            Defina <code>VITE_SUPABASE_URL</code> e{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code>{" "}
            para habilitar autenticacao e dados reais.
          </>
        }
      />
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
