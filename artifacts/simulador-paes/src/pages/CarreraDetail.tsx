import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Building2, Calendar, Award,
  DollarSign, BookOpen, Target, Sparkles, Sun,
  Rocket, GraduationCap, BarChart3, Users, Clock,
  TrendingUp, TrendingDown, Activity, Info,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useGetCarrera } from "@workspace/api-client-react";

const TEST_LABELS: Record<string, { label: string; short: string; icon: typeof BookOpen }> = {
  CL: { label: "Comp. Lectora", short: "CL", icon: BookOpen },
  M1: { label: "Matemática 1", short: "M1", icon: Target },
  M2: { label: "Matemática 2", short: "M2", icon: Target },
  CS: { label: "Ciencias", short: "CS", icon: Activity },
  HI: { label: "Historia / Cs.", short: "HI", icon: Award },
  NEM: { label: "NEM", short: "NEM", icon: GraduationCap },
  Ranking: { label: "Ranking", short: "Ranking", icon: BarChart3 },
};

function pesoBadge(pct: number) {
  if (pct >= 25) return { label: "Peso Alto", className: "bg-blue-50 text-blue-700 border-blue-200" };
  if (pct >= 18) return { label: "Peso Medio", className: "bg-sky-50 text-sky-700 border-sky-200" };
  if (pct >= 10) return { label: "Peso Leve", className: "bg-cyan-50 text-cyan-700 border-cyan-200" };
  return { label: "Bajo", className: "bg-muted text-muted-foreground border-border" };
}

const CLP = (n: number | null | undefined) => {
  if (n == null) return "Sin información";
  return `$${n.toLocaleString("es-CL")}`;
};

type TabId = "info" | "estadisticas" | "ponderaciones";

