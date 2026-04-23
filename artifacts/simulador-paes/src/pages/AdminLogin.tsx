import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Rocket, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminLogin } from "@workspace/api-client-react";
import { setToken, getToken } from "@/lib/auth";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const login = useAdminLogin();

  useEffect(() => {
    if (getToken()) {
      setLocation("/admin/dashboard");
    }
  }, [setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate(
      { data: { password } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          setLocation("/admin/dashboard");
        },
        onError: () => {
          setError("Contraseña incorrecta. Intenta de nuevo.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-violet-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
            <Rocket className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Simulador PAES</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 font-semibold flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Contrasena
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contrasena"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-primary"
                data-testid="input-password"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm" data-testid="text-error">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={login.isPending}
              data-testid="button-login"
            >
              {login.isPending ? "Iniciando..." : "Iniciar sesion"}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Solo para administradoras del Simulador PAES
        </p>
      </div>
    </div>
  );
}
