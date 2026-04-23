import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  useAdminListCarreras,
  useCreateCarrera,
  useUpdateCarrera,
  useDeleteCarrera,
  getAdminListCarrerasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const AREAS = [
  "Salud", "Ingeniería y Tecnología", "Derecho y Ciencias Sociales",
  "Economía y Administración", "Educación", "Arte y Arquitectura",
  "Ciencias Agropecuarias", "Ciencias Básicas", "Humanidades y Comunicación", "Otras Áreas"
];

const REGIONES = [
  "Región Metropolitana", "Región de Valparaíso", "Región del Biobío",
  "Región de La Araucanía", "Región de Los Lagos", "Región de Los Ríos",
  "Región de Coquimbo", "Región de Antofagasta", "Región de Tarapacá",
  "Región del Maule", "Región del Libertador", "Región del Ñuble",
  "Región de Atacama", "Región de Arica y Parinacota", "Región de Magallanes",
];

type CarreraForm = {
  nombre: string;
  universidad: string;
  ciudad: string;
  region: string;
  area: string;
  vacantes: string;
  puntajeCorte: string;
  ponderacionCL: string;
  ponderacionM1: string;
  ponderacionM2: string;
  ponderacionCS: string;
  ponderacionHI: string;
  ponderacionNEM: string;
  ponderacionRanking: string;
  puntajeMaximo: string;
  puntajeMinimo: string;
  puntajePromedio: string;
  matriculaAnual: string;
  arancelAnual: string;
  cuposBEA: string;
  cuposPACE: string;
  cuposMC: string;
  duracionSemestres: string;
  jornada: string;
  modalidad: string;
  acreditacion: string;
  pruebasObligatorias: string;
  publicado: boolean;
};

const emptyForm: CarreraForm = {
  nombre: "", universidad: "", ciudad: "", region: "Región Metropolitana", area: "Salud",
  vacantes: "", puntajeCorte: "", ponderacionCL: "20", ponderacionM1: "20",
  ponderacionM2: "", ponderacionCS: "", ponderacionHI: "", ponderacionNEM: "30",
  ponderacionRanking: "30",
  puntajeMaximo: "", puntajeMinimo: "", puntajePromedio: "",
  matriculaAnual: "", arancelAnual: "",
  cuposBEA: "", cuposPACE: "", cuposMC: "",
  duracionSemestres: "", jornada: "Diurna", modalidad: "Presencial", acreditacion: "",
  pruebasObligatorias: "CL, M1", publicado: false,
};

function parseNum(s: string) { const n = parseFloat(s); return isNaN(n) ? null : n; }
function parseInt10(s: string) { const n = parseInt(s, 10); return isNaN(n) ? null : n; }

