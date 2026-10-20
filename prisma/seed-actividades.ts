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

  const tatiana = await prisma.profesional.findUnique({
    where: {
      nombre: "Tatiana Vudvud",
    },
  });

  const solange = await prisma.profesional.findUnique({
    where: {
      nombre: "Solange Fre",
    },
  });

  if (!tatiana || !solange) {
    throw new Error("No se encontraron los profesionales");
  }

  await prisma.actividad.createMany({
    data: [
      {
        periodoId: periodo.id,
        profesionalId: tatiana.id,
        fecha: new Date("2026-10-06T08:00:00"),
        horaInicio: "08:00",
        horaFin: "09:00",
        nombre: "CONTROL NIÑO",
      },
      {
        periodoId: periodo.id,
        profesionalId: tatiana.id,
        fecha: new Date("2026-10-06T09:00:00"),
        horaInicio: "09:00",
        horaFin: "10:00",
        nombre: "URGENCIAS",
      },
      {
        periodoId: periodo.id,
        profesionalId: solange.id,
        fecha: new Date("2026-10-06T08:30:00"),
        horaInicio: "08:30",
        horaFin: "09:30",
        nombre: "BAJO CONTROL",
      },
      {
        periodoId: periodo.id,
        profesionalId: solange.id,
        fecha: new Date("2026-10-06T10:00:00"),
        horaInicio: "10:00",
        horaFin: "11:00",
        nombre: "URGENCIAS",
      },
    ],
  });

  console.log("Actividades de prueba creadas.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });