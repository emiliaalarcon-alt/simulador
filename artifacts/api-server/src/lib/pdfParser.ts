import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execFileAsync = promisify(execFile);

interface CarreraData {
  nombre: string;
  universidad: string;
  ciudad: string;
  region: string;
  area: string;
  vacantes?: number | null;
  puntajeCorte?: number | null;
  ponderacionCL?: number | null;
  ponderacionM1?: number | null;
  ponderacionM2?: number | null;
  ponderacionCS?: number | null;
  ponderacionHI?: number | null;
  ponderacionNEM?: number | null;
  ponderacionRanking?: number | null;
  pruebasObligatorias: string;
  publicado: boolean;
}

const AREAS_CONOCIMIENTO: Record<string, string> = {
  medicina: "Salud",
  enfermería: "Salud",
  enfermeria: "Salud",
  kinesiología: "Salud",
  kinesiologia: "Salud",
  nutrición: "Salud",
  nutricion: "Salud",
  odontología: "Salud",
  odontologia: "Salud",
  farmacia: "Salud",
  bioquímica: "Salud",
  bioquimica: "Salud",
  fonoaudiología: "Salud",
  fonoaudiologia: "Salud",
  "tecnología médica": "Salud",
  ingeniería: "Ingeniería y Tecnología",
  ingenieria: "Ingeniería y Tecnología",
  informática: "Ingeniería y Tecnología",
  informatica: "Ingeniería y Tecnología",
  computación: "Ingeniería y Tecnología",
  computacion: "Ingeniería y Tecnología",
  civil: "Ingeniería y Tecnología",
  mecánica: "Ingeniería y Tecnología",
  mecanica: "Ingeniería y Tecnología",
  eléctrica: "Ingeniería y Tecnología",
  electrica: "Ingeniería y Tecnología",
  derecho: "Derecho y Ciencias Sociales",
  psicología: "Derecho y Ciencias Sociales",
  psicologia: "Derecho y Ciencias Sociales",
  sociología: "Derecho y Ciencias Sociales",
  sociologia: "Derecho y Ciencias Sociales",
  "trabajo social": "Derecho y Ciencias Sociales",
  economía: "Economía y Administración",
  economia: "Economía y Administración",
  administración: "Economía y Administración",
  administracion: "Economía y Administración",
  comercial: "Economía y Administración",
  contador: "Economía y Administración",
  contabilidad: "Economía y Administración",
  pedagogía: "Educación",
  pedagogia: "Educación",
  educación: "Educación",
  educacion: "Educación",
  profesor: "Educación",
  arte: "Arte y Arquitectura",
  diseño: "Arte y Arquitectura",
  diseno: "Arte y Arquitectura",
  arquitectura: "Arte y Arquitectura",
  música: "Arte y Arquitectura",
  musica: "Arte y Arquitectura",
  teatro: "Arte y Arquitectura",
  agronomía: "Ciencias Agropecuarias",
  agronomia: "Ciencias Agropecuarias",
  veterinaria: "Ciencias Agropecuarias",
  forestal: "Ciencias Agropecuarias",
  biología: "Ciencias Básicas",
  biologia: "Ciencias Básicas",
  química: "Ciencias Básicas",
  quimica: "Ciencias Básicas",
  física: "Ciencias Básicas",
  fisica: "Ciencias Básicas",
  matemática: "Ciencias Básicas",
  matematica: "Ciencias Básicas",
  geología: "Ciencias Básicas",
  geologia: "Ciencias Básicas",
  periodismo: "Humanidades y Comunicación",
  comunicación: "Humanidades y Comunicación",
  comunicacion: "Humanidades y Comunicación",
  historia: "Humanidades y Comunicación",
  filosofía: "Humanidades y Comunicación",
  filosofia: "Humanidades y Comunicación",
  literatura: "Humanidades y Comunicación",
};

function detectArea(nombre: string): string {
  const lower = nombre.toLowerCase();
  for (const [keyword, area] of Object.entries(AREAS_CONOCIMIENTO)) {
    if (lower.includes(keyword)) return area;
  }
  return "Otras Áreas";
}

