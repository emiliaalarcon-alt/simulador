import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, ChevronRight, ChevronLeft, RotateCcw, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListCarreras, useGetCarreraFilters } from "@workspace/api-client-react";
import CarreraCard from "@/components/CarreraCard";

interface Puntajes {
  CL: number;
  M1: number;
  M2: number | null;
  CS: number | null;
  HI: number | null;
  NEM: number;
  Ranking: number;
}

const INITIAL_PUNTAJES: Puntajes = {
  CL: 600,
  M1: 600,
  M2: null,
  CS: null,
  HI: null,
  NEM: 600,
  Ranking: 600,
};

function calcularPuntaje(puntajes: Puntajes, carrera: {
  ponderacionCL?: number | null;
  ponderacionM1?: number | null;
  ponderacionM2?: number | null;
  ponderacionCS?: number | null;
  ponderacionHI?: number | null;
  ponderacionNEM?: number | null;
  ponderacionRanking?: number | null;
}): number {
  let total = 0;
  if (carrera.ponderacionCL) total += puntajes.CL * (carrera.ponderacionCL / 100);
  if (carrera.ponderacionM1) total += puntajes.M1 * (carrera.ponderacionM1 / 100);
  if (carrera.ponderacionM2 && puntajes.M2) total += puntajes.M2 * (carrera.ponderacionM2 / 100);
  if (carrera.ponderacionCS && puntajes.CS) total += puntajes.CS * (carrera.ponderacionCS / 100);
  if (carrera.ponderacionHI && puntajes.HI) total += puntajes.HI * (carrera.ponderacionHI / 100);
  if (carrera.ponderacionNEM) total += puntajes.NEM * (carrera.ponderacionNEM / 100);
  if (carrera.ponderacionRanking) total += puntajes.Ranking * (carrera.ponderacionRanking / 100);
  return Math.round(total);
}

function PuntajeInput({ label, value, onChange, optional }: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  optional?: boolean;
}) {
  const active = value !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">{label}</Label>
        {optional && (
          <button
            onClick={() => onChange(active ? null : 500)}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            data-testid={`toggle-${label.replace(/\s/g, "-").toLowerCase()}`}
          >
            {active ? "Activada" : "Opcional"}
          </button>
        )}
      </div>
      {active ? (
        <div className="flex items-center gap-3">
          <Slider
            value={[value ?? 500]}
            onValueChange={([v]) => onChange(v)}
            min={150}
            max={1000}
            step={1}
            className="flex-1"
            data-testid={`slider-${label.replace(/\s/g, "-").toLowerCase()}`}
          />
          <span className="w-14 text-right font-bold text-primary tabular-nums" data-testid={`value-${label.replace(/\s/g, "-").toLowerCase()}`}>
            {value}
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No rendir esta prueba</p>
      )}
    </div>
  );
}

export default function Simulator() {
  const [step, setStep] = useState(1);
  const [puntajes, setPuntajes] = useState<Puntajes>(INITIAL_PUNTAJES);
  const [region, setRegion] = useState<string>("all");
  const [universidad, setUniversidad] = useState<string>("all");
  const [area, setArea] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: filters } = useGetCarreraFilters();
  const { data: carreras, isLoading } = useListCarreras(
    {
      region: region !== "all" ? region : undefined,
      universidad: universidad !== "all" ? universidad : undefined,
      area: area !== "all" ? area : undefined,
      search: search || undefined,
    },
    { query: { enabled: step === 3, queryKey: ["listCarreras", region, universidad, area, search] } }
  );

  const reset = () => {
    setStep(1);
    setPuntajes(INITIAL_PUNTAJES);
    setRegion("all");
    setUniversidad("all");
    setArea("all");
    setSearch("");
  };

  const steps = [
    { num: 1, label: "Tus puntajes" },
    { num: 2, label: "Filtros" },
    { num: 3, label: "Resultados" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground leading-none">Simulador PAES</h1>
              <p className="text-xs text-muted-foreground">Proceso 2025</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground" data-testid="button-reset">
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                onClick={() => step > s.num && setStep(s.num)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  step === s.num
                    ? "bg-primary text-primary-foreground shadow-md"
                    : step > s.num
                    ? "bg-green-100 text-green-700 cursor-pointer"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`step-${s.num}`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-white/20 font-bold">
                  {s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 rounded ${step > s.num ? "bg-green-300" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Enter scores */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-white rounded-2xl shadow-md border border-border p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Ingresa tus puntajes</h2>
                  <p className="text-sm text-muted-foreground mt-1">Desliza para ajustar cada puntaje estimado</p>
                </div>

                <div className="space-y-5">
                  <PuntajeInput label="Competencia Lectora (CL)" value={puntajes.CL} onChange={(v) => setPuntajes(p => ({ ...p, CL: v ?? 150 }))} />
                  <PuntajeInput label="Matematica 1 (M1)" value={puntajes.M1} onChange={(v) => setPuntajes(p => ({ ...p, M1: v ?? 150 }))} />
                  <PuntajeInput label="Matematica 2 (M2)" value={puntajes.M2} onChange={(v) => setPuntajes(p => ({ ...p, M2: v }))} optional />
                  <PuntajeInput label="Ciencias (CS)" value={puntajes.CS} onChange={(v) => setPuntajes(p => ({ ...p, CS: v }))} optional />
                  <PuntajeInput label="Historia (HI)" value={puntajes.HI} onChange={(v) => setPuntajes(p => ({ ...p, HI: v }))} optional />

                  <div className="border-t border-border pt-4">
                    <PuntajeInput label="NEM (Notas de Ensenanza Media)" value={puntajes.NEM} onChange={(v) => setPuntajes(p => ({ ...p, NEM: v ?? 150 }))} />
                    <div className="mt-4">
                      <PuntajeInput label="Ranking de Notas" value={puntajes.Ranking} onChange={(v) => setPuntajes(p => ({ ...p, Ranking: v ?? 150 }))} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={() => setStep(2)} className="gap-2 px-6" data-testid="button-next-step1">
                    Continuar
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
                <p className="text-xs text-violet-700 text-center font-medium">
                  Recuerda que este es solo un simulador referencial. Los puntajes de corte cambian cada ano.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Filters */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              <div className="bg-white rounded-2xl shadow-md border border-border p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    Filtra las carreras
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Opcional — puedes dejar todo en "Todas"</p>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Region</Label>
                    <Select value={region} onValueChange={setRegion} data-testid="select-region">
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las regiones" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las regiones</SelectItem>
                        {filters?.regiones.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Universidad</Label>
                    <Select value={universidad} onValueChange={setUniversidad} data-testid="select-universidad">
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las universidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las universidades</SelectItem>
                        {filters?.universidades.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Area del conocimiento</Label>
                    <Select value={area} onValueChange={setArea} data-testid="select-area">
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las areas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las areas</SelectItem>
                        {filters?.areas.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Buscar por carrera</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ej: Medicina, Ingenieria..."
                        className="pl-9"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2" data-testid="button-back-step2">
                    <ChevronLeft className="w-4 h-4" />
                    Volver
                  </Button>
                  <Button onClick={() => setStep(3)} className="gap-2 px-6" data-testid="button-next-step2">
                    Ver resultados
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Tus opciones</h2>
                  <p className="text-sm text-muted-foreground">
                    {carreras ? `${carreras.length} carreras encontradas` : "Buscando..."}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1.5" data-testid="button-back-step3">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Filtros
                </Button>
              </div>

              {isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
                  ))}
                </div>
              )}

              {!isLoading && carreras && carreras.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="font-bold text-foreground mb-1">Sin resultados</h3>
                  <p className="text-muted-foreground text-sm">Prueba ajustando los filtros</p>
                  <Button variant="outline" className="mt-4" onClick={() => setStep(2)}>Cambiar filtros</Button>
                </div>
              )}

              {!isLoading && carreras && carreras.length > 0 && (
                <div className="space-y-3">
                  {carreras.map((carrera, idx) => {
                    const puntajeCalculado = calcularPuntaje(puntajes, carrera);
                    return (
                      <motion.div
                        key={carrera.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <CarreraCard
                          carrera={carrera}
                          puntajeCalculado={puntajeCalculado}
                        />
                      </motion.div>
                    );
                  })}

                  <div className="mt-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
                    <p className="text-xs text-violet-700 text-center font-medium">
                      Recuerda que este es solo un simulador referencial. Los puntajes de corte cambian cada ano.
                    </p>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={reset} className="gap-2" data-testid="button-simulate-again">
                      <RotateCcw className="w-4 h-4" />
                      Simular de nuevo
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
