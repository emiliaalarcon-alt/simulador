import { useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
  getGetPublicSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Settings, Heart, Rocket } from "lucide-react";

type SettingsForm = {
  simuladorActivo: boolean;
  anoProcesoActual: string;
  mensajeBienvenida: string;
  orientadoraEnabled: boolean;
  orientadoraTitulo: string;
  orientadoraMensaje: string;
  orientadoraCtaTexto: string;
  orientadoraCtaUrl: string;
  mensajeMotivacionalEnabled: boolean;
  mensajeMotivacionalTexto: string;
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
      orientadoraEnabled: true,
      orientadoraTitulo: "",
      orientadoraMensaje: "",
      orientadoraCtaTexto: "",
      orientadoraCtaUrl: "",
      mensajeMotivacionalEnabled: true,
      mensajeMotivacionalTexto: "",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        simuladorActivo: settings.simuladorActivo,
        anoProcesoActual: settings.anoProcesoActual,
        mensajeBienvenida: settings.mensajeBienvenida,
        orientadoraEnabled: settings.orientadoraEnabled,
        orientadoraTitulo: settings.orientadoraTitulo,
        orientadoraMensaje: settings.orientadoraMensaje,
        orientadoraCtaTexto: settings.orientadoraCtaTexto,
        orientadoraCtaUrl: settings.orientadoraCtaUrl,
        mensajeMotivacionalEnabled: settings.mensajeMotivacionalEnabled,
        mensajeMotivacionalTexto: settings.mensajeMotivacionalTexto,
      });
    }
  }, [settings, reset]);

  const simuladorActivo = watch("simuladorActivo");
  const orientadoraEnabled = watch("orientadoraEnabled");
  const mensajeMotivacionalEnabled = watch("mensajeMotivacionalEnabled");

  const onSubmit = (formData: SettingsForm) => {
    update.mutate(
      { data: formData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPublicSettingsQueryKey() });
          toast({ title: "Ajustes guardados" });
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error && err.message
              ? err.message
              : "Error al guardar";
          toast({ title: msg, variant: "destructive" });
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

          {/* Orientadora vocacional */}
          <div className="bg-card border border-card-border rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-600" fill="currentColor" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Mensaje de orientación vocacional</h2>
                <p className="text-xs text-muted-foreground">
                  Aparece en la pantalla de inicio y en el resultado del simulador
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Mostrar mensaje</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Activa esto para mostrar el aviso de orientación vocacional
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue("orientadoraEnabled", !orientadoraEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${orientadoraEnabled ? "bg-rose-500" : "bg-muted"}`}
                data-testid="toggle-orientadora-enabled"
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${orientadoraEnabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Título</Label>
              <Input
                {...register("orientadoraTitulo")}
                placeholder="¿Necesitas ayuda eligiendo tu carrera?"
                data-testid="input-orientadora-titulo"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Mensaje</Label>
              <textarea
                {...register("orientadoraMensaje")}
                placeholder="Cuéntales a los estudiantes sobre tu equipo de orientación vocacional..."
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                data-testid="textarea-orientadora-mensaje"
              />
              <p className="text-xs text-muted-foreground">
                Sugerencia: menciona técnicas de estudio y elección de carrera.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Texto del botón / enlace</Label>
              <Input
                {...register("orientadoraCtaTexto")}
                placeholder="Habla con nuestra orientadora"
                data-testid="input-orientadora-cta-texto"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Enlace (URL)</Label>
              <Input
                {...register("orientadoraCtaUrl")}
                placeholder="https://wa.me/56912345678 o https://calendly.com/..."
                data-testid="input-orientadora-cta-url"
              />
              <p className="text-xs text-muted-foreground">
                WhatsApp, calendario o web. Déjalo vacío si solo quieres mostrar el texto.
              </p>
            </div>
          </div>

          {/* Mensaje motivacional (resultado) */}
          <div className="bg-card border border-card-border rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Mensaje motivacional del resultado</h2>
                <p className="text-xs text-muted-foreground">
                  Aparece solo en la pantalla de resultado, después de simular
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Mostrar mensaje</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Activa esto para mostrar el mensaje motivacional al final de la simulación
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue("mensajeMotivacionalEnabled", !mensajeMotivacionalEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${mensajeMotivacionalEnabled ? "bg-sky-500" : "bg-muted"}`}
                data-testid="toggle-motivacional-enabled"
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${mensajeMotivacionalEnabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Texto del mensaje</Label>
              <textarea
                {...register("mensajeMotivacionalTexto")}
                placeholder="Escribe un mensaje de motivación que verán los estudiantes después de simular..."
                rows={6}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                data-testid="textarea-motivacional-texto"
              />
              <p className="text-xs text-muted-foreground">
                Puedes usar saltos de línea y emojis. Ejemplo: "Cada paso cuenta 💪 Continúa en Mat21.cl 📘🚀".
              </p>
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
