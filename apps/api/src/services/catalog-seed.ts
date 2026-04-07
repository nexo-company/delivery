import type { PrismaClient } from "@prisma/client";

/** Mesmo cardápio do `prisma/seed.ts` — usado também pela rota /setup (Railway). */
export async function seedDemoCatalog(prisma: PrismaClient): Promise<void> {
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const lanches = await prisma.category.create({
    data: { name: "Lanches", active: true },
  });
  const bebidas = await prisma.category.create({
    data: { name: "Bebidas", active: true },
  });
  const acomp = await prisma.category.create({
    data: { name: "Acompanhamentos", active: true },
  });

  await prisma.product.createMany({
    data: [
      {
        categoryId: lanches.id,
        name: "X-Burger",
        description: "Hambúrguer, queijo, alface, tomate e molho especial",
        price: 22.9,
        active: true,
      },
      {
        categoryId: lanches.id,
        name: "X-Bacon",
        description: "Hambúrguer duplo com bacon crocante",
        price: 28.9,
        active: true,
      },
      {
        categoryId: bebidas.id,
        name: "Coca-Cola 2L",
        description: "Refrigerante gelado",
        price: 12,
        active: true,
      },
      {
        categoryId: bebidas.id,
        name: "Suco Natural Laranja 500ml",
        description: "",
        price: 9.5,
        active: true,
      },
      {
        categoryId: acomp.id,
        name: "Batata frita média",
        description: "Porção 300g",
        price: 14.9,
        active: true,
      },
    ],
  });
}
