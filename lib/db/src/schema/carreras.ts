import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carrerasTable = pgTable("carreras", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  universidad: text("universidad").notNull(),
  ciudad: text("ciudad").notNull(),
  region: text("region").notNull(),
  area: text("area").notNull(),
  vacantes: integer("vacantes"),
  puntajeCorte: real("puntaje_corte"),
  puntajeMaximo: real("puntaje_maximo"),
  puntajeMinimo: real("puntaje_minimo"),
  puntajePromedio: real("puntaje_promedio"),
  matriculaAnual: integer("matricula_anual"),
  arancelAnual: integer("arancel_anual"),
  cuposBEA: integer("cupos_bea"),
  cuposPACE: integer("cupos_pace"),
  cuposMC: integer("cupos_mc"),
  duracionSemestres: integer("duracion_semestres"),
  jornada: text("jornada"),
  modalidad: text("modalidad"),
  acreditacion: text("acreditacion"),
  ponderacionCL: real("ponderacion_cl"),
  ponderacionM1: real("ponderacion_m1"),
  ponderacionM2: real("ponderacion_m2"),
  ponderacionCS: real("ponderacion_cs"),
  ponderacionHI: real("ponderacion_hi"),
  ponderacionNEM: real("ponderacion_nem"),
  ponderacionRanking: real("ponderacion_ranking"),
  pruebasObligatorias: text("pruebas_obligatorias").notNull().default(""),
  publicado: boolean("publicado").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCarreraSchema = createInsertSchema(carrerasTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarrera = z.infer<typeof insertCarreraSchema>;
export type Carrera = typeof carrerasTable.$inferSelect;
