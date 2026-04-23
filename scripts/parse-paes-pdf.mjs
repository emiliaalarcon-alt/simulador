#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const fullText = readFileSync("/tmp/oferta-layout.txt", "utf8");
const pageTexts = fullText.split("\f");

const TOC = [
  ["Pontificia Universidad Católica de Chile", 15],
  ["Pontificia Universidad Católica de Valparaíso", 46],
  ["Universidad Academia de Humanismo Cristiano", 58],
  ["Universidad Adolfo Ibáñez", 85],
  ["Universidad Adventista de Chile", 107],
  ["Universidad Alberto Hurtado", 112],
  ["Universidad Andrés Bello", 122],
  ["Universidad Arturo Prat", 140],
  ["Universidad Austral de Chile", 146],
  ["Universidad Autónoma de Chile", 158],
  ["Universidad Bernardo O'Higgins", 174],
  ["Universidad Católica de la Santísima Concepción", 191],
  ["Universidad Católica de Temuco", 197],
  ["Universidad Católica del Maule", 202],
  ["Universidad Católica del Norte", 209],
  ["Universidad Católica Silva Henríquez", 218],
  ["Universidad Central de Chile", 225],
  ["Universidad de Antofagasta", 235],
  ["Universidad de Atacama", 243],
  ["Universidad de Aysén", 248],
  ["Universidad de Chile", 253],
  ["Universidad de Concepción", 279],
  ["Universidad de La Frontera", 289],
  ["Universidad de La Serena", 297],
  ["Universidad de Las Américas", 304],
  ["Universidad de los Andes", 316],
  ["Universidad de Los Lagos", 326],
  ["Universidad de Magallanes", 333],
  ["Universidad de O'Higgins", 338],
  ["Universidad de Playa Ancha", 355],
  ["Universidad de Santiago de Chile", 364],
  ["Universidad de Talca", 378],
  ["Universidad de Tarapacá", 395],
  ["Universidad de Valparaíso", 403],
  ["Universidad del Alba", 410],
  ["Universidad del Bío-Bío", 419],
  ["Universidad del Desarrollo", 425],
  ["Universidad Diego Portales", 453],
  ["Universidad Finis Terrae", 461],
  ["Universidad Gabriela Mistral", 469],
  ["Universidad Mayor", 477],
  ["Universidad Metropolitana de Ciencias de la Educación", 493],
  ["Universidad San Sebastián", 500],
  ["Universidad Santo Tomás", 514],
  ["Universidad Técnica Federico Santa María", 531],
  ["Universidad Tecnológica Metropolitana", 546],
  ["Universidad Viña del Mar", 552],
];

function detectPrintedPageNum(text) {
  const lns = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = lns.length - 1; i >= Math.max(0, lns.length - 25); i--) {
    if (/^\d{1,3}$/.test(lns[i])) return parseInt(lns[i], 10);
  }
  return null;
}
let currentUni = null;
const pageUni = [];
let nextTocIdx = 0;
for (let i = 0; i < pageTexts.length; i++) {
  const printed = detectPrintedPageNum(pageTexts[i]);
  while (nextTocIdx < TOC.length && printed != null && printed >= TOC[nextTocIdx][1]) {
    currentUni = TOC[nextTocIdx][0];
    nextTocIdx++;
  }
  pageUni[i] = currentUni;
}

const universities = TOC.map(([name]) => ({ nombre: name, carreras: [] }));
const uniIdx = new Map(universities.map((u, i) => [u.nombre, i]));

// Detect if a page has the "+ MC" column (Más Mujeres Científicas).
// Some universities include it, others don't. The header word "+ MC" appears
// in the page text when present.
function pageHasMC(pageText) {
  return /\+\s*MC/.test(pageText);
}

// Tokenize the trailing numeric portion of a line. Returns null if not enough numerics.
function extractNumericTail(line) {
  // Split by 1+ whitespace
  const tokens = line.trim().split(/\s+/);
  // Walk from the end, grabbing tokens that are number, "---", or "o" (allow merge)
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
  // Consolidate "X o Y" into single value
  const tail = tokens.slice(tailStart);
  const merged = [];
  for (let i = 0; i < tail.length; i++) {
    if (/^\d+$/.test(tail[i]) && tail[i + 1] && /^o$/i.test(tail[i + 1]) && tail[i + 2] && /^\d+$/.test(tail[i + 2])) {
      merged.push(tail[i]); i += 2;
    } else if (/^o$/i.test(tail[i])) {
      // skip stray
    } else {
      merged.push(tail[i]);
    }
  }
  return { numerics: merged, head: tokens.slice(0, tailStart).join(" ") };
}

function buildCarrera({ uni, code, headText, numerics, hasMC }) {
  // headText = code + name + sede chunks before numerics. Carrera name and sede
  // tend to be separated by 2+ spaces.
  // Strategy: split by 2+ spaces; the LAST chunk = sede, everything before (minus code) = name.
  // headText may have already been stripped of code.
  // The sede column is roughly 12-25 chars wide and is uppercase letters/spaces/dashes.
  const chunks = headText.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  let name, sede;
  if (chunks.length >= 2) {
    name = chunks.slice(0, -1).join(" ");
    sede = chunks[chunks.length - 1];
  } else {
    name = chunks[0] || "";
    sede = "";
  }
  // Clean
  const clean = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || s === "---" || s === "-") return null;
    const n = parseFloat(s.replace(",", "."));
    return isNaN(n) ? null : n;
  };
  const aligned = hasMC
    ? ["nem","rank","cl","m1","hcs","c","m2","pe","ppm","pprom","reg","mc","bea","pace","s1","s2"]
    : ["nem","rank","cl","m1","hcs","c","m2","pe","ppm","pprom","reg","bea","pace","s1","s2"];
  const data = {};
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
    ponderacionPE: clean(data.pe),
    puntajePonderadoMinimo: clean(data.ppm),
    puntajePromedioMinimo: clean(data.pprom),
    vacantesRegular: clean(data.reg),
    vacantesBEA: clean(data.bea),
    vacantesPACE: clean(data.pace),
    vacantesMC: clean(data.mc),
  };
}

let totalRows = 0;
for (let pi = 0; pi < pageTexts.length; pi++) {
  const uni = pageUni[pi];
  if (!uni) continue;
  const idx = uniIdx.get(uni);
  if (idx == null) continue;
  const pageText = pageTexts[pi];
  const hasMC = pageHasMC(pageText);
  const lns = pageText.split("\n");

  // Walk lines; manage a "pending row" that has a code and accumulated head text but no data yet.
  let pending = null; // { code, headLines: [], beforeLines: [] }
  let beforeBuffer = []; // text lines AFTER the previous data line and BEFORE any code line
  let postedCount = 0;

  const flushRowWithDataLine = (dataLine) => {
    if (!pending) return;
    const tail = extractNumericTail(dataLine);
    if (!tail) return;
    // Combine: name fragments come from beforeBuffer (lines before code) +
    // headLines (lines from code line onward, code stripped). Sede usually appears in headLines.
    const headPieces = [];
    for (const l of pending.beforeLines) {
      const s = l.replace(/\s+$/, "");
      if (s.trim()) headPieces.push(s);
    }
    for (const l of pending.headLines) {
      const s = l.replace(/^\d{5}\s+/, "").replace(/\s+$/, "");
      if (s.trim()) headPieces.push(s);
    }
    // Join with double space so split(/\s{2,}/) keeps chunks distinct
    const headText = headPieces.join("  ");
    const carrera = buildCarrera({
      uni, code: pending.code, headText, numerics: tail.numerics, hasMC,
    });
    if (carrera.nombre && carrera.nombre.length >= 2) {
      universities[idx].carreras.push(carrera);
      postedCount++;
      totalRows++;
    }
    pending = null;
    beforeBuffer = [];
  };

  for (let i = 0; i < lns.length; i++) {
    const ln = lns[i];
    if (!ln.trim()) continue;
    const isCode = /^\d{5}\s/.test(ln);
    if (isCode) {
      // Try single-line: does this line have 10+ trailing numerics?
      const tail = extractNumericTail(ln);
      if (tail && tail.head) {
        // Extract code + headText
        const code = ln.slice(0, 5);
        // headText excludes the code prefix
        const headRest = tail.head.replace(/^\d{5}\s+/, "");
        // Combine with any beforeBuffer (prev rows' continuation text that wasn't consumed)
        const headPieces = [...beforeBuffer.map((l) => l.replace(/\s+$/, "")), headRest].filter((s) => s.trim());
        const headText = headPieces.join("  ");
        const carrera = buildCarrera({ uni, code, headText, numerics: tail.numerics, hasMC });
        if (carrera.nombre && carrera.nombre.length >= 2) {
          universities[idx].carreras.push(carrera);
          postedCount++;
          totalRows++;
        }
        beforeBuffer = [];
        pending = null;
      } else {
        // Multi-line: store this line as the head of pending
        if (pending) {
          // We had a pending code with no data line; drop it (likely a parse glitch)
          pending = null;
        }
        pending = { code: ln.slice(0, 5), headLines: [ln], beforeLines: beforeBuffer };
        beforeBuffer = [];
      }
    } else {
      // Non-code line: could be continuation OR a data-only line (for multi-line rows)
      const tailIfData = extractNumericTail(ln);
      const isMostlyNumbers = tailIfData && tailIfData.head.trim().length === 0;
      if (isMostlyNumbers && pending) {
        flushRowWithDataLine(ln);
      } else if (pending) {
        // accumulate as continuation of name/sede
        pending.headLines.push(ln);
      } else {
        // Before any code line — accumulate for next code line
        beforeBuffer.push(ln);
      }
    }
  }
}

let total = 0;
for (const u of universities) total += u.carreras.length;
console.error(`Total carreras parsed: ${total} (expected ~2151)`);
console.error(`Per-university counts:`);
for (const u of universities) {
  const flag = u.carreras.length === 0 ? " ⚠ EMPTY" : "";
  console.error(`  ${u.nombre}: ${u.carreras.length}${flag}`);
}

writeFileSync("/tmp/paes-data.json", JSON.stringify(universities, null, 2));
console.error("\nWrote /tmp/paes-data.json");
