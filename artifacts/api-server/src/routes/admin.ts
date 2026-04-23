import { Router, type IRouter } from "express";
import { eq, ilike, count as drizzleCount } from "drizzle-orm";
import { db, carrerasTable, settingsTable } from "@workspace/db";
import {
  AdminListCarrerasQueryParams,
  CreateCarreraBody,
  UpdateCarreraBody,
  UpdateCarreraParams,
  DeleteCarreraParams,
  UploadPdfBody,
  UpdateSettingsBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/authMiddleware";
import { importPaesPdf } from "../lib/paesParser";

const router: IRouter = Router();

router.use(requireAdmin);

router.get("/admin/carreras", async (req, res): Promise<void> => {
  const query = AdminListCarrerasQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const page = query.data.page ?? 1;
  const limit = query.data.limit ?? 20;
  const offset = (page - 1) * limit;
  const search = query.data.search;

  const conditions = search
    ? [ilike(carrerasTable.nombre, `%${search}%`)]
    : [];

  const [totalResult] = await db
    .select({ count: drizzleCount() })
    .from(carrerasTable)
    .where(conditions.length ? conditions[0] : undefined);

  const carreras = await db
    .select()
    .from(carrerasTable)
    .where(conditions.length ? conditions[0] : undefined)
    .orderBy(carrerasTable.nombre)
    .limit(limit)
    .offset(offset);

  res.json({
    carreras,
    total: Number(totalResult?.count ?? 0),
    page,
    limit,
  });
});

router.post("/admin/carreras", async (req, res): Promise<void> => {
  const parsed = CreateCarreraBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [carrera] = await db
    .insert(carrerasTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(carrera);
});

router.patch("/admin/carreras/:id", async (req, res): Promise<void> => {
  const params = UpdateCarreraParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = UpdateCarreraBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [carrera] = await db
    .update(carrerasTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(carrerasTable.id, params.data.id))
    .returning();

  if (!carrera) {
    res.status(404).json({ error: "Carrera no encontrada" });
    return;
  }

  res.json(carrera);
});

router.delete("/admin/carreras/:id", async (req, res): Promise<void> => {
  const params = DeleteCarreraParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [deleted] = await db
    .delete(carrerasTable)
    .where(eq(carrerasTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Carrera no encontrada" });
    return;
  }

  res.sendStatus(204);
});

router.post("/admin/publish", async (_req, res): Promise<void> => {
  const result = await db
    .update(carrerasTable)
    .set({ publicado: true, updatedAt: new Date() })
    .where(eq(carrerasTable.publicado, false))
    .returning({ id: carrerasTable.id });

  res.json({
    published: result.length,
    message: `${result.length} carreras publicadas exitosamente`,
  });
});

router.post("/admin/upload-pdf", async (req, res): Promise<void> => {
  const parsed = UploadPdfBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos de PDF inválidos" });
    return;
  }

  const { fileBase64 } = parsed.data;

  try {
    const buffer = Buffer.from(fileBase64, "base64");
    const result = await importPaesPdf(buffer);
    res.json({
      extracted: result.extracted,
      saved: result.saved,
      message: result.message,
      preview: [],
    });
  } catch (err) {
    req.log.error({ err }, "Error parsing PDF");
    const message = err instanceof Error ? err.message : "Error al procesar el PDF.";
    res.status(400).json({ error: message });
  }
});

router.get("/admin/settings", async (_req, res): Promise<void> => {
  let [settings] = await db.select().from(settingsTable).limit(1);

  if (!settings) {
    [settings] = await db.insert(settingsTable).values({}).returning();
  }

  res.json(settings);
});

router.patch("/admin/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let [existing] = await db.select().from(settingsTable).limit(1);

  if (!existing) {
    [existing] = await db.insert(settingsTable).values({}).returning();
  }

  const [updated] = await db
    .update(settingsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(settingsTable.id, existing.id))
    .returning();

  res.json(updated);
});

export default router;
