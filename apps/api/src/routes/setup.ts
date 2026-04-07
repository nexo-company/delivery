import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { seedDemoCatalog } from "../services/catalog-seed.js";

const router = Router();

function keyOk(req: { query: unknown; body?: unknown; headers: Record<string, unknown> }): boolean {
  const expected = process.env.SETUP_KEY;
  if (!expected) return false;
  const q = req.query as Record<string, string | undefined>;
  const fromQuery = typeof q?.key === "string" ? q.key : "";
  const fromBody =
    req.body && typeof req.body === "object" && req.body !== null && "key" in req.body
      ? String((req.body as { key?: string }).key ?? "")
      : "";
  const fromHeader = String(req.headers["x-setup-key"] ?? "");
  const key = fromQuery || fromBody || fromHeader;
  return key === expected;
}

/**
 * Popular banco na nuvem sem CLI.
 * Railway → Variables: SETUP_KEY=uma-senha-forte
 * Depois abra UMA vez no navegador:
 *   GET https://SUA-API.up.railway.app/setup/seed?key=uma-senha-forte
 * Remove SETUP_KEY depois se quiser.
 */
router.get("/seed", async (req, res) => {
  if (!keyOk(req)) {
    res.status(404).send("Not found");
    return;
  }
  try {
    await seedDemoCatalog(prisma);
    res
      .type("html")
      .send(
        "<!DOCTYPE html><html><body style=font-family:sans-serif><h1>Cardápio criado</h1><p>Pode fechar e atualizar o site.</p></body></html>",
      );
  } catch (e) {
    console.error(e);
    res.status(500).send("Erro ao rodar seed");
  }
});

router.post("/seed", async (req, res) => {
  if (!keyOk(req)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    await seedDemoCatalog(prisma);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Seed failed" });
  }
});

export default router;
