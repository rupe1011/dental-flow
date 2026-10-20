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
  const periodo = await prisma.periodo.findUnique({
    where: {
      año_mes: {
        año: 2026,
        mes: 10,
      },
    },
  });

  if (!periodo) {
    throw new Error("El periodo octubre 2026 no existe");
  }

  const horarios = [
    {
      nombre: "Tatiana Vudvud",
      entrada: "08:00",
      salida: "17:00",
    },
    {
      nombre: "Solange Fre",
      entrada: "08:30",
      salida: "17:30",
    },
    {
      nombre: "Yoselin Oliva",
      entrada: "08:00",
      salida: "17:00",
    },
  ];

  for (const horario of horarios) {
    const profesional = await prisma.profesional.findUnique({
      where: {
        nombre: horario.nombre,
      },
    });

    if (!profesional) {
      throw new Error(
        `Profesional no encontrado: ${horario.nombre}`
      );
    }

    await prisma.horario.upsert({
      where: {
        profesionalId_periodoId: {
          profesionalId: profesional.id,
          periodoId: periodo.id,
        },
      },
      update: {
        entrada: horario.entrada,
        salida: horario.salida,
      },
      create: {
        profesionalId: profesional.id,
        periodoId: periodo.id,
        entrada: horario.entrada,
        salida: horario.salida,
      },
    });
  }

  console.log("Horarios de octubre 2026 creados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });