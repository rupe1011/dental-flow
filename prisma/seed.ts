import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.profesional.createMany({
    data: [
      {
        nombre: "Tatiana Vudvud",
        tipo: "TENS",
        sector: "Rojo",
      },
      {
        nombre: "Solange Fre",
        tipo: "TENS",
        sector: "Rojo",
      },
      {
        nombre: "Yoselin Oliva",
        tipo: "TENS",
        sector: "Verde",
      },
    ],
  });

  console.log("Profesionales creados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });