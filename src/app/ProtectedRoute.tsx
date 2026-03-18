import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute() {
  const { isLoading, isSupabaseConfigured, session } = useAuth();

  if (isLoading) {
    return (
      <div className="centered-panel">
        <div className="card">
          <h2>Carregando sessao...</h2>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="centered-panel">
        <div className="card">
          <h2>Configure o Supabase</h2>
          <p>
            Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no arquivo{" "}
            <code>.env</code> para habilitar autenticacao e dados reais.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

