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
  const profesional = await prisma.profesional.findFirst({
    where: {
      nombre: "Solange Fre",
    },
  });

  if (!profesional) {
    throw new Error("Solange Fre no existe");
  }

  await prisma.ausencia.create({
    data: {
      profesionalId: profesional.id,
      fechaInicio: new Date("2026-10-06"),
      fechaFin: new Date("2026-10-06"),
      motivo: "Licencia Médica",
    },
  });

  console.log("Ausencia creada.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });