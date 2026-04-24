import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, BookOpen, Building2, MapPinned,
  ChevronRight, ChevronLeft, RotateCcw, Trophy,
  Sparkles, Calculator, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/Combobox";
import { Logo } from "@/components/Logo";
import { useListCarreras, useGetCarreraFilters, useGetCarrera } from "@workspace/api-client-react";

type Mode = "uni-y-carrera" | "por-carrera" | "por-universidad" | "por-ciudad";

const TEST_LABELS: Record<string, { label: string; short: string }> = {
  CL: { label: "Competencia Lectora", short: "CL" },
  M1: { label: "Matemática 1", short: "M1" },
  M2: { label: "Matemática 2", short: "M2" },
  CS: { label: "Ciencias", short: "CS" },
  HI: { label: "Historia", short: "HI" },
  NEM: { label: "Notas Enseñanza Media", short: "NEM" },
  Ranking: { label: "Ranking de Notas", short: "Ranking" },
};

function getResultColor(diff: number | null) {
  if (diff === null) return { color: "gray", label: "Sin corte", title: "Sin información de corte", message: "Esta carrera no tiene puntaje de corte registrado." };
  if (diff > 50) return {
    color: "green",
    label: `+${diff} pts`,
    title: "¡Excelente! Estás muy por sobre el corte",
    message: "Tienes muy buenas chances de quedar. Sigue así, tu esfuerzo está dando frutos."
  };
  if (diff > 0) return {
    color: "yellow",
    label: `+${diff} pts`,
    title: "¡Bien! Estás sobre el corte",
    message: "Estás muy cerca. Con un poco más de preparación puedes asegurar tu cupo."
  };
  if (diff >= -50) return {
    color: "orange",
    label: `${diff} pts`,
    title: "Estás cerca del corte",
    message: "Ánimo. Estás a solo unos puntos, no te rindas y sigue practicando."
  };
  return {
    color: "red",
    label: `${diff} pts`,
    title: "Aún te faltan puntos",
    message: "No te desanimes. Con dedicación puedes mejorar, y existen muchas otras carreras increíbles que se ajustan a tu perfil."
  };
}

const COLOR_STYLES = {
  green: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", solid: "bg-green-500", icon: "text-green-600" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", solid: "bg-yellow-400", icon: "text-yellow-600" },
  orange: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", solid: "bg-orange-500", icon: "text-orange-600" },
  red: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", solid: "bg-red-500", icon: "text-red-600" },
  gray: { bg: "bg-muted", border: "border-border", text: "text-muted-foreground", solid: "bg-muted-foreground", icon: "text-muted-foreground" },
};

export default function Simulator() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode | null>(null);
  const [ciudad, setCiudad] = useState<string>("");
  const [universidad, setUniversidad] = useState<string>("");
  const [carreraId, setCarreraId] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [puntajeFinal, setPuntajeFinal] = useState<number | null>(null);

  // Global (unfiltered) filter options — used for the universidad selector in
  // uni-y-carrera / por-universidad modes and for the ciudades list in por-ciudad.
  const { data: filters } = useGetCarreraFilters();
  // City-scoped filters — used by por-ciudad mode to constrain the universidades
  // to those that actually appear in the selected city.
  const { data: cityFilters } = useGetCarreraFilters(
    { ciudad: ciudad || undefined },
    { query: { enabled: mode === "por-ciudad" && !!ciudad, queryKey: ["sim-city-filters", ciudad] } }
  );
  // Fetch carreras for the current selectors (used for combobox options on step 2)
  const { data: allCarreras } = useListCarreras(
    {
      universidad: universidad || undefined,
      ciudad: mode === "por-ciudad" ? (ciudad || undefined) : undefined,
    },
    { query: { enabled: step === 2, queryKey: ["sim-carreras", universidad, ciudad, mode] } }
  );
  const { data: selectedCarrera } = useGetCarrera(carreraId!, {
    query: { enabled: !!carreraId && step >= 3, queryKey: ["sim-carrera", carreraId] }
  });

  const reset = () => {
    setStep(1);
    setMode(null);
    setCiudad("");
    setUniversidad("");
    setCarreraId(null);
    setScores({});
    setPuntajeFinal(null);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Active tests for the selected carrera (those with non-zero ponderación)
  const activeTests = useMemo(() => {
    if (!selectedCarrera) return [];
    const tests: { key: string; ponderacion: number; required: boolean }[] = [];
    const map: { key: string; field: keyof typeof selectedCarrera; required: boolean }[] = [
      { key: "CL", field: "ponderacionCL", required: true },
      { key: "M1", field: "ponderacionM1", required: true },
      { key: "M2", field: "ponderacionM2", required: false },
      { key: "CS", field: "ponderacionCS", required: false },
      { key: "HI", field: "ponderacionHI", required: false },
      { key: "NEM", field: "ponderacionNEM", required: true },
      { key: "Ranking", field: "ponderacionRanking", required: true },
    ];
    for (const m of map) {
      const v = selectedCarrera[m.field] as number | null | undefined;
      if (v && v > 0) tests.push({ key: m.key, ponderacion: v, required: m.required });
    }
    return tests;
  }, [selectedCarrera]);

  const allScoresFilled = activeTests.every(t => {
    const v = scores[t.key];
    if (!v) return false;
    const n = parseFloat(v);
    return !isNaN(n) && n >= 100 && n <= 1000;
  });

  const puntajeCalculado = useMemo(() => {
    if (!allScoresFilled) return null;
    let total = 0;
    for (const t of activeTests) {
      total += parseFloat(scores[t.key]) * (t.ponderacion / 100);
    }
    return Math.round(total * 10) / 10;
  }, [scores, activeTests, allScoresFilled]);

  // Reset to a clean state when carrera changes
  useEffect(() => {
    if (carreraId) setScores({});
  }, [carreraId]);

  const universidadOptions = useMemo(
    () => filters?.universidades?.map(u => ({ value: u, label: u })) ?? [],
    [filters]
  );

  // Universidades scoped to the selected city for por-ciudad mode.
  const universidadOptionsByCiudad = useMemo(
    () => cityFilters?.universidades?.map(u => ({ value: u, label: u })) ?? [],
    [cityFilters]
  );

  const ciudadOptions = useMemo(
    () => filters?.ciudades?.map(c => ({ value: c, label: c })) ?? [],
    [filters]
  );

  const carreraOptions = useMemo(() => {
    if (!allCarreras) return [];
    return allCarreras.map(c => ({
      value: String(c.id),
      label:
        mode === "por-carrera"
          ? `${c.nombre} — ${c.universidad} (${c.ciudad})`
          : mode === "por-universidad"
          ? `${c.nombre} (${c.ciudad})`
          : mode === "por-ciudad"
          ? (universidad ? `${c.nombre}` : `${c.nombre} — ${c.universidad}`)
          : `${c.nombre} (${c.ciudad})`,
    }));
  }, [allCarreras, mode, universidad]);

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="lg" />
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground" data-testid="button-reset">
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </Button>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-20">
        <AnimatePresence mode="wait">
          {/* ========== STEP 1: Mode selection ========== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-primary items-center justify-center mb-4 shadow-lg shadow-primary/30"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  Simula tu puntaje PAES
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Descubre si alcanzas el puntaje de corte para la carrera de tus sueños
                </p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
                  ¿Cómo quieres simular?
                </h2>
                <div className="grid gap-3">
                  {[
                    {
                      id: "uni-y-carrera" as Mode,
                      icon: GraduationCap,
                      title: "Por Universidad y Carrera",
                      desc: "Simula el puntaje exacto que necesitas para una carrera específica en una universidad",
                      color: "from-sky-500 to-blue-600",
                      recommended: true,
                    },
                    {
                      id: "por-carrera" as Mode,
                      icon: BookOpen,
                      title: "Por Carrera",
                      desc: "Compara una carrera en distintas universidades del país",
                      color: "from-blue-500 to-cyan-600",
                    },
                    {
                      id: "por-universidad" as Mode,
                      icon: Building2,
                      title: "Por Universidad",
                      desc: "Explora todas las carreras disponibles en una universidad",
                      color: "from-emerald-500 to-teal-600",
                    },
                    {
                      id: "por-ciudad" as Mode,
                      icon: MapPinned,
                      title: "Por Ciudad",
                      desc: "Encuentra carreras en una ciudad específica del país",
                      color: "from-amber-500 to-orange-600",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setMode(opt.id);
                        setCiudad("");
                        setUniversidad("");
                        setCarreraId(null);
                        setStep(2);
                      }}
                      className="group relative bg-white rounded-2xl border-2 border-border p-5 text-left hover:border-primary hover:shadow-lg transition-all"
                      data-testid={`mode-${opt.id}`}
                    >
                      {opt.recommended && (
                        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                          Recomendado
                        </span>
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                          <opt.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground mb-1">{opt.title}</h3>
                          <p className="text-sm text-muted-foreground">{opt.desc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 self-center" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-sky-50 rounded-xl border border-sky-100 text-center">
                <p className="text-xs text-sky-700 font-medium">
                  Recuerda que este es un simulador referencial. Los puntajes de corte cambian cada año.
                </p>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 2: Selectors ========== */}
          {step === 2 && mode && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <Button variant="ghost" size="sm" onClick={goBack} className="mb-4 gap-1.5 text-muted-foreground -ml-2" data-testid="button-back-step2">
                <ChevronLeft className="w-4 h-4" />
                Cambiar tipo
              </Button>

              <div className="bg-white rounded-2xl shadow-md border border-border p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {mode === "uni-y-carrera" && "Elige universidad y carrera"}
                  {mode === "por-carrera" && "Elige una carrera"}
                  {mode === "por-universidad" && "Elige una universidad"}
                  {mode === "por-ciudad" && "Elige ciudad y carrera"}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {mode === "uni-y-carrera" && "Encuentra el puntaje exacto que necesitas"}
                  {mode === "por-carrera" && "Compara opciones en distintas universidades"}
                  {mode === "por-universidad" && "Explora todas las carreras disponibles"}
                  {mode === "por-ciudad" && "Filtra por ciudad y, si quieres, por universidad"}
                </p>

                <div className="space-y-5">
                  {/* Ciudad selector (only for por-ciudad) */}
                  {mode === "por-ciudad" && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Ciudad
                      </Label>
                      <Combobox
                        options={ciudadOptions}
                        value={ciudad}
                        onChange={(v) => { setCiudad(v); setUniversidad(""); setCarreraId(null); }}
                        placeholder="Selecciona o escribe una ciudad"
                        testId="combobox-ciudad"
                      />
                    </div>
                  )}

                  {/* Universidad selector (for uni-y-carrera, por-universidad, and por-ciudad) */}
                  {(mode === "uni-y-carrera" || mode === "por-universidad" || mode === "por-ciudad") && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Universidad{mode === "por-ciudad" ? " (opcional)" : ""}
                      </Label>
                      <Combobox
                        options={mode === "por-ciudad" ? universidadOptionsByCiudad : universidadOptions}
                        value={universidad}
                        onChange={(v) => { setUniversidad(v); setCarreraId(null); }}
                        placeholder={
                          mode === "por-ciudad" && !ciudad
                            ? "Primero selecciona la ciudad"
                            : mode === "por-ciudad"
                            ? "Cualquier universidad de la ciudad"
                            : "Selecciona o escribe una universidad"
                        }
                        disabled={mode === "por-ciudad" && !ciudad}
                        emptyMsg="No hay universidades disponibles"
                        testId="combobox-universidad"
                      />
                    </div>
                  )}

                  {/* Carrera selector (always) */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Carrera
                    </Label>
                    <Combobox
                      options={carreraOptions}
                      value={carreraId ? String(carreraId) : ""}
                      onChange={(v) => setCarreraId(parseInt(v))}
                      placeholder={
                        mode === "uni-y-carrera" && !universidad
                          ? "Primero selecciona la universidad"
                          : mode === "por-ciudad" && !ciudad
                          ? "Primero selecciona la ciudad"
                          : "Selecciona o escribe una carrera"
                      }
                      disabled={
                        (mode === "uni-y-carrera" && !universidad) ||
                        (mode === "por-ciudad" && !ciudad)
                      }
                      emptyMsg="No hay carreras disponibles"
                      testId="combobox-carrera"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!carreraId}
                    className="gap-2 px-6"
                    data-testid="button-continuar-puntajes"
                  >
                    Continuar con puntajes
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========== STEP 3: Score input based on ponderaciones ========== */}
          {step === 3 && selectedCarrera && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <Button variant="ghost" size="sm" onClick={goBack} className="mb-4 gap-1.5 text-muted-foreground -ml-2" data-testid="button-back-step3">
                <ChevronLeft className="w-4 h-4" />
                Cambiar carrera
              </Button>

              {/* Carrera header card */}
              <div className="bg-gradient-to-br from-sky-500 to-primary text-white rounded-2xl p-5 mb-5 shadow-lg shadow-primary/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold mb-1" data-testid="text-carrera-nombre">{selectedCarrera.nombre}</h2>
                    <div className="flex items-center gap-1.5 text-sky-100 text-sm">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{selectedCarrera.universidad}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sky-200 text-xs mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedCarrera.ciudad} • {selectedCarrera.area}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-sky-200 uppercase tracking-wider">Corte 2024</div>
                    <div className="text-2xl font-bold tabular-nums">
                      {selectedCarrera.puntajeCorte ?? "N/D"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Score inputs */}
              <div className="bg-white rounded-2xl shadow-md border border-border p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Ingresa tus puntajes</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Estas son las pruebas con sus ponderaciones para esta carrera
                </p>

                <div className="space-y-3">
                  {activeTests.map((test) => {
                    const info = TEST_LABELS[test.key];
                    return (
                      <div key={test.key} className="grid grid-cols-[1fr_auto_120px] gap-3 items-center" data-testid={`row-test-${test.key}`}>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{info.label}</div>
                          <div className="text-xs text-muted-foreground">{info.short}</div>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-sky-50 text-primary font-bold text-sm tabular-nums" data-testid={`text-ponderacion-${test.key}`}>
                          {test.ponderacion}%
                        </div>
                        <Input
                          type="number"
                          min={100}
                          max={1000}
                          value={scores[test.key] ?? ""}
                          onChange={(e) => setScores(s => ({ ...s, [test.key]: e.target.value }))}
                          placeholder="100 - 1000"
                          className="text-right font-bold tabular-nums"
                          data-testid={`input-puntaje-${test.key}`}
                        />
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={() => {
                    if (puntajeCalculado !== null) {
                      setPuntajeFinal(puntajeCalculado);
                      setStep(4);
                    }
                  }}
                  disabled={!allScoresFilled}
                  className="w-full mt-6 gap-2 h-12 text-base"
                  data-testid="button-simular"
                >
                  <Sparkles className="w-4 h-4" />
                  Simular
                </Button>

                {!allScoresFilled && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Completa todos los puntajes para ver tu simulación (rango 100-1000)
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ========== STEP 4: Result ========== */}
          {step === 4 && selectedCarrera && puntajeFinal !== null && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {(() => {
                const diff = selectedCarrera.puntajeCorte != null
                  ? Math.round((puntajeFinal - selectedCarrera.puntajeCorte) * 10) / 10
                  : null;
                const result = getResultColor(diff);
                const styles = COLOR_STYLES[result.color as keyof typeof COLOR_STYLES];

                return (
                  <>
                    {/* Hero result */}
                    <div className={`bg-white rounded-2xl border-2 ${styles.border} p-6 sm:p-8 shadow-lg mb-4`}>
                      <div className="text-center mb-6">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", delay: 0.1 }}
                          className={`inline-flex w-16 h-16 rounded-full ${styles.bg} ${styles.border} border-2 items-center justify-center mb-3`}
                        >
                          <Trophy className={`w-8 h-8 ${styles.icon}`} />
                        </motion.div>
                        <h2 className={`text-xl font-bold ${styles.text} mb-1`} data-testid="text-result-title">
                          {result.title}
                        </h2>
                        <p className="text-sm text-foreground/70 max-w-sm mx-auto" data-testid="text-result-message">
                          {result.message}
                        </p>
                      </div>

                      {/* Score comparison */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-muted rounded-xl p-4 text-center">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Tu puntaje</div>
                          <div className="text-3xl font-black text-foreground tabular-nums" data-testid="text-puntaje-final">
                            {puntajeFinal}
                          </div>
                        </div>
                        <div className="bg-muted rounded-xl p-4 text-center">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Corte 2024</div>
                          <div className="text-3xl font-black text-foreground tabular-nums">
                            {selectedCarrera.puntajeCorte ?? "N/D"}
                          </div>
                        </div>
                      </div>

                      {/* Diff bar */}
                      {diff !== null && (
                        <div className={`${styles.bg} rounded-xl p-4 text-center`}>
                          <div className={`text-2xl font-black ${styles.text} tabular-nums`} data-testid="text-diferencia">
                            {result.label}
                          </div>
                          <div className={`text-xs ${styles.text} font-medium mt-0.5`}>
                            {diff > 0 ? "Sobre el corte" : diff < 0 ? "Bajo el corte" : "En el corte"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep(3)}
                        className="flex-1 gap-2"
                        data-testid="button-edit-scores"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Editar puntajes
                      </Button>
                      <Button
                        onClick={() => { setStep(2); setCarreraId(null); }}
                        variant="outline"
                        className="flex-1 gap-2"
                        data-testid="button-otra-carrera"
                      >
                        Otra carrera
                      </Button>
                      <Button
                        onClick={reset}
                        variant="outline"
                        className="flex-1 gap-2"
                        data-testid="button-reiniciar"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Empezar de nuevo
                      </Button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
