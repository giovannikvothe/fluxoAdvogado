import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { label: "Demandas", to: "/demandas" },
  { label: "Nova demanda", to: "/demandas/nova" },
  { label: "Templates", to: "/templates" },
  { label: "Advogados", to: "/advogados" },
  { label: "Clientes", to: "/clientes" },
];

export function AppShell() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut(): Promise<void> {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-kicker">fluxoadvogado</span>
          <h1>Painel operacional</h1>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn("sidebar-link", isActive && "active")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>{session?.user.email}</p>
          <Button variant="ghost" onClick={() => void handleSignOut()}>
            Sair
          </Button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

