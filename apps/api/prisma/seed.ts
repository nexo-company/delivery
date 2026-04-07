import { PrismaClient } from "@prisma/client";
import { seedDemoCatalog } from "../src/services/catalog-seed.js";

const prisma = new PrismaClient();

async function main() {
  await seedDemoCatalog(prisma);
  console.log("Seed concluído: categorias e produtos de exemplo.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