function parseNumber(val: string): number | null {
  const clean = val.replace(/[.,](\d{3})/g, "$1").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const tmpPdf = join(tmpdir(), `paes_${Date.now()}.pdf`);
  const tmpTxt = join(tmpdir(), `paes_${Date.now()}.txt`);
  
  try {
    await writeFile(tmpPdf, buffer);
    await execFileAsync("pdftotext", ["-layout", tmpPdf, tmpTxt]);
    const text = await readFile(tmpTxt, "utf-8");
    return text;
  } finally {
    await unlink(tmpPdf).catch(() => {});
    await unlink(tmpTxt).catch(() => {});
  }
}

export async function parsePdfCarreras(buffer: Buffer): Promise<CarreraData[]> {
  const text = await extractTextFromPdf(buffer);
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  const carreras: CarreraData[] = [];

  const UNIVERSIDADES_CONOCIDAS = [
    "Universidad de Chile",
    "Pontificia Universidad Católica",
    "Universidad de Santiago",
    "Universidad de Concepción",
    "Universidad Austral",
    "Universidad de Valparaíso",
    "Universidad Técnica Federico Santa María",
    "Universidad Adolfo Ibáñez",
    "Universidad Diego Portales",
    "Universidad Andrés Bello",
    "Universidad Mayor",
    "Universidad de Los Andes",
    "Universidad Central",
    "Universidad de La Frontera",
    "Universidad de Magallanes",
    "Universidad de Atacama",
    "Universidad de La Serena",
    "Universidad del Bío-Bío",
    "Universidad Arturo Prat",
    "Universidad de Tarapacá",
  ];

  const REGIONES_CIUDADES: Record<string, string> = {
    Santiago: "Región Metropolitana",
    "Santiago Centro": "Región Metropolitana",
    Valparaíso: "Región de Valparaíso",
    "Viña del Mar": "Región de Valparaíso",
    Concepción: "Región del Biobío",
    Temuco: "Región de La Araucanía",
    "La Serena": "Región de Coquimbo",
    Antofagasta: "Región de Antofagasta",
    Iquique: "Región de Tarapacá",
    "Puerto Montt": "Región de Los Lagos",
    Valdivia: "Región de Los Ríos",
    Rancagua: "Región del Libertador",
    Talca: "Región del Maule",
    Arica: "Región de Arica y Parinacota",
    "Punta Arenas": "Región de Magallanes",
    Chillán: "Región del Ñuble",
    Copiapó: "Región de Atacama",
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const puntajeMatch = line.match(/\b(\d{3,4}(?:[.,]\d+)?)\b/);
    const isCarreraLine =
      line.length > 5 &&
      line.length < 150 &&
      !line.match(/^[\d\s.,%-]+$/) &&
      !line.toLowerCase().match(/^(página|page|total|región|área|universidad|puntaje de corte|ponderaciones|proceso|admisión|vacantes|tabla|sede)/i) &&
      line.match(/[a-záéíóúñ]{3,}/i);

    if (!isCarreraLine) continue;

    const puntaje = puntajeMatch
      ? parseInt(puntajeMatch[1])
      : null;

    const validPuntaje =
      puntaje && puntaje >= 350 && puntaje <= 950
        ? parseNumber(puntajeMatch![1])
        : null;

    let universidad = "Universidad de Chile";
    let ciudad = "Santiago";
    let region = "Región Metropolitana";

    for (const univ of UNIVERSIDADES_CONOCIDAS) {
      if (
        line.toLowerCase().includes(univ.toLowerCase().substring(0, 10)) ||
        (i > 0 && lines[i - 1]?.toLowerCase().includes(univ.toLowerCase().substring(0, 10)))
      ) {
        universidad = univ;
        break;
      }
    }

    for (const [c, r] of Object.entries(REGIONES_CIUDADES)) {
      if (
        line.includes(c) ||
        (i + 1 < lines.length && lines[i + 1]?.includes(c))
      ) {
        ciudad = c;
        region = r;
        break;
      }
    }

    const carrera: CarreraData = {
      nombre: line.substring(0, 120),
      universidad,
      ciudad,
      region,
      area: detectArea(line),
      puntajeCorte: validPuntaje,
      ponderacionCL: 20,
      ponderacionM1: 20,
      ponderacionM2: null,
      ponderacionCS: null,
      ponderacionHI: null,
      ponderacionNEM: 30,
      ponderacionRanking: 30,
      pruebasObligatorias: "CL, M1",
      publicado: false,
    };

    carreras.push(carrera);
  }

  return carreras.slice(0, 200);
}
