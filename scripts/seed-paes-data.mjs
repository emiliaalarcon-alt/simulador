#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const require = createRequire(pathToFileURL(resolve("lib/db/package.json")));
const pg = require("pg");

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const data = JSON.parse(readFileSync("/tmp/paes-data.json", "utf8"));

// Map common Chilean cities to regions
const CITY_TO_REGION = {
  "ARICA": "Arica y Parinacota",
  "IQUIQUE": "Tarapacá",
  "ALTO HOSPICIO": "Tarapacá",
  "ANTOFAGASTA": "Antofagasta",
  "CALAMA": "Antofagasta",
  "COPIAPÓ": "Atacama",
  "VALLENAR": "Atacama",
  "LA SERENA": "Coquimbo",
  "COQUIMBO": "Coquimbo",
  "OVALLE": "Coquimbo",
  "VALPARAÍSO": "Valparaíso",
  "VIÑA DEL MAR": "Valparaíso",
  "QUILLOTA": "Valparaíso",
  "SAN FELIPE": "Valparaíso",
  "LOS ANDES": "Valparaíso",
  "QUILPUÉ": "Valparaíso",
  "SAN ANTONIO": "Valparaíso",
  "SANTIAGO": "Metropolitana",
  "MAIPÚ": "Metropolitana",
  "PUENTE ALTO": "Metropolitana",
  "RANCAGUA": "O'Higgins",
  "SAN FERNANDO": "O'Higgins",
  "TALCA": "Maule",
  "CURICÓ": "Maule",
  "LINARES": "Maule",
  "CAUQUENES": "Maule",
  "CHILLÁN": "Ñuble",
  "CONCEPCIÓN": "Biobío",
  "LOS ÁNGELES": "Biobío",
  "TALCAHUANO": "Biobío",
  "TEMUCO": "Araucanía",
  "VILLARRICA": "Araucanía",
  "ANGOL": "Araucanía",
  "VALDIVIA": "Los Ríos",
  "OSORNO": "Los Lagos",
  "PUERTO MONTT": "Los Lagos",
  "CASTRO": "Los Lagos",
  "ANCUD": "Los Lagos",
  "COYHAIQUE": "Aysén",
  "PUERTO AYSÉN": "Aysén",
  "PUNTA ARENAS": "Magallanes",
  "PUERTO NATALES": "Magallanes",
  "TEJA": "Los Ríos",
  "CHIGUAYANTE": "Biobío",
};

// Default home city/region for each university (used when sede string lacks a known city).
const UNI_DEFAULT = {
  "Pontificia Universidad Católica de Chile": ["Santiago", "Metropolitana"],
  "Pontificia Universidad Católica de Valparaíso": ["Valparaíso", "Valparaíso"],
  "Universidad Academia de Humanismo Cristiano": ["Santiago", "Metropolitana"],
  "Universidad Adolfo Ibáñez": ["Santiago", "Metropolitana"],
  "Universidad Adventista de Chile": ["Chillán", "Ñuble"],
  "Universidad Alberto Hurtado": ["Santiago", "Metropolitana"],
  "Universidad Andrés Bello": ["Santiago", "Metropolitana"],
  "Universidad Arturo Prat": ["Iquique", "Tarapacá"],
  "Universidad Austral de Chile": ["Valdivia", "Los Ríos"],
  "Universidad Autónoma de Chile": ["Talca", "Maule"],
  "Universidad Bernardo O'Higgins": ["Santiago", "Metropolitana"],
  "Universidad Católica de la Santísima Concepción": ["Concepción", "Biobío"],
  "Universidad Católica de Temuco": ["Temuco", "Araucanía"],
  "Universidad Católica del Maule": ["Talca", "Maule"],
  "Universidad Católica del Norte": ["Antofagasta", "Antofagasta"],
  "Universidad Católica Silva Henríquez": ["Santiago", "Metropolitana"],
  "Universidad Central de Chile": ["Santiago", "Metropolitana"],
  "Universidad de Antofagasta": ["Antofagasta", "Antofagasta"],
  "Universidad de Atacama": ["Copiapó", "Atacama"],
  "Universidad de Aysén": ["Coyhaique", "Aysén"],
  "Universidad de Chile": ["Santiago", "Metropolitana"],
  "Universidad de Concepción": ["Concepción", "Biobío"],
  "Universidad de La Frontera": ["Temuco", "Araucanía"],
  "Universidad de La Serena": ["La Serena", "Coquimbo"],
  "Universidad de Las Américas": ["Santiago", "Metropolitana"],
  "Universidad de los Andes": ["Santiago", "Metropolitana"],
  "Universidad de Los Lagos": ["Osorno", "Los Lagos"],
  "Universidad de Magallanes": ["Punta Arenas", "Magallanes"],
  "Universidad de O'Higgins": ["Rancagua", "O'Higgins"],
  "Universidad de Playa Ancha": ["Valparaíso", "Valparaíso"],
  "Universidad de Santiago de Chile": ["Santiago", "Metropolitana"],
  "Universidad de Talca": ["Talca", "Maule"],
  "Universidad de Tarapacá": ["Arica", "Arica y Parinacota"],
  "Universidad de Valparaíso": ["Valparaíso", "Valparaíso"],
  "Universidad del Alba": ["Santiago", "Metropolitana"],
  "Universidad del Bío-Bío": ["Concepción", "Biobío"],
  "Universidad del Desarrollo": ["Santiago", "Metropolitana"],
  "Universidad Diego Portales": ["Santiago", "Metropolitana"],
  "Universidad Finis Terrae": ["Santiago", "Metropolitana"],
  "Universidad Gabriela Mistral": ["Santiago", "Metropolitana"],
  "Universidad Mayor": ["Santiago", "Metropolitana"],
  "Universidad Metropolitana de Ciencias de la Educación": ["Santiago", "Metropolitana"],
  "Universidad San Sebastián": ["Concepción", "Biobío"],
  "Universidad Santo Tomás": ["Santiago", "Metropolitana"],
  "Universidad Técnica Federico Santa María": ["Valparaíso", "Valparaíso"],
  "Universidad Tecnológica Metropolitana": ["Santiago", "Metropolitana"],
  "Universidad Viña del Mar": ["Viña del Mar", "Valparaíso"],
};

function inferRegionAndCiudad(sede, uniName) {
  // Prefer a real city found in the sede string
  if (sede) {
    const upper = sede.toUpperCase();
    for (const [city, region] of Object.entries(CITY_TO_REGION)) {
      if (upper.includes(city)) {
        const ciudad = city.charAt(0) + city.slice(1).toLowerCase();
        return { ciudad, region };
      }
    }
  }
  // Fallback: university default
  const def = UNI_DEFAULT[uniName];
  if (def) return { ciudad: def[0], region: def[1] };
  return { ciudad: "Santiago", region: "Metropolitana" };
}

