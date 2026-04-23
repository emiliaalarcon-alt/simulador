import { MapPin, Building2, GraduationCap } from "lucide-react";

interface Carrera {
  id: number;
  nombre: string;
  universidad: string;
  ciudad: string;
  region: string;
  area: string;
  vacantes?: number | null;
  puntajeCorte?: number | null;
  pruebasObligatorias: string;
}

interface Props {
  carrera: Carrera;
  puntajeCalculado: number;
}

function getResultado(diferencia: number | null) {
  if (diferencia === null) return { color: "gray", label: "Sin corte disponible", message: "No hay puntaje de corte registrado para esta carrera." };
  if (diferencia > 50) return {
    color: "green",
    label: `+${diferencia} pts`,
    message: "Tienes muy buenas chances. Sigue asi, tu esfuerzo esta dando frutos.",
  };
  if (diferencia > 0) return {
    color: "yellow",
    label: `+${diferencia} pts`,
    message: "Estas muy cerca. Con un poco mas de preparacion puedes lograrlo.",
  };
  if (diferencia >= -50) return {
    color: "orange",
    label: `${diferencia} pts`,
    message: "Animo. Estas a solo unos puntos, no te rindas.",
  };
  return {
    color: "red",
    label: `${diferencia} pts`,
    message: "No te desanimes, hay muchas otras carreras increibles que se ajustan a tu puntaje.",
  };
}

const colorClasses = {
  green: {
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
    bar: "bg-green-500",
    msg: "bg-green-50 text-green-700 border-green-100",
  },
  yellow: {
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    bar: "bg-yellow-400",
    msg: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  orange: {
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    bar: "bg-orange-400",
    msg: "bg-orange-50 text-orange-700 border-orange-100",
  },
  red: {
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    bar: "bg-red-500",
    msg: "bg-red-50 text-red-700 border-red-100",
  },
  gray: {
    border: "border-border",
    badge: "bg-muted text-muted-foreground",
    bar: "bg-muted",
    msg: "bg-muted text-muted-foreground border-border",
  },
};

export default function CarreraCard({ carrera, puntajeCalculado }: Props) {
  const diferencia = carrera.puntajeCorte != null ? puntajeCalculado - carrera.puntajeCorte : null;
  const resultado = getResultado(diferencia);
  const classes = colorClasses[resultado.color as keyof typeof colorClasses];

  return (
    <div
      className={`bg-white rounded-2xl border-2 ${classes.border} p-4 shadow-sm hover:shadow-md transition-shadow`}
      data-testid={`card-carrera-${carrera.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate text-base" data-testid={`text-nombre-${carrera.id}`}>
            {carrera.nombre}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-muted-foreground text-xs">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{carrera.universidad}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{carrera.ciudad}</span>
            <span className="text-border mx-1">|</span>
            <GraduationCap className="w-3 h-3 flex-shrink-0" />
            <span>{carrera.area}</span>
          </div>
        </div>
        <div className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold ${classes.badge}`} data-testid={`badge-diferencia-${carrera.id}`}>
          {resultado.label}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted rounded-lg p-2">
          <div className="text-xs text-muted-foreground">Tu puntaje</div>
          <div className="font-bold text-foreground tabular-nums" data-testid={`text-puntaje-calculado-${carrera.id}`}>{puntajeCalculado}</div>
        </div>
        <div className="bg-muted rounded-lg p-2">
          <div className="text-xs text-muted-foreground">Corte 2024</div>
          <div className="font-bold text-foreground tabular-nums" data-testid={`text-puntaje-corte-${carrera.id}`}>
            {carrera.puntajeCorte ?? "N/D"}
          </div>
        </div>
        <div className="bg-muted rounded-lg p-2">
          <div className="text-xs text-muted-foreground">Vacantes</div>
          <div className="font-bold text-foreground tabular-nums">{carrera.vacantes ?? "N/D"}</div>
        </div>
      </div>

      <div className={`mt-3 p-2.5 rounded-xl text-xs border ${classes.msg}`} data-testid={`msg-motivacional-${carrera.id}`}>
        {resultado.message}
      </div>
    </div>
  );
}
