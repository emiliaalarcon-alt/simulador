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
  mensajeMotivacionalEnabled: boolean("mensaje_motivacional_enabled").notNull().default(true),
  mensajeMotivacionalTexto: text("mensaje_motivacional_texto").notNull().default("Y porque en el camino a cumplir tus sueños cada paso cuenta, estamos para seguir apoyándote 💪\n\nPuedes continuar tu preparación en: nuestra plataforma de videos en Mat21.cl, resolviendo dudas directamente con tu profesor a través de la app Mat21 o mejorando tus técnicas de estudio con nuestro equipo de orientación 📘🚀"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