export default function CarreraDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id);
  const [tab, setTab] = useState<TabId>("info");

  const { data: carrera, isLoading } = useGetCarrera(id, {
    query: { enabled: !isNaN(id), queryKey: ["carrera-detail", id] },
  });

  const ponderaciones = useMemo(() => {
    if (!carrera) return [];
    const fields: { key: string; field: keyof typeof carrera }[] = [
      { key: "CL", field: "ponderacionCL" },
      { key: "M1", field: "ponderacionM1" },
      { key: "M2", field: "ponderacionM2" },
      { key: "CS", field: "ponderacionCS" },
      { key: "HI", field: "ponderacionHI" },
      { key: "NEM", field: "ponderacionNEM" },
      { key: "Ranking", field: "ponderacionRanking" },
    ];
    return fields
      .map(f => ({ key: f.key, value: (carrera[f.field] as number | null | undefined) ?? 0 }))
      .filter(p => p.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [carrera]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="text-muted-foreground">Cargando información...</div>
      </div>
    );
  }

  if (!carrera) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se encontró esta carrera</p>
          <Link href="/">
            <Button>Volver al simulador</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: typeof Info; subtitle: string }[] = [
    { id: "info", label: "Información General", icon: DollarSign, subtitle: "Costos y Vacantes" },
    { id: "estadisticas", label: "Estadísticas PAES", icon: BarChart3, subtitle: "Métricas y Puntajes" },
    { id: "ponderaciones", label: "Ponderaciones", icon: Target, subtitle: "Pesos por prueba" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="md" />
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" data-testid="link-volver-simulador">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al simulador
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">
            {carrera.universidad}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-2 max-w-3xl mx-auto leading-tight" data-testid="text-detalle-nombre">
            {carrera.nombre}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span>{carrera.ciudad}</span>
            <span>•</span>
            <span>{carrera.area}</span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-2 mb-6 grid grid-cols-3 gap-1">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-3 py-2.5 rounded-xl text-left transition-colors ${
                  active ? "bg-sky-50" : "hover:bg-muted/60"
                }`}
                data-testid={`tab-${t.id}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className={`font-bold text-sm truncate ${active ? "text-primary" : "text-foreground"}`}>{t.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{t.subtitle}</div>
                  </div>
                </div>
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-0.5 left-2 right-2 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        {tab === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Cost & vacancies grid — costs are hidden when no data is available */}
            <div className={`grid grid-cols-1 ${(carrera.matriculaAnual != null || carrera.arancelAnual != null) ? "md:grid-cols-3" : ""} gap-4`}>
              {carrera.matriculaAnual != null && (
                <InfoCard
                  icon={DollarSign}
                  gradient="from-emerald-500 to-teal-600"
                  title="Matrícula Anual"
                  value={CLP(carrera.matriculaAnual)}
                  description="Costo de matrícula anual para el año académico actual."
                  testId="card-matricula"
                />
              )}
              {carrera.arancelAnual != null && (
                <InfoCard
                  icon={BookOpen}
                  gradient="from-violet-500 to-purple-600"
                  title="Arancel Anual"
                  value={CLP(carrera.arancelAnual)}
                  description="Costo total del programa académico durante un año completo."
                  testId="card-arancel"
                />
              )}
              <InfoCard
                icon={Target}
                gradient="from-blue-500 to-sky-600"
                title="Vacantes Regulares"
                value={carrera.vacantes != null ? `${carrera.vacantes} cupos` : "Sin información"}
                description="Número de cupos disponibles para admisión regular."
                testId="card-vacantes"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard
                icon={Sun}
                gradient="from-amber-400 to-orange-500"
                title="Cupos BEA"
                value={carrera.cuposBEA != null ? `${carrera.cuposBEA} cupos` : "Sin información"}
                description="Beca de Excelencia Académica para estudiantes destacados."
                testId="card-bea"
              />
              <InfoCard
                icon={Rocket}
                gradient="from-rose-500 to-pink-600"
                title="Cupos PACE"
                value={carrera.cuposPACE != null ? `${carrera.cuposPACE} cupos` : "Sin información"}
                description="Programa de Acompañamiento y Acceso Efectivo a la Educación Superior."
                testId="card-pace"
              />
              <InfoCard
                icon={GraduationCap}
                gradient="from-fuchsia-500 to-purple-600"
                title="Cupos +MC"
                value={carrera.cuposMC != null ? `${carrera.cuposMC} cupos` : "Sin información"}
                description="Cupos especiales para mujeres en carreras científicas y tecnológicas."
                testId="card-mc"
              />
            </div>

            {/* Program details */}
            {(carrera.duracionSemestres || carrera.jornada || carrera.modalidad || carrera.acreditacion) && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Detalles del programa
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ProgramDetail icon={Clock} label="Duración" value={carrera.duracionSemestres ? `${carrera.duracionSemestres} semestres` : null} />
                  <ProgramDetail icon={Sun} label="Jornada" value={carrera.jornada} />
                  <ProgramDetail icon={Building2} label="Modalidad" value={carrera.modalidad} />
                  <ProgramDetail icon={Award} label="Acreditación" value={carrera.acreditacion} />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "estadisticas" && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Score statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Target}
                color="blue"
                label="Puntaje de Corte"
                value={carrera.puntajeCorte}
                hint="Último admitido"
              />
              <StatCard
                icon={TrendingDown}
                color="orange"
                label="Puntaje Mínimo"
                value={carrera.puntajeMinimo}
                hint="Menor matriculado"
              />
              <StatCard
                icon={Activity}
                color="sky"
                label="Puntaje Promedio"
                value={carrera.puntajePromedio}
                hint="Promedio admitidos"
              />
              <StatCard
                icon={TrendingUp}
                color="green"
                label="Puntaje Máximo"
                value={carrera.puntajeMaximo}
                hint="Mayor admitido"
              />
            </div>

            {/* Vacantes */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Cupos disponibles
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SmallStat label="Regulares" value={carrera.vacantes} />
                <SmallStat label="BEA" value={carrera.cuposBEA} />
                <SmallStat label="PACE" value={carrera.cuposPACE} />
                <SmallStat label="+MC" value={carrera.cuposMC} />
              </div>
            </div>

            {/* Visual range bar */}
            {carrera.puntajeMinimo != null && carrera.puntajeMaximo != null && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Rango de puntajes admitidos
                </h3>
                <div className="relative pt-7 pb-3">
                  <div className="h-2 rounded-full bg-gradient-to-r from-sky-200 via-sky-400 to-primary relative overflow-hidden">
                    {carrera.puntajePromedio != null && (() => {
                      const total = carrera.puntajeMaximo - carrera.puntajeMinimo;
                      const pct = total > 0 ? Math.max(0, Math.min(100, ((carrera.puntajePromedio - carrera.puntajeMinimo) / total) * 100)) : 50;
                      return (
                        <div
                          className="absolute -top-7 -translate-x-1/2 text-xs font-bold text-primary whitespace-nowrap"
                          style={{ left: `${pct}%` }}
                        >
                          ▼ Prom. {Math.round(carrera.puntajePromedio)}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground mt-1.5 tabular-nums">
                    <span>Mín. {Math.round(carrera.puntajeMinimo)}</span>
                    <span>Máx. {Math.round(carrera.puntajeMaximo)}</span>
                  </div>
                </div>
              </div>
            )}

            {(carrera.puntajeCorte == null && carrera.puntajePromedio == null) && (
              <EmptyState message="No hay estadísticas PAES registradas para esta carrera todavía." />
            )}
          </motion.div>
        )}

        {tab === "ponderaciones" && (
          <motion.div
            key="pond"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-2xl border border-border p-6">
              <div className="text-center mb-6">
                <h3 className="font-bold text-2xl text-foreground mb-1">Ponderaciones de las Pruebas</h3>
                <p className="text-sm text-muted-foreground">
                  Porcentaje de cada prueba PAES para el cálculo del puntaje ponderado
                </p>
              </div>

              {ponderaciones.length === 0 ? (
                <EmptyState message="Esta carrera aún no tiene ponderaciones registradas." />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {ponderaciones.map((p, idx) => {
                    const info = TEST_LABELS[p.key];
                    const peso = pesoBadge(p.value);
                    return (
                      <motion.div
                        key={p.key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-2xl p-4 text-center"
                        data-testid={`pond-card-${p.key}`}
                      >
                        <div className="inline-flex w-11 h-11 rounded-full bg-primary text-white items-center justify-center mb-2 shadow-md shadow-primary/20">
                          <info.icon className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-semibold text-foreground mb-1 truncate">{info.label}</div>
                        <div className="text-3xl font-black text-primary tabular-nums leading-none mb-2">{p.value}%</div>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${peso.className}`}>
                          {peso.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {ponderaciones.length > 0 && (
                <div className="mt-6 p-4 bg-sky-50 rounded-xl border border-sky-100 text-center text-sm text-sky-700">
                  <Sparkles className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  La suma de ponderaciones para esta carrera es de{" "}
                  <strong>{ponderaciones.reduce((s, p) => s + p.value, 0)}%</strong>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-br from-primary to-sky-600 text-white rounded-2xl p-6 text-center shadow-lg shadow-primary/20">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-90" />
          <h3 className="text-xl font-bold mb-1">¿Quieres saber si alcanzas esta carrera?</h3>
          <p className="text-sky-100 text-sm mb-4">Simula tu puntaje ponderado en menos de un minuto</p>
          <Link href="/">
            <Button size="lg" variant="secondary" className="gap-2 bg-white text-primary hover:bg-sky-50">
              <Calendar className="w-4 h-4" />
              Ir al simulador
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function InfoCard({ icon: Icon, gradient, title, value, description, testId }: {
  icon: typeof Info; gradient: string; title: string; value: string; description: string; testId?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition-shadow" data-testid={testId}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-foreground text-sm leading-tight">{title}</h3>
          <p className="text-xl font-black text-primary tabular-nums mt-1">{value}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value, hint }: {
  icon: typeof Info; color: string; label: string; value: number | null | undefined; hint: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-500" },
    sky: { bg: "bg-sky-50", text: "text-sky-700", iconBg: "bg-sky-500" },
    green: { bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-500" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", iconBg: "bg-orange-500" },
  };
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div className={`${c.bg} rounded-2xl border border-border/40 p-5`}>
      <div className={`inline-flex w-9 h-9 rounded-lg ${c.iconBg} text-white items-center justify-center mb-3 shadow-sm`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</div>
      <div className={`text-3xl font-black tabular-nums ${c.text}`}>
        {value != null ? Math.round(value) : "N/D"}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="bg-muted/60 rounded-xl p-3 text-center">
      <div className="text-2xl font-black text-foreground tabular-nums">{value ?? "—"}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
    </div>
  );
}

function ProgramDetail({ icon: Icon, label, value }: { icon: typeof Info; label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="font-semibold text-foreground text-sm">{value ?? "Sin información"}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
