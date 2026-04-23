import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  simuladorActivo: boolean("simulador_activo").notNull().default(true),
  anoProcesoActual: text("ano_proceso_actual").notNull().default("2025"),
  mensajeBienvenida: text("mensaje_bienvenida").notNull().default("Bienvenido al Simulador PAES. Ingresa tus puntajes estimados y descubre tus opciones universitarias."),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
