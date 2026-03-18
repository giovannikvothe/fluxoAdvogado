import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AdvogadosPage } from "../features/advogados/AdvogadosPage";
import { LoginPage } from "../features/auth/LoginPage";
import { ClientesPage } from "../features/clientes/ClientesPage";
import { DemandaDetalhePage } from "../features/demandas/DemandaDetalhePage";
import { DemandasPage } from "../features/demandas/DemandasPage";
import { NovaDemandaPage } from "../features/demandas/NovaDemandaPage";
import { TemplatesPage } from "../features/templates/TemplatesPage";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/demandas" replace />} />
            <Route path="/advogados" element={<AdvogadosPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/demandas" element={<DemandasPage />} />
            <Route path="/demandas/nova" element={<NovaDemandaPage />} />
            <Route path="/demandas/:demandaId" element={<DemandaDetalhePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