export default function AdminCarreras() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CarreraForm>(emptyForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const LIMIT = 15;

  const { data, isLoading } = useAdminListCarreras({ page, limit: LIMIT, search: search || undefined });
  const create = useCreateCarrera();
  const update = useUpdateCarrera();
  const del = useDeleteCarrera();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getAdminListCarrerasQueryKey() });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: {
    id: number; nombre: string; universidad: string; ciudad: string; region: string; area: string;
    vacantes?: number | null; puntajeCorte?: number | null;
    ponderacionCL?: number | null; ponderacionM1?: number | null; ponderacionM2?: number | null;
    ponderacionCS?: number | null; ponderacionHI?: number | null;
    ponderacionNEM?: number | null; ponderacionRanking?: number | null;
    puntajeMaximo?: number | null; puntajeMinimo?: number | null; puntajePromedio?: number | null;
    matriculaAnual?: number | null; arancelAnual?: number | null;
    cuposBEA?: number | null; cuposPACE?: number | null; cuposMC?: number | null;
    duracionSemestres?: number | null; jornada?: string | null; modalidad?: string | null; acreditacion?: string | null;
    pruebasObligatorias: string; publicado: boolean;
  }) => {
    setEditId(c.id);
    setForm({
      nombre: c.nombre,
      universidad: c.universidad,
      ciudad: c.ciudad,
      region: c.region,
      area: c.area,
      vacantes: c.vacantes?.toString() ?? "",
      puntajeCorte: c.puntajeCorte?.toString() ?? "",
      ponderacionCL: c.ponderacionCL?.toString() ?? "",
      ponderacionM1: c.ponderacionM1?.toString() ?? "",
      ponderacionM2: c.ponderacionM2?.toString() ?? "",
      ponderacionCS: c.ponderacionCS?.toString() ?? "",
      ponderacionHI: c.ponderacionHI?.toString() ?? "",
      ponderacionNEM: c.ponderacionNEM?.toString() ?? "",
      ponderacionRanking: c.ponderacionRanking?.toString() ?? "",
      puntajeMaximo: c.puntajeMaximo?.toString() ?? "",
      puntajeMinimo: c.puntajeMinimo?.toString() ?? "",
      puntajePromedio: c.puntajePromedio?.toString() ?? "",
      matriculaAnual: c.matriculaAnual?.toString() ?? "",
      arancelAnual: c.arancelAnual?.toString() ?? "",
      cuposBEA: c.cuposBEA?.toString() ?? "",
      cuposPACE: c.cuposPACE?.toString() ?? "",
      cuposMC: c.cuposMC?.toString() ?? "",
      duracionSemestres: c.duracionSemestres?.toString() ?? "",
      jornada: c.jornada ?? "",
      modalidad: c.modalidad ?? "",
      acreditacion: c.acreditacion ?? "",
      pruebasObligatorias: c.pruebasObligatorias,
      publicado: c.publicado,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      nombre: form.nombre,
      universidad: form.universidad,
      ciudad: form.ciudad,
      region: form.region,
      area: form.area,
      vacantes: parseInt10(form.vacantes),
      puntajeCorte: parseNum(form.puntajeCorte),
      ponderacionCL: parseNum(form.ponderacionCL),
      ponderacionM1: parseNum(form.ponderacionM1),
      ponderacionM2: parseNum(form.ponderacionM2),
      ponderacionCS: parseNum(form.ponderacionCS),
      ponderacionHI: parseNum(form.ponderacionHI),
      ponderacionNEM: parseNum(form.ponderacionNEM),
      ponderacionRanking: parseNum(form.ponderacionRanking),
      puntajeMaximo: parseNum(form.puntajeMaximo),
      puntajeMinimo: parseNum(form.puntajeMinimo),
      puntajePromedio: parseNum(form.puntajePromedio),
      matriculaAnual: parseInt10(form.matriculaAnual),
      arancelAnual: parseInt10(form.arancelAnual),
      cuposBEA: parseInt10(form.cuposBEA),
      cuposPACE: parseInt10(form.cuposPACE),
      cuposMC: parseInt10(form.cuposMC),
      duracionSemestres: parseInt10(form.duracionSemestres),
      jornada: form.jornada || null,
      modalidad: form.modalidad || null,
      acreditacion: form.acreditacion || null,
      pruebasObligatorias: form.pruebasObligatorias,
      publicado: form.publicado,
    };

    if (editId) {
      update.mutate({ id: editId, data: payload }, {
        onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Carrera actualizada" }); },
        onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
      });
    } else {
      create.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Carrera creada" }); },
        onError: () => toast({ title: "Error al crear", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("¿Eliminar esta carrera?")) return;
    del.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "Carrera eliminada" }); },
      onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
    });
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Carreras</h1>
            <p className="text-muted-foreground text-sm">{data?.total ?? 0} carreras en total</p>
          </div>
          <Button onClick={openCreate} className="gap-2" data-testid="button-create-carrera">
            <Plus className="w-4 h-4" />
            Nueva carrera
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar carreras..."
            className="pl-9"
            data-testid="input-search-carreras"
          />
        </div>

        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Carrera</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground hidden md:table-cell">Universidad</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground hidden lg:table-cell">Corte</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Estado</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</td></tr>
                )}
                {!isLoading && data?.carreras.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors" data-testid={`row-carrera-${c.id}`}>
                    <td className="p-3">
                      <p className="font-medium text-foreground">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">{c.area}</p>
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{c.universidad}</td>
                    <td className="p-3 hidden lg:table-cell font-mono text-foreground">{c.puntajeCorte ?? "N/D"}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.publicado ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {c.publicado ? "Publicada" : "Borrador"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} data-testid={`button-edit-${c.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)} data-testid={`button-delete-${c.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-prev-page">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Pagina {page} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="button-next-page">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar carrera" : "Nueva carrera"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {[
                { key: "nombre", label: "Nombre" },
                { key: "universidad", label: "Universidad" },
                { key: "ciudad", label: "Ciudad" },
                { key: "pruebasObligatorias", label: "Pruebas obligatorias" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    value={form[key as keyof CarreraForm] as string}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    data-testid={`input-${key}`}
                  />
                </div>
              ))}

              <div className="space-y-1">
                <Label>Region</Label>
                <Select value={form.region} onValueChange={(v) => setForm(f => ({ ...f, region: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REGIONES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Area</Label>
                <Select value={form.area} onValueChange={(v) => setForm(f => ({ ...f, area: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Costos y vacantes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Costos y Vacantes</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "matriculaAnual", label: "Matrícula anual ($)" },
                    { key: "arancelAnual", label: "Arancel anual ($)" },
                    { key: "vacantes", label: "Vacantes regulares" },
                    { key: "cuposBEA", label: "Cupos BEA" },
                    { key: "cuposPACE", label: "Cupos PACE" },
                    { key: "cuposMC", label: "Cupos +MC" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type="number"
                        value={form[key as keyof CarreraForm] as string}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="0"
                        data-testid={`input-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Puntajes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Puntajes PAES</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "puntajeCorte", label: "Puntaje de corte" },
                    { key: "puntajePromedio", label: "Puntaje promedio" },
                    { key: "puntajeMinimo", label: "Puntaje mínimo" },
                    { key: "puntajeMaximo", label: "Puntaje máximo" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type="number"
                        value={form[key as keyof CarreraForm] as string}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="0"
                        data-testid={`input-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalles del programa */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Detalles del programa</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "duracionSemestres", label: "Duración (semestres)", type: "number" },
                    { key: "jornada", label: "Jornada (Diurna/Vespertina)", type: "text" },
                    { key: "modalidad", label: "Modalidad (Presencial/Online)", type: "text" },
                    { key: "acreditacion", label: "Acreditación (ej. 7 años)", type: "text" },
                  ].map(({ key, label, type }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type={type}
                        value={form[key as keyof CarreraForm] as string}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder=""
                        data-testid={`input-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ponderaciones */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ponderaciones (%)</h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "ponderacionCL", label: "CL" },
                    { key: "ponderacionM1", label: "M1" },
                    { key: "ponderacionM2", label: "M2" },
                    { key: "ponderacionCS", label: "CS" },
                    { key: "ponderacionHI", label: "HI" },
                    { key: "ponderacionNEM", label: "NEM" },
                    { key: "ponderacionRanking", label: "Ranking" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input
                        type="number"
                        value={form[key as keyof CarreraForm] as string}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="0"
                        data-testid={`input-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publicado"
                  checked={form.publicado}
                  onChange={(e) => setForm(f => ({ ...f, publicado: e.target.checked }))}
                  className="w-4 h-4 rounded"
                  data-testid="checkbox-publicado"
                />
                <Label htmlFor="publicado">Publicada (visible para estudiantes)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={create.isPending || update.isPending} data-testid="button-save-carrera">
                {create.isPending || update.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
