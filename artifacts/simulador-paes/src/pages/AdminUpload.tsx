import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useUploadPdf, getAdminListCarrerasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ extracted: number; saved: number; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const upload = useUploadPdf();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setResult(null);
    } else if (f) {
      toast({ title: "Solo se aceptan archivos PDF", variant: "destructive" });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setConfirmOpen(false);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      upload.mutate(
        { data: { fileBase64: base64, filename: file.name } },
        {
          onSuccess: (data) => {
            setResult(data);
            queryClient.invalidateQueries({ queryKey: getAdminListCarrerasQueryKey() });
            toast({ title: "PDF procesado", description: data.message });
          },
          onError: () => {
            toast({ title: "Error al procesar el PDF", variant: "destructive" });
          },
        }
      );
    };
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Subir PDF PAES</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Sube el PDF oficial con los datos de puntajes de corte y carreras
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 space-y-6">
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
            data-testid="dropzone-pdf"
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-file"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-primary" />
                <p className="font-semibold text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                <p className="text-xs text-primary">Haz clic para cambiar el archivo</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">Selecciona un PDF</p>
                <p className="text-sm text-muted-foreground">Haz clic para elegir el archivo</p>
              </div>
            )}
          </div>

          {file && !confirmOpen && (
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={upload.isPending}
              className="w-full gap-2"
              data-testid="button-upload"
            >
              <Upload className="w-4 h-4" />
              {upload.isPending ? "Procesando PDF..." : "Subir y procesar PDF"}
            </Button>
          )}

          {file && confirmOpen && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3" data-testid="confirm-upload">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-orange-700">Esta acción reemplaza todas las carreras</p>
                  <p className="text-xs text-orange-700/80 mt-1">
                    Se eliminarán las carreras actuales y se cargarán las del nuevo PDF. No se puede deshacer.
                    Asegúrate de que sea el PDF oficial "Oferta Definitiva" de DEMRE.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={upload.isPending}
                  variant="destructive"
                  className="flex-1 gap-2"
                  data-testid="button-confirm-upload"
                >
                  {upload.isPending ? "Procesando..." : "Sí, reemplazar carreras"}
                </Button>
                <Button
                  onClick={() => setConfirmOpen(false)}
                  disabled={upload.isPending}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-cancel-upload"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 border ${result.saved > 0 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`} data-testid="upload-result">
              <div className="flex items-center gap-2 mb-2">
                {result.saved > 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                )}
                <span className={`font-semibold text-sm ${result.saved > 0 ? "text-green-700" : "text-orange-700"}`}>
                  {result.saved > 0 ? "Proceso completado" : "Proceso completado con advertencias"}
                </span>
              </div>
              <p className={`text-sm ${result.saved > 0 ? "text-green-600" : "text-orange-600"}`}>
                {result.message}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{result.extracted}</div>
                  <div className="text-xs text-muted-foreground">Extraidas del PDF</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{result.saved}</div>
                  <div className="text-xs text-muted-foreground">Guardadas en DB</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">Información importante</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Usa solo el PDF oficial "Oferta Definitiva" de DEMRE (≈ 600 páginas)</li>
              <li>El sistema extrae automáticamente las carreras, ponderaciones y vacantes</li>
              <li>Esta acción <strong>reemplaza</strong> todas las carreras actuales por las del PDF</li>
              <li>Las carreras quedan publicadas inmediatamente y visibles para los estudiantes</li>
              <li>Si la extracción falla por cambio de formato, no se modifica la base de datos</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
