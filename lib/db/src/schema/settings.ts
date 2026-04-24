import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  simuladorActivo: boolean("simulador_activo").notNull().default(true),
  anoProcesoActual: text("ano_proceso_actual").notNull().default("2025"),
  mensajeBienvenida: text("mensaje_bienvenida").notNull().default("Bienvenido al Simulador PAES. Ingresa tus puntajes estimados y descubre tus opciones universitarias."),
  orientadoraEnabled: boolean("orientadora_enabled").notNull().default(true),
  orientadoraTitulo: text("orientadora_titulo").notNull().default("¿Necesitas ayuda eligiendo tu carrera?"),
  orientadoraMensaje: text("orientadora_mensaje").notNull().default("Recuerda que en MAT 21 contamos con un equipo de orientación vocacional que te acompaña con técnicas de estudio y la elección de la carrera ideal para ti."),
  orientadoraCtaTexto: text("orientadora_cta_texto").notNull().default("Habla con nuestra orientadora"),
  orientadoraCtaUrl: text("orientadora_cta_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
