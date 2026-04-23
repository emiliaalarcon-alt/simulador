import { Router, type IRouter } from "express";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import { db, carrerasTable } from "@workspace/db";
import {
  ListCarrerasQueryParams,
  GetCarreraParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/carreras", async (req, res): Promise<void> => {
  const query = ListCarrerasQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { region, universidad, area, search } = query.data;

  const conditions = [eq(carrerasTable.publicado, true)];

  if (region) conditions.push(eq(carrerasTable.region, region));
  if (universidad) conditions.push(eq(carrerasTable.universidad, universidad));
  if (area) conditions.push(eq(carrerasTable.area, area));
  if (search) {
    conditions.push(
      or(
        ilike(carrerasTable.nombre, `%${search}%`),
        ilike(carrerasTable.universidad, `%${search}%`)
      )!
    );
  }

  const carreras = await db
    .select()
    .from(carrerasTable)
    .where(and(...conditions))
    .orderBy(carrerasTable.nombre);

  res.json(carreras);
});

router.get("/carreras/filters", async (_req, res): Promise<void> => {
  const result = await db
    .select({
      region: carrerasTable.region,
      universidad: carrerasTable.universidad,
      area: carrerasTable.area,
    })
    .from(carrerasTable)
    .where(eq(carrerasTable.publicado, true));

  const regiones = [...new Set(result.map((r) => r.region))].sort();
  const universidades = [...new Set(result.map((r) => r.universidad))].sort();
  const areas = [...new Set(result.map((r) => r.area))].sort();

  res.json({ regiones, universidades, areas });
});

router.get("/carreras/stats", async (_req, res): Promise<void> => {
  const all = await db
    .select({
      region: carrerasTable.region,
      universidad: carrerasTable.universidad,
      area: carrerasTable.area,
    })
    .from(carrerasTable)
    .where(eq(carrerasTable.publicado, true));

  const totalCarreras = all.length;
  const totalUniversidades = new Set(all.map((r) => r.universidad)).size;
  const totalRegiones = new Set(all.map((r) => r.region)).size;
  const totalAreas = new Set(all.map((r) => r.area)).size;

  const areaMap = new Map<string, number>();
  for (const r of all) {
    areaMap.set(r.area, (areaMap.get(r.area) || 0) + 1);
  }
  const carrerasPorArea = Array.from(areaMap.entries())
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  res.json({ totalCarreras, totalUniversidades, totalRegiones, totalAreas, carrerasPorArea });
});

router.get("/carreras/:id", async (req, res): Promise<void> => {
  const params = GetCarreraParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [carrera] = await db
    .select()
    .from(carrerasTable)
    .where(and(eq(carrerasTable.id, params.data.id), eq(carrerasTable.publicado, true)));

  if (!carrera) {
    res.status(404).json({ error: "Carrera no encontrada" });
    return;
  }

  res.json(carrera);
});

export default router;
