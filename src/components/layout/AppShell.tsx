import {
  BriefcaseBusiness,
  Building2,
  FileStack,
  FolderKanban,
  Scale,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "../ui/sidebar";

const NAV_ITEMS = [
  { label: "Demandas", to: "/demandas", icon: FolderKanban },
  { label: "Nova demanda", to: "/demandas/nova", icon: FileStack },
  { label: "Templates", to: "/templates", icon: BriefcaseBusiness },
  { label: "Advogados", to: "/advogados", icon: Scale },
  { label: "Clientes", to: "/clientes", icon: Building2 },
];

const PAGE_TITLE: Record<string, string> = {
  "/demandas": "Demandas",
  "/demandas/nova": "Nova demanda",
  "/templates": "Templates de fluxo",
  "/advogados": "Advogados",
  "/clientes": "Clientes",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/demandas/") && pathname !== "/demandas/nova") {
    return "Detalhe da demanda";
  }

  return PAGE_TITLE[pathname] ?? "Painel operacional";
}

function isNavItemActive(itemTo: string, pathname: string): boolean {
  if (itemTo === "/demandas") {
    return pathname === "/demandas" || /^\/demandas\/[^/]+$/.test(pathname);
  }

  return pathname.startsWith(itemTo);
}

export function AppShell() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut(): Promise<void> {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="gap-4 border-b border-sidebar-border/70 px-3 py-4">
          <div className="grid gap-1 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-primary">
              fluxoadvogado
            </span>
            <h1 className="font-display text-lg font-semibold leading-tight">
              Painel operacional
            </h1>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegacao</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isNavItemActive(item.to, location.pathname)}
                    >
                      <NavLink to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/70 p-3">
          <p className="truncate px-1 text-xs text-sidebar-foreground/70">
            {session?.user.email}
          </p>
          <Button
            variant="outline"
            className="justify-start border-sidebar-border bg-transparent"
            onClick={() => void handleSignOut()}
          >
            Sair
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-transparent">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
            <SidebarTrigger />
            <div className="h-6 w-px bg-border" />
            <div className="grid">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                modulo
              </p>
              <h2 className="font-display text-sm font-semibold sm:text-base">
                {getPageTitle(location.pathname)}
              </h2>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "min-h-[calc(100vh-3.5rem)] px-4 py-5 lg:px-6 lg:py-6",
            "bg-gradient-to-br from-background/0 via-background/20 to-secondary/25"
          )}
        >
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
