import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../app/AuthProvider";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { loginWithPassword, registerWithPassword } from "../../lib/api";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha precisa de ao menos 6 caracteres."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { session, isSupabaseConfigured } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      if (mode === "signup") {
        await registerWithPassword(values.email, values.password);
        return null;
      }

      return loginWithPassword(values.email, values.password);
    },
    onSuccess: () => {
      if (mode === "signup") {
        setMessage("Conta criada. Verifique seu e-mail para confirmar o acesso.");
        return;
      }

      navigate("/demandas", { replace: true });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Falha ao autenticar.");
    },
  });

  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <Card className="w-full max-w-xl border-border/80 bg-card/95 shadow-xl">
          <CardHeader>
            <CardTitle>Configure o Supabase</CardTitle>
            <CardDescription>
              Crie um arquivo <code>.env</code> com{" "}
              <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/demandas" replace />;
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(9,106,95,0.14),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(184,137,75,0.2),transparent_28%)]" />
      <Card className="relative w-full max-w-md border-border/85 bg-card/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            fluxoadvogado
          </p>
          <CardTitle className="text-2xl">FluxoAdvogado</CardTitle>
          <CardDescription>
            Organize demandas juridicas por templates operacionais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="grid gap-2">
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                {...form.register("email")}
              />
              {form.formState.errors.email?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                {...form.register("password")}
              />
              {form.formState.errors.password?.message ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            {message ? (
              <Alert variant={mode === "signup" ? "default" : "destructive"}>
                <AlertTitle>{mode === "signup" ? "Conta criada" : "Atencao"}</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="mt-1 w-full" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Processando..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4 border-t border-border/70 pt-4">
          <span className="text-sm text-muted-foreground">
            {mode === "login" ? "Nao tem conta?" : "Ja possui conta?"}
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
            }}
          >
            {mode === "login" ? "Registrar" : "Fazer login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
