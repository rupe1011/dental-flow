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
  const profesionales = [
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
    {
      nombre: "Yoselin Rodríguez",
      tipo: "TENS",
      sector: "Verde",
    },
    {
      nombre: "Camila Báez",
      tipo: "TENS",
      sector: "Amarillo",
    },
    {
      nombre: "Patricia Rodríguez",
      tipo: "TENS",
      sector: null,
    },
  ];

  for (const profesional of profesionales) {
    await prisma.profesional.upsert({
      where: {
        nombre: profesional.nombre,
      },
      update: {
        tipo: profesional.tipo,
        sector: profesional.sector,
      },
      create: profesional,
    });
  }

  console.log("Profesionales completos creados/actualizados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });