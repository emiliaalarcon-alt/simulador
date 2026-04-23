import { useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Settings } from "lucide-react";

type SettingsForm = {
  simuladorActivo: boolean;
  anoProcesoActual: string;
  mensajeBienvenida: string;
};

export default function AdminSettings() {
  const { data: settings } = useGetSettings();
  const update = useUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { register, handleSubmit, reset, watch, setValue } = useForm<SettingsForm>({
    defaultValues: {
      simuladorActivo: true,
      anoProcesoActual: "2025",
      mensajeBienvenida: "",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        simuladorActivo: settings.simuladorActivo,
        anoProcesoActual: settings.anoProcesoActual,
        mensajeBienvenida: settings.mensajeBienvenida,
      });
    }
  }, [settings, reset]);

  const simuladorActivo = watch("simuladorActivo");

  const onSubmit = (formData: SettingsForm) => {
    update.mutate(
      { data: formData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({ title: "Ajustes guardados" });
        },
        onError: () => {
          toast({ title: "Error al guardar", variant: "destructive" });
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ajustes</h1>
            <p className="text-muted-foreground text-sm">Configuracion del simulador</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-card-border rounded-2xl p-5 space-y-5">
            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Simulador activo</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cuando esta desactivado, los estudiantes ven un mensaje de mantenimiento
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue("simuladorActivo", !simuladorActivo)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${simuladorActivo ? "bg-primary" : "bg-muted"}`}
                data-testid="toggle-simulador-activo"
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${simuladorActivo ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Ano del proceso</Label>
              <Input
                {...register("anoProcesoActual")}
                placeholder="2025"
                data-testid="input-ano-proceso"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Mensaje de bienvenida</Label>
              <textarea
                {...register("mensajeBienvenida")}
                placeholder="Mensaje que ven los estudiantes al entrar..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                data-testid="textarea-bienvenida"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={update.isPending} data-testid="button-save-settings">
            {update.isPending ? "Guardando..." : "Guardar ajustes"}
          </Button>
        </form>

        {settings && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Ultimo guardado: {new Date(settings.updatedAt).toLocaleString("es-CL")}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
