import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/settings/public", async (_req, res): Promise<void> => {
  let [settings] = await db.select().from(settingsTable).limit(1);

  if (!settings) {
    [settings] = await db.insert(settingsTable).values({}).returning();
  }

  res.json({
    simuladorActivo: settings.simuladorActivo,
    mensajeBienvenida: settings.mensajeBienvenida,
    orientadoraEnabled: settings.orientadoraEnabled,
    orientadoraTitulo: settings.orientadoraTitulo,
    orientadoraMensaje: settings.orientadoraMensaje,
    orientadoraCtaTexto: settings.orientadoraCtaTexto,
    orientadoraCtaUrl: settings.orientadoraCtaUrl,
    mensajeMotivacionalEnabled: settings.mensajeMotivacionalEnabled,
    mensajeMotivacionalTexto: settings.mensajeMotivacionalTexto,
  });
});

export default router;
