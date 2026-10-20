import { prisma } from "@/lib/prisma";
import { crearAusencia } from "./actions";

type AusenciasPageProps = {
  searchParams: Promise<{
    mensaje?: string;
    tipo?: string;
  }>;
};

const motivos = [
  "Licencia Médica",
  "Feriado Legal",
  "Permiso Administrativo",
  "Permiso Administrativo (mañana)",
  "Permiso Administrativo (tarde)",
  "Permiso de Capacitación",
  "Permiso Compensatorio",
  "Descanso Reparatorio",
  "Otro",
];

function obtenerFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function obtenerHoy(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

export default async function AusenciasPage({
  searchParams,
}: AusenciasPageProps) {
  const params = await searchParams;

  const [profesionales, ausencias] = await Promise.all([
    prisma.profesional.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.ausencia.findMany({
      include: {
        profesional: true,
      },
      orderBy: [{ fechaInicio: "desc" }, { id: "desc" }],
    }),
  ]);

  const hoy = obtenerHoy();

  const tipoMensaje =
    params.tipo === "success" || params.tipo === "error"
      ? params.tipo
      : null;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Ausencias
        </h1>

        <p className="mt-2 text-gray-600">
          Registra y consulta las ausencias del personal.
        </p>
      </header>

      {params.mensaje && tipoMensaje && (
        <div
          role="status"
          className={`mb-6 rounded-lg border p-4 text-sm ${
            tipoMensaje === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {params.mensaje}
        </div>
      )}

      <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold text-gray-900">
          Registrar ausencia
        </h2>

        {profesionales.length === 0 ? (
          <p className="text-sm text-gray-600">
            No hay profesionales activos para registrar una ausencia.
          </p>
        ) : (
          <form action={crearAusencia} className="space-y-5">
            <div>
              <label
                htmlFor="profesionalId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Profesional
              </label>

              <select
                id="profesionalId"
                name="profesionalId"
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="" disabled>
                  Selecciona un profesional
                </option>

                {profesionales.map((profesional) => (
                  <option key={profesional.id} value={profesional.id}>
                    {profesional.nombre} — {profesional.tipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="fechaInicio"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Fecha de inicio
                </label>

                <input
                  id="fechaInicio"
                  name="fechaInicio"
                  type="date"
                  defaultValue={hoy}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="fechaFin"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Fecha de término
                </label>

                <input
                  id="fechaFin"
                  name="fechaFin"
                  type="date"
                  defaultValue={hoy}
                  min={hoy}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="motivo"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Motivo
              </label>

              <select
                id="motivo"
                name="motivo"
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="" disabled>
                  Selecciona un motivo
                </option>

                {motivos.map((motivo) => (
                  <option key={motivo} value={motivo}>
                    {motivo}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Registrar ausencia
            </button>
          </form>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Ausencias registradas
          </h2>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            {ausencias.length} registros
          </span>
        </div>

        {ausencias.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-500">
            Todavía no hay ausencias registradas.
          </p>
        ) : (
          <div className="space-y-3">
            {ausencias.map((ausencia) => (
              <article
                key={ausencia.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {ausencia.profesional.nombre}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      {ausencia.profesional.tipo}
                    </p>

                    <p className="mt-2 text-sm text-gray-700">
                      {obtenerFecha(ausencia.fechaInicio)}
                      {obtenerFecha(ausencia.fechaInicio) !==
                        obtenerFecha(ausencia.fechaFin) &&
                        ` al ${obtenerFecha(ausencia.fechaFin)}`}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                    {ausencia.motivo}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}