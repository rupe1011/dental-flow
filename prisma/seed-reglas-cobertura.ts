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
  const camila = await prisma.profesional.findUnique({
    where: {
      nombre: "Camila Báez",
    },
  });

  const yoselin = await prisma.profesional.findUnique({
    where: {
      nombre: "Yoselin Rodríguez",
    },
  });

  const tatiana = await prisma.profesional.findUnique({
    where: {
      nombre: "Tatiana Vudvud",
    },
  });

  if (!camila || !yoselin || !tatiana) {
    throw new Error(
      "No se encontraron los profesionales necesarios"
    );
  }

  await prisma.restriccionCobertura.createMany({
    data: [
      {
        profesionalId: camila.id,
        tipo: "LUGAR",
        valor: "Los Loros",
        permite: true,
      },
      {
        profesionalId: yoselin.id,
        tipo: "LUGAR",
        valor: "Los Loros",
        permite: false,
      },
    ],
  });

  await prisma.responsabilidad.create({
    data: {
      profesionalId: tatiana.id,
      nombre: "Bodega de insumos dentales",
      frecuencia: "Semanal",
    },
  });

  console.log("Reglas especiales creadas.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
