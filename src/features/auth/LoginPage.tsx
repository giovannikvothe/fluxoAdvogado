import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../app/AuthProvider";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
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
      <div className="centered-panel">
        <Card title="Configure o Supabase">
          <p>
            Crie um arquivo <code>.env</code> com <code>VITE_SUPABASE_URL</code> e{" "}
            <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </Card>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/demandas" replace />;
  }

  return (
    <div className="centered-panel">
      <Card
        className="auth-card"
        title="FluxoAdvogado"
        subtitle="Organize demandas juridicas por templates operacionais."
      >
        <form className="form-grid" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <Input
            label="E-mail"
            placeholder="voce@exemplo.com"
            autoComplete="email"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <Input
            label="Senha"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />

          <Alert message={message} variant={mode === "signup" ? "success" : "error"} />

          <Button type="submit" loading={mutation.isPending}>
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="auth-switch">
          <span>
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
        </div>
      </Card>
    </div>
  );
}

