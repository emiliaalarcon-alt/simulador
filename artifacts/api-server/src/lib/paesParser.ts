import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import { db, carrerasTable } from "@workspace/db";

const execFileAsync = promisify(execFile);

interface RawCarrera {
  codigo: string;
  nombre: string;
  sede: string;
  ponderacionNEM: number | null;
  ponderacionRanking: number | null;
  ponderacionCL: number | null;
  ponderacionM1: number | null;
  ponderacionHI: number | null;
  ponderacionCS: number | null;
  ponderacionM2: number | null;
  puntajePonderadoMinimo: number | null;
  vacantesRegular: number | null;
  vacantesBEA: number | null;
  vacantesPACE: number | null;
  vacantesMC: number | null;
}

interface ParsedUniversity {
  nombre: string;
  carreras: RawCarrera[];
}

const CITY_TO_REGION: Record<string, string> = {
  ARICA: "Arica y Parinacota",
  IQUIQUE: "Tarapacá",
  "ALTO HOSPICIO": "Tarapacá",
  ANTOFAGASTA: "Antofagasta",
  CALAMA: "Antofagasta",
  COPIAPÓ: "Atacama",
  VALLENAR: "Atacama",
  "LA SERENA": "Coquimbo",
  COQUIMBO: "Coquimbo",
  OVALLE: "Coquimbo",
  VALPARAÍSO: "Valparaíso",
  "VIÑA DEL MAR": "Valparaíso",
  QUILLOTA: "Valparaíso",
  "SAN FELIPE": "Valparaíso",
  "LOS ANDES": "Valparaíso",
  QUILPUÉ: "Valparaíso",
  "SAN ANTONIO": "Valparaíso",
  SANTIAGO: "Metropolitana",
  MAIPÚ: "Metropolitana",
  "PUENTE ALTO": "Metropolitana",
  RANCAGUA: "O'Higgins",
  "SAN FERNANDO": "O'Higgins",
  TALCA: "Maule",
  CURICÓ: "Maule",
  LINARES: "Maule",
  CAUQUENES: "Maule",
  CHILLÁN: "Ñuble",
  CONCEPCIÓN: "Biobío",
  "LOS ÁNGELES": "Biobío",
  TALCAHUANO: "Biobío",
  TEMUCO: "Araucanía",
  VILLARRICA: "Araucanía",
  ANGOL: "Araucanía",
  VALDIVIA: "Los Ríos",
  OSORNO: "Los Lagos",
  "PUERTO MONTT": "Los Lagos",
  CASTRO: "Los Lagos",
  ANCUD: "Los Lagos",
  COYHAIQUE: "Aysén",
  "PUERTO AYSÉN": "Aysén",
  "PUNTA ARENAS": "Magallanes",
  "PUERTO NATALES": "Magallanes",
  TEJA: "Los Ríos",
  CHIGUAYANTE: "Biobío",
};

const SANTIAGO_COMUNAS = [
  "PROVIDENCIA", "LAS CONDES", "ÑUÑOA", "SAN MIGUEL", "LA FLORIDA",
  "VITACURA", "MACUL", "LA REINA", "PEÑALOLÉN", "RECOLETA", "INDEPENDENCIA",
  "ESTACIÓN CENTRAL", "QUILICURA", "HUECHURABA", "SAN JOAQUÍN",
];

const KNOWN_UNI_NAMES: Record<string, [string, string]> = {
  "PONTIFICIA UNIVERSIDAD CATÓLICA DE CHILE": ["Santiago", "Metropolitana"],
  "PONTIFICIA UNIVERSIDAD CATÓLICA DE VALPARAÍSO": ["Valparaíso", "Valparaíso"],
  "UNIVERSIDAD ACADEMIA DE HUMANISMO CRISTIANO": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD ADOLFO IBÁÑEZ": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD ADVENTISTA DE CHILE": ["Chillán", "Ñuble"],
  "UNIVERSIDAD ALBERTO HURTADO": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD ANDRÉS BELLO": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD ARTURO PRAT": ["Iquique", "Tarapacá"],
  "UNIVERSIDAD AUSTRAL DE CHILE": ["Valdivia", "Los Ríos"],
  "UNIVERSIDAD AUTÓNOMA DE CHILE": ["Talca", "Maule"],
  "UNIVERSIDAD BERNARDO O'HIGGINS": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD CATÓLICA DE LA SANTÍSIMA CONCEPCIÓN": ["Concepción", "Biobío"],
  "UNIVERSIDAD CATÓLICA DE TEMUCO": ["Temuco", "Araucanía"],
  "UNIVERSIDAD CATÓLICA DEL MAULE": ["Talca", "Maule"],
  "UNIVERSIDAD CATÓLICA DEL NORTE": ["Antofagasta", "Antofagasta"],
  "UNIVERSIDAD CATÓLICA SILVA HENRÍQUEZ": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD CENTRAL DE CHILE": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD DE ANTOFAGASTA": ["Antofagasta", "Antofagasta"],
  "UNIVERSIDAD DE ATACAMA": ["Copiapó", "Atacama"],
  "UNIVERSIDAD DE AYSÉN": ["Coyhaique", "Aysén"],
  "UNIVERSIDAD DE CHILE": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD DE CONCEPCIÓN": ["Concepción", "Biobío"],
  "UNIVERSIDAD DE LA FRONTERA": ["Temuco", "Araucanía"],
  "UNIVERSIDAD DE LA SERENA": ["La Serena", "Coquimbo"],
  "UNIVERSIDAD DE LAS AMÉRICAS": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD DE LOS ANDES": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD DE LOS LAGOS": ["Osorno", "Los Lagos"],
  "UNIVERSIDAD DE MAGALLANES": ["Punta Arenas", "Magallanes"],
  "UNIVERSIDAD DE O'HIGGINS": ["Rancagua", "O'Higgins"],
  "UNIVERSIDAD DE PLAYA ANCHA": ["Valparaíso", "Valparaíso"],
  "UNIVERSIDAD DE SANTIAGO DE CHILE": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD DE TALCA": ["Talca", "Maule"],
  "UNIVERSIDAD DE TARAPACÁ": ["Arica", "Arica y Parinacota"],
  "UNIVERSIDAD DE VALPARAÍSO": ["Valparaíso", "Valparaíso"],
  "UNIVERSIDAD DEL ALBA": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD DEL BÍO-BÍO": ["Concepción", "Biobío"],
  "UNIVERSIDAD DEL DESARROLLO": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD DIEGO PORTALES": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD FINIS TERRAE": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD GABRIELA MISTRAL": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD MAYOR": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD METROPOLITANA DE CIENCIAS DE LA EDUCACIÓN": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD METROPOLITANA DE CS. DE LA EDUCACIÓN": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD SAN SEBASTIÁN": ["Concepción", "Biobío"],
  "UNIVERSIDAD SANTO TOMÁS": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD TÉCNICA FEDERICO SANTA MARÍA": ["Valparaíso", "Valparaíso"],
  "UNIVERSIDAD TECNOLÓGICA METROPOLITANA": ["Santiago", "Metropolitana"],
  "UNIVERSIDAD VIÑA DEL MAR": ["Viña del Mar", "Valparaíso"],
};

function titleCaseUni(upper: string): string {
  const lowers = new Set(["DE", "DEL", "LA", "LAS", "LOS", "Y"]);
  return upper
    .split(" ")
    .map((w, i) => {
      if (i > 0 && lowers.has(w)) return w.toLowerCase();
      if (w === "O'HIGGINS") return "O'Higgins";
      if (w === "BÍO-BÍO") return "Bío-Bío";
      if (w === "ANDRÉS") return "Andrés";
      if (w === "IBÁÑEZ") return "Ibáñez";
      if (w === "CS.") return "Cs.";
      return w.charAt(0) + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function titleCity(upper: string): string {
  return upper
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function inferRegionAndCiudad(text: string, uniName: string): { ciudad: string; region: string } {
  if (text) {
    const upper = text.toUpperCase();
    for (const [city, region] of Object.entries(CITY_TO_REGION)) {
      if (upper.includes(city)) return { ciudad: titleCity(city), region };
    }
    for (const comuna of SANTIAGO_COMUNAS) {
      if (upper.includes(comuna)) return { ciudad: "Santiago", region: "Metropolitana" };
    }
  }
  const def = KNOWN_UNI_NAMES[uniName.toUpperCase()];
  if (def) return { ciudad: def[0], region: def[1] };
  return { ciudad: "Santiago", region: "Metropolitana" };
}

function stripTrailingCity(name: string, ciudad: string): string {
  if (!ciudad) return name;
  const cityUpper = ciudad.toUpperCase();
  const re = new RegExp(`(?:\\s+(?:${cityUpper}|CAMPUS\\s+\\S+|SEDE\\s+\\S+|CASA\\s+CENTRAL))+\\s*$`, "i");
  let cleaned = name.replace(re, "").trim();
  cleaned = cleaned.replace(/\b(\S+)\s+\1\b/gi, "$1").trim();
  return cleaned || name;
}

function inferArea(nombre: string): string {
  const n = nombre.toUpperCase();
  if (/MEDIC|ENFERMER|KINESI|NUTRICI|ODONTOL|FONOAUD|OBSTETRI|TECNOLOG[ÍI]A M[ÉE]DICA|TERAPIA OCUPAC|QU[ÍI]MICA Y FARM|PSICOLOG/.test(n)) return "Salud";
  if (/INGENIER[ÍI]A|CONSTRUCCI[ÓO]N|GEOLOG[ÍI]A|ASTRONOM|F[ÍI]SICA|MATEM[ÁA]TIC|INFORM[ÁA]TIC|COMPUTACI[ÓO]N|SOFTWARE|CIVIL|MEC[ÁA]NIC|EL[ÉE]CTRIC|INDUSTRI/.test(n)) return "Ingeniería y Ciencias";
  if (/PEDAGOG[ÍI]A|EDUCACI[ÓO]N|EDUCACION/.test(n)) return "Educación";
  if (/DERECHO/.test(n)) return "Derecho";
  if (/ADMINISTRACI[ÓO]N|CONTADOR|AUDITOR[ÍI]A|COMERCIAL|NEGOCIOS|ECONOM[ÍI]A|MARKETING|FINANZAS/.test(n)) return "Administración y Negocios";
  if (/ARQUITECTUR|DISE[ÑN]O|URBANISMO/.test(n)) return "Arte y Arquitectura";
  if (/ARTE|M[ÚU]SICA|TEATRO|ACTUACI[ÓO]N|DANZA|CINE/.test(n)) return "Arte y Arquitectura";
  if (/AGRONOM[ÍI]A|VETERINARI|FORESTAL|PECUARIA|ACUICULTUR|ZOOTECNIA/.test(n)) return "Agropecuaria";
  if (/SOCIOLOG[ÍI]A|TRABAJO SOCIAL|ANTROPOLOG|HISTORIA|GEOGRAF|CIENCIA POL[ÍI]TICA|RELACIONES P[ÚU]BLICAS|PERIODISMO|COMUNICACI[ÓO]N|PUBLICIDAD|LITERATUR|FILOSOF|TEOLOG/.test(n)) return "Ciencias Sociales y Humanidades";
  if (/BIOLOG|BIOQU[ÍI]MIC|BIOTECNOL|QU[ÍI]MIC|CIENCIAS DE LA TIERRA|CIENCIAS NATURALES/.test(n)) return "Ingeniería y Ciencias";
  return "Otros";
}

function inferPruebas(c: RawCarrera): string {
  const list: string[] = [];
  if ((c.ponderacionCL || 0) > 0) list.push("CL");
  if ((c.ponderacionM1 || 0) > 0) list.push("M1");
  if ((c.ponderacionM2 || 0) > 0) list.push("M2");
  if ((c.ponderacionHI || 0) > 0) list.push("HCS");
  if ((c.ponderacionCS || 0) > 0) list.push("Ciencias");
  return list.join(",");
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const id = `${Date.now()}_${randomBytes(8).toString("hex")}`;
  const tmpPdf = join(tmpdir(), `paes_${id}.pdf`);
  const tmpTxt = join(tmpdir(), `paes_${id}.txt`);
  try {
    await writeFile(tmpPdf, buffer);
    await execFileAsync("pdftotext", ["-layout", tmpPdf, tmpTxt]);
    return await readFile(tmpTxt, "utf-8");
  } finally {
    await unlink(tmpPdf).catch(() => {});
    await unlink(tmpTxt).catch(() => {});
  }
}

function detectTOC(pages: string[]): Array<[string, number]> {
  const toc: Array<[string, number]> = [];
  for (let i = 0; i < Math.min(14, pages.length); i++) {
    const lines = pages[i].split("\n");
    const candidates: Array<[string, number]> = [];
    for (const line of lines) {
      // Normalize curly apostrophes before matching
      const normalizedLine = line.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
      const m = normalizedLine.match(/^\s*\d{1,3}\s+([A-ZÁÉÍÓÚÑ.'\- ]+?)\s+(\d{2,3})\s*$/);
      if (m) {
        let name = m[1].trim().replace(/\s+/g, " ");
        name = name.replace(/['']/g, "'");
        const page = parseInt(m[2], 10);
        if (name.length > 8 && page >= 10 && page < 1000 && /UNIVERSIDAD/.test(name)) {
          candidates.push([name, page]);
        }
      }
    }
    if (candidates.length >= 30) {
      candidates.sort((a, b) => a[1] - b[1]);
      return candidates;
    }
  }
  return toc;
}

function detectPrintedPageNum(text: string): number | null {
  const lns = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = lns.length - 1; i >= Math.max(0, lns.length - 25); i--) {
    if (/^\d{1,3}$/.test(lns[i])) return parseInt(lns[i], 10);
  }
  return null;
}

function pageHasMC(pageText: string): boolean {
  return /\+\s*MC/.test(pageText);
}

// Check if a line is purely numeric data (ponderaciones row)
function isPureDataLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Must have at least 10 numeric-like tokens
  const tokens = trimmed.split(/\s+/);
  const numericCount = tokens.filter(t => /^---?$/.test(t) || /^\d+$/.test(t) || /^[Oo]$/.test(t)).length;
  return numericCount >= 10 && numericCount >= tokens.length * 0.8;
}

function extractNumericTail(line: string): { numerics: string[]; head: string } | null {
  const tokens = line.trim().split(/\s+/);
  let tailStart = tokens.length;
  let count = 0;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (/^---?$/.test(t) || /^\d+$/.test(t) || /^o$/i.test(t)) {
      tailStart = i;
      count++;
    } else break;
  }
  if (count < 10) return null;
  const tail = tokens.slice(tailStart);
  const merged: string[] = [];
  for (let i = 0; i < tail.length; i++) {
    if (/^\d+$/.test(tail[i]) && tail[i + 1] && /^o$/i.test(tail[i + 1]) && tail[i + 2] && /^\d+$/.test(tail[i + 2])) {
      merged.push(tail[i]);
      i += 2;
    } else if (/^o$/i.test(tail[i])) {
      // skip
    } else {
      merged.push(tail[i]);
    }
  }
  return { numerics: merged, head: tokens.slice(0, tailStart).join(" ") };
}

function buildCarrera(code: string, headText: string, numerics: string[], hasMC: boolean): RawCarrera {
  const chunks = headText.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  let name: string, sede: string;
  if (chunks.length >= 2) {
    name = chunks.slice(0, -1).join(" ");
    sede = chunks[chunks.length - 1];
  } else {
    name = chunks[0] || "";
    sede = "";
  }
  const clean = (v: string | undefined): number | null => {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || s === "---" || s === "-") return null;
    const n = parseFloat(s.replace(",", "."));
    return isNaN(n) ? null : n;
  };
  const aligned = hasMC
    ? ["nem", "rank", "cl", "m1", "hcs", "c", "m2", "pe", "ppm", "pprom", "reg", "mc", "bea", "pace", "s1", "s2"]
    : ["nem", "rank", "cl", "m1", "hcs", "c", "m2", "pe", "ppm", "pprom", "reg", "bea", "pace", "s1", "s2"];
  const data: Record<string, string> = {};
  for (let i = 0; i < aligned.length && i < numerics.length; i++) data[aligned[i]] = numerics[i];

  return {
    codigo: code,
    nombre: name.replace(/\s+/g, " ").trim(),
    sede: sede.replace(/\s+/g, " ").trim(),
    ponderacionNEM: clean(data.nem),
    ponderacionRanking: clean(data.rank),
    ponderacionCL: clean(data.cl),
    ponderacionM1: clean(data.m1),
    ponderacionHI: clean(data.hcs),
    ponderacionCS: clean(data.c),
    ponderacionM2: clean(data.m2),
    puntajePonderadoMinimo: clean(data.ppm),
    vacantesRegular: clean(data.reg),
    vacantesBEA: clean(data.bea),
    vacantesPACE: clean(data.pace),
    vacantesMC: clean(data.mc),
  };
}

function parsePages(pages: string[], toc: Array<[string, number]>): ParsedUniversity[] {
  const universities: ParsedUniversity[] = toc.map(([upperName]) => ({
    nombre: titleCaseUni(upperName),
    carreras: [],
  }));
  const uniIdx = new Map(universities.map((u, i) => [u.nombre, i]));

  let currentUni: string | null = null;
  let nextTocIdx = 0;
  const pageUni: (string | null)[] = [];
  for (let i = 0; i < pages.length; i++) {
    const printed = detectPrintedPageNum(pages[i]);
    while (nextTocIdx < toc.length && printed != null && printed >= toc[nextTocIdx][1]) {
      currentUni = titleCaseUni(toc[nextTocIdx][0]);
      nextTocIdx++;
    }
    pageUni[i] = currentUni;
  }

  for (let pi = 0; pi < pages.length; pi++) {
    const uni = pageUni[pi];
    if (!uni) continue;
    const idx = uniIdx.get(uni);
    if (idx == null) continue;
    const pageText = pages[pi];
    const hasMC = pageHasMC(pageText);
    const lns = pageText.split("\n");

    // pending: carrera whose name was on one line but data on a later line
    let pending: { code: string; headLines: string[]; beforeLines: string[] } | null = null;
    let beforeBuffer: string[] = [];

    const flushRowWithDataLine = (dataLine: string) => {
      if (!pending) return;
      const tail = extractNumericTail(dataLine);
      if (!tail) return;
      const headPieces: string[] = [];
      for (const l of pending.beforeLines) {
        const s = l.replace(/\s+$/, "");
        if (s.trim()) headPieces.push(s);
      }
      for (const l of pending.headLines) {
        const s = l.replace(/^\d{5}\s+/, "").replace(/\s+$/, "");
        if (s.trim()) headPieces.push(s);
      }
      const headText = headPieces.join("  ");
      const carrera = buildCarrera(pending.code, headText, tail.numerics, hasMC);
      if (carrera.nombre && carrera.nombre.length >= 2) {
        universities[idx].carreras.push(carrera);
      }
      pending = null;
      beforeBuffer = [];
    };

    for (let i = 0; i < lns.length; i++) {
      const ln = lns[i];
      if (!ln.trim()) continue;
      const isCode = /^\d{5}\s/.test(ln);

      if (isCode) {
        const tail = extractNumericTail(ln);
        if (tail && tail.head) {
          // Complete row on one line
          const code = ln.slice(0, 5);
          const headRest = tail.head.replace(/^\d{5}\s+/, "");
          const headPieces = [...beforeBuffer.map((l) => l.replace(/\s+$/, "")), headRest].filter((s) => s.trim());
          const headText = headPieces.join("  ");
          const carrera = buildCarrera(code, headText, tail.numerics, hasMC);
          if (carrera.nombre && carrera.nombre.length >= 2) {
            universities[idx].carreras.push(carrera);
          }
          beforeBuffer = [];
          pending = null;
        } else {
          // Code line without numeric data — name/sede will follow on next lines
          if (pending) pending = null;
          pending = { code: ln.slice(0, 5), headLines: [ln], beforeLines: beforeBuffer };
          beforeBuffer = [];
        }
      } else {
        const tailIfData = extractNumericTail(ln);
        const isMostlyNumbers = tailIfData && tailIfData.head.trim().length === 0;
        const isPureData = isPureDataLine(ln);

        if ((isMostlyNumbers || isPureData) && pending) {
          // Data line for a pending carrera
          flushRowWithDataLine(ln);
        } else if (pending) {
          // Additional name/sede line for pending carrera
          pending.headLines.push(ln);
        } else {
          beforeBuffer.push(ln);
        }
      }
    }
  }

  return universities;
}

interface CleanedRow {
  nombre: string;
  universidad: string;
  ciudad: string;
  region: string;
  area: string;
  vacantes: number | null;
  puntajeCorte: number | null;
  cuposBEA: number | null;
  cuposPACE: number | null;
  cuposMC: number | null;
  ponderacionCL: number | null;
  ponderacionM1: number | null;
  ponderacionM2: number | null;
  ponderacionCS: number | null;
  ponderacionHI: number | null;
  ponderacionNEM: number | null;
  ponderacionRanking: number | null;
  pruebasObligatorias: string;
  publicado: boolean;
}

function cleanRows(parsed: ParsedUniversity[]): { rows: CleanedRow[]; skipped: number } {
  const rows: CleanedRow[] = [];
  let skipped = 0;
  for (const uni of parsed) {
    for (const c of uni.carreras) {
      const sumPond =
        (c.ponderacionNEM || 0) + (c.ponderacionRanking || 0) + (c.ponderacionCL || 0) +
        (c.ponderacionM1 || 0) + (c.ponderacionHI || 0) + (c.ponderacionCS || 0) + (c.ponderacionM2 || 0);
      // More permissive range to handle universities with different puntaje formats
      if (sumPond < 40 || sumPond > 120) { skipped++; continue; }
      if (!c.nombre || c.nombre.length < 2) { skipped++; continue; }

      let cleanName = c.nombre
        .replace(/\([\d*][\d*A-Z]*\)/g, "")
        .replace(/\s+/g, " ")
        .trim();

      cleanName = cleanName
        .replace(/\s*PONDERACIÓN.*$/i, "")
        .replace(/\s*DESCRIPCIÓN.*$/i, "")
        .replace(/\s*REQUISITOS.*$/i, "")
        .replace(/\s*O\s*FE\s*RTA.*$/i, "")
        .replace(/^UNIVERSIDAD\s+[A-ZÁÉÍÓÚÑ' \-]+?\s+(?=[A-Z])/, "")
        .trim();

      if (!cleanName || cleanName.length < 4) { skipped++; continue; }
      if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{4,}/.test(cleanName)) { skipped++; continue; }
      if (/(PONDERACIÓN|DESCRIPCIÓN|REQUISITOS|O\s*FE\s*RTA|FACTORES|VACANTES|LUGAR EN|CARRERA O)/i.test(cleanName)) { skipped++; continue; }
      if (/^UNIVERSIDAD/i.test(cleanName)) { skipped++; continue; }
      const upperName = cleanName.toUpperCase();
      if (CITY_TO_REGION[upperName]) { skipped++; continue; }
      if (/^(Y|EN)\s/i.test(cleanName) && cleanName.length < 25) { skipped++; continue; }

      const sedeUpper = (c.sede || "").toUpperCase();
      if (/^(INGENIERÍA|MEDICINA|ENFERMERÍA|DERECHO|PSICOLOG|ODONTOLOG|KINESIOLOG|NUTRICIÓN|PEDAGOG|ARQUITECT|FONOAUD|OBSTETRI|TECNOLOG)/.test(sedeUpper)) {
        skipped++; continue;
      }

      let { ciudad, region } = inferRegionAndCiudad(c.sede || "", uni.nombre);
      const def = KNOWN_UNI_NAMES[uni.nombre.toUpperCase()];
      if (def && region === def[1] && ciudad === def[0]) {
        const fromName = inferRegionAndCiudad(cleanName, uni.nombre);
        if (fromName.region !== region || fromName.ciudad !== ciudad) {
          ciudad = fromName.ciudad;
          region = fromName.region;
        }
      }

      cleanName = stripTrailingCity(cleanName, ciudad);
      cleanName = cleanName.replace(/[\s,\-]+$/g, "").trim();
      if (cleanName.length < 4) { skipped++; continue; }

      rows.push({
        nombre: cleanName,
        universidad: uni.nombre,
        ciudad,
        region,
        area: inferArea(cleanName),
        vacantes: c.vacantesRegular,
        puntajeCorte: c.puntajePonderadoMinimo,
        cuposBEA: c.vacantesBEA,
        cuposPACE: c.vacantesPACE,
        cuposMC: c.vacantesMC,
        ponderacionCL: c.ponderacionCL,
        ponderacionM1: c.ponderacionM1,
        ponderacionM2: c.ponderacionM2,
        ponderacionCS: c.ponderacionCS,
        ponderacionHI: c.ponderacionHI,
        ponderacionNEM: c.ponderacionNEM,
        ponderacionRanking: c.ponderacionRanking,
        pruebasObligatorias: inferPruebas(c),
        publicado: true,
      });
    }
  }
  return { rows, skipped };
}

export interface PaesImportResult {
  extracted: number;
  saved: number;
  skipped: number;
  universidades: number;
  message: string;
}

export async function importPaesPdf(buffer: Buffer): Promise<PaesImportResult> {
  const text = await extractTextFromPdf(buffer);
  const pages = text.split("\f");

  const toc = detectTOC(pages);
  if (toc.length < 30) {
    throw new Error(
      `No se pudo detectar el índice del PDF (encontradas ${toc.length} universidades). ` +
      `Verifica que sea el PDF oficial "Oferta Definitiva" de DEMRE.`
    );
  }

  const parsed = parsePages(pages, toc);
  const totalParsed = parsed.reduce((s, u) => s + u.carreras.length, 0);

  const { rows, skipped } = cleanRows(parsed);

  if (rows.length < 1000) {
    throw new Error(
      `Sólo se extrajeron ${rows.length} carreras válidas (esperadas al menos 1000). ` +
      `Es probable que el formato del PDF haya cambiado. No se realizaron cambios en la base de datos.`
    );
  }
  if (toc.length < 40) {
    throw new Error(
      `Sólo se detectaron ${toc.length} universidades (esperadas al menos 40). ` +
      `Verifica que sea el PDF oficial completo. No se realizaron cambios.`
    );
  }

  const uniCounts = new Map<string, number>();
  for (const r of rows) uniCounts.set(r.universidad, (uniCounts.get(r.universidad) || 0) + 1);
  const emptyUnis = parsed.filter((u) => !uniCounts.has(u.nombre)).map((u) => u.nombre);
  if (emptyUnis.length > 8) {
    throw new Error(
      `${emptyUnis.length} universidades quedaron sin carreras tras el parseo: ${emptyUnis.slice(0, 3).join(", ")}... ` +
      `Esto sugiere que el formato cambió. No se realizaron cambios.`
    );
  }

  await db.transaction(async (tx) => {
    await tx.delete(carrerasTable);
    for (let i = 0; i < rows.length; i += 200) {
      await tx.insert(carrerasTable).values(rows.slice(i, i + 200));
    }
  });

  return {
    extracted: totalParsed,
    saved: rows.length,
    skipped,
    universidades: toc.length,
    message:
      `PDF procesado correctamente. Se cargaron ${rows.length} carreras de ${toc.length} universidades. ` +
      `(${skipped} filas con datos inválidos fueron descartadas.)`,
  };
}
