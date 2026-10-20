import { prisma } from "@/lib/prisma";

export default async function ProfesionalesPage() {
  const profesionales = await prisma.profesional.findMany({
    orderBy: {
      nombre: "asc",
    },
    include: {
      horarios: {
        include: {
          periodo: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Profesionales
        </h1>

        <p className="mt-2 text-gray-600">
          Personal y horarios registrados en DentalFlow.
        </p>
      </header>

      <section className="space-y-4">
        {profesionales.map((profesional) => (
          <div
            key={profesional.id}
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {profesional.nombre}
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              {profesional.tipo} · Sector {profesional.sector}
            </p>

            {profesional.horarios.map((horario) => (
              <p
                key={horario.id}
                className="mt-2 text-sm text-gray-500"
              >
                Periodo: {horario.periodo.mes}/{horario.periodo.año} ·{" "}
                {horario.entrada} - {horario.salida}
              </p>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}