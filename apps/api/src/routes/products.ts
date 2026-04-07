import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/**
 * Lista categorias ativas com produtos ativos (cardápio público).
 */
router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        products: {
          where: { active: true },
          orderBy: { name: "asc" },
        },
      },
    });

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      products: c.products.map((p) => ({
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        imageUrl: p.imageUrl,
      })),
    }));

    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;
