import { Router, type IRouter } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import { generateToken } from "../middlewares/authMiddleware";

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "paes2025admin";

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  if (parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Contraseña incorrecta" });
    return;
  }

  const token = generateToken();
  res.json({ token, expiresIn: 28800 });
});

export default router;
