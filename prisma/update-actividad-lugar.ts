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
  const resultado = await prisma.actividad.updateMany({
    where: {
      nombre: "BAJO CONTROL",
      fecha: {
        gte: new Date("2026-10-06T00:00:00"),
        lte: new Date("2026-10-06T23:59:59"),
      },
    },
    data: {
      lugar: "Los Loros",
    },
  });

  console.log(
    `Actividades actualizadas: ${resultado.count}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