function inferArea(nombre) {
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

function inferPruebas(c) {
  // Carrera requires a prueba if its ponderación > 0
  const list = [];
  if ((c.ponderacionCL || 0) > 0) list.push("CL");
  if ((c.ponderacionM1 || 0) > 0) list.push("M1");
  if ((c.ponderacionM2 || 0) > 0) list.push("M2");
  if ((c.ponderacionHI || 0) > 0) list.push("HCS");
  if ((c.ponderacionCS || 0) > 0) list.push("Ciencias");
  return list.join(",");
}

const client = await pool.connect();
try {
  console.error("Wiping carreras table...");
  await client.query("TRUNCATE TABLE carreras RESTART IDENTITY CASCADE");

  let inserted = 0;
  let skipped = 0;
  for (const uni of data) {
    for (const c of uni.carreras) {
      // Skip rows with no sensible ponderación data
      const sumPond = (c.ponderacionNEM || 0) + (c.ponderacionRanking || 0) + (c.ponderacionCL || 0) +
        (c.ponderacionM1 || 0) + (c.ponderacionHI || 0) + (c.ponderacionCS || 0) + (c.ponderacionM2 || 0);
      if (sumPond < 50 || sumPond > 110) { skipped++; continue; }
      if (!c.nombre || c.nombre.length < 2) { skipped++; continue; }

      // Strip leading footnote markers like "(2) (10) (27) " from names
      let cleanName = c.nombre
        .replace(/^(?:\([\dA-Z*]+\)\s*)+/, "")
        .replace(/\s+/g, " ")
        .trim();

      // Strip page-header noise that occasionally leaks in
      cleanName = cleanName
        .replace(/\s*PONDERACIÓN.*$/i, "")
        .replace(/\s*DESCRIPCIÓN.*$/i, "")
        .replace(/\s*REQUISITOS.*$/i, "")
        .replace(/\s*O\s*FE\s*RTA.*$/i, "")
        .replace(/^UNIVERSIDAD\s+[A-ZÁÉÍÓÚÑ' \-]+?\s+(?=[A-Z])/, "")
        .trim();

      // Reject obvious garbage:
      if (!cleanName || cleanName.length < 4) { skipped++; continue; }
      if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{4,}/.test(cleanName)) { skipped++; continue; }
      // Hard reject any name still containing PDF header tokens
      if (/(PONDERACIÓN|DESCRIPCIÓN|REQUISITOS|O\s*FE\s*RTA|FACTORES|VACANTES|LUGAR EN|CARRERA O)/i.test(cleanName)) { skipped++; continue; }
      // Reject anything starting with UNIVERSIDAD (page header)
      if (/^UNIVERSIDAD/i.test(cleanName)) { skipped++; continue; }
      // Reject names that are just a city
      const upperName = cleanName.toUpperCase();
      if (CITY_TO_REGION[upperName]) { skipped++; continue; }
      // Reject true fragment-starts ("Y ...", "EN ..." very short)
      if (/^(Y|EN)\s/i.test(cleanName) && cleanName.length < 25) { skipped++; continue; }

      // Reject rows where sede looks like a carrera name (inverted rows)
      const sedeUpper = (c.sede || "").toUpperCase();
      if (/^(INGENIERÍA|MEDICINA|ENFERMERÍA|DERECHO|PSICOLOG|ODONTOLOG|KINESIOLOG|NUTRICIÓN|PEDAGOG|ARQUITECT|FONOAUD|OBSTETRI|TECNOLOG)/.test(sedeUpper)) {
        skipped++; continue;
      }

      c.nombre = cleanName;

      // Try sede first, then fall back to nombre (city often leaks into name during parse)
      let { ciudad, region } = inferRegionAndCiudad(c.sede || "", uni.nombre);
      if (region === (UNI_DEFAULT[uni.nombre]?.[1] || "Metropolitana")) {
        const fromName = inferRegionAndCiudad(c.nombre, uni.nombre);
        if (fromName.region !== region || fromName.ciudad !== ciudad) {
          ciudad = fromName.ciudad;
          region = fromName.region;
        }
      }
      const area = inferArea(c.nombre);
      const pruebas = inferPruebas(c);

      await client.query(
        `INSERT INTO carreras (
           nombre, universidad, ciudad, region, area,
           vacantes, puntaje_corte,
           cupos_bea, cupos_pace, cupos_mc,
           ponderacion_cl, ponderacion_m1, ponderacion_m2,
           ponderacion_cs, ponderacion_hi,
           ponderacion_nem, ponderacion_ranking,
           pruebas_obligatorias, publicado
         ) VALUES (
           $1,$2,$3,$4,$5,
           $6,$7,
           $8,$9,$10,
           $11,$12,$13,
           $14,$15,
           $16,$17,
           $18,$19
         )`,
        [
          c.nombre,
          uni.nombre,
          ciudad,
          region,
          area,
          c.vacantesRegular ?? null,
          c.puntajePonderadoMinimo ?? null,
          c.vacantesBEA ?? null,
          c.vacantesPACE ?? null,
          c.vacantesMC ?? null,
          c.ponderacionCL ?? null,
          c.ponderacionM1 ?? null,
          c.ponderacionM2 ?? null,
          c.ponderacionCS ?? null,
          c.ponderacionHI ?? null,
          c.ponderacionNEM ?? null,
          c.ponderacionRanking ?? null,
          pruebas,
          true,
        ]
      );
      inserted++;
    }
  }
  console.error(`Inserted ${inserted} carreras (skipped ${skipped} bad rows)`);
} finally {
  client.release();
  await pool.end();
}
