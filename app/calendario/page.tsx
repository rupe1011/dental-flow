
import { prisma } from "@/lib/prisma";
import { obtenerDiasDelMes } from "@/lib/calendario";
import { buscarCandidatosCobertura } from "@/lib/cobertura";
import { confirmarReemplazo } from "./actions";
import AccionesReemplazo from "./acciones-reemplazo";
import ResultadoAccion from "./resultado-accion";

type CalendarioPageProps = {
  searchParams: Promise<{
    fecha?: string;
    tipo?: string;
    mensaje?: string;
  }>;
};

export default async function CalendarioPage({
  searchParams,
}: CalendarioPageProps) {
  const params = await searchParams;
  const fechaSeleccionada = params.fecha ?? "2026-10-06";

  const fecha = new Date(`${fechaSeleccionada}T00:00:00`);

  const año = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;

  const dias = obtenerDiasDelMes(año, mes);
  const primerDia = new Date(año, mes - 1, 1);
  const diaSemanaInicio = (primerDia.getDay() + 6) % 7;

  const fechaAnterior = new Date(año, mes - 2, 1);
  const fechaSiguiente = new Date(año, mes, 1);

  const fechaAnteriorTexto = `${fechaAnterior.getFullYear()}-${String(
    fechaAnterior.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const fechaSiguienteTexto = `${fechaSiguiente.getFullYear()}-${String(
    fechaSiguiente.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const nombreMes = new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
  }).format(fecha);

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
      ausencias: true,
      restricciones: true,
      responsabilidades: true,
    },
  });

  const inicioDia = new Date(`${fechaSeleccionada}T00:00:00`);
  const finDia = new Date(`${fechaSeleccionada}T23:59:59.999`);

  const actividades = await prisma.actividad.findMany({
    where: {
      fecha: {
        gte: inicioDia,
        lte: finDia,
      },
    },
    orderBy: {
      horaInicio: "asc",
    },
  });


  const reemplazos = await prisma.reemplazo.findMany({
    where: {
      actividadId: {
        in: actividades.map((actividad) => actividad.id),
      },
    },
    include: {
      actividad: true,
    },
  });


  const tipoResultado =
    params.tipo === "success" || params.tipo === "error"
      ? params.tipo
      : undefined;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Calendario
        </h1>

        <p className="mt-2 text-gray-600">
          Revisa la planificación y cobertura del personal.
        </p>
      </header>

      <ResultadoAccion
        tipo={tipoResultado}
        mensaje={params.mensaje}
      />

      <section className="mb-6 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <a
          href={`/calendario?fecha=${fechaAnteriorTexto}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Mes anterior
        </a>

        <h2 className="text-xl font-semibold capitalize text-gray-900">
          {nombreMes}
        </h2>

        <a
          href={`/calendario?fecha=${fechaSiguienteTexto}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Mes siguiente →
        </a>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-7 gap-2">
          {[
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
            "Domingo",
          ].map((dia) => (
            <div
              key={dia}
              className="p-2 text-center text-sm font-semibold text-gray-500"
            >
              {dia}
            </div>
          ))}

          {Array.from({ length: diaSemanaInicio }).map((_, index) => (
            <div key={`vacio-${index}`} />
          ))}

          {dias.map((dia) => (
            <a
              key={dia.fecha}
              href={`/calendario?fecha=${dia.fecha}`}
              className={`min-h-24 rounded-lg border p-3 transition hover:shadow-sm ${
                dia.fecha === fechaSeleccionada
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <p className="text-lg font-semibold text-gray-900">
                {dia.dia}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {dia.fecha}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Planificación del {fechaSeleccionada}
        </h2>

        <div className="mt-6 space-y-4">
          {profesionales.map((profesional) => {
            const ausencia = profesional.ausencias.find((item) => {
              const inicio = item.fechaInicio.toISOString().slice(0, 10);
              const fin = item.fechaFin.toISOString().slice(0, 10);

              return (
                fechaSeleccionada >= inicio &&
                fechaSeleccionada <= fin
              );
            });

            const horario = profesional.horarios.find(
              (item) =>
                item.periodo.año === año &&
                item.periodo.mes === mes
            );

            const actividadesProfesional = actividades.filter(
              (actividad) =>
                actividad.profesionalId === profesional.id
            );

            return (
              <div
                key={profesional.id}
                className={`rounded-xl border p-5 ${
                  ausencia && actividadesProfesional.length > 0
                    ? "border-red-200 bg-red-50"
                    : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {profesional.nombre}
                    </p>

                    <p className="text-sm text-gray-500">
                      {profesional.tipo} · Sector{" "}
                      {profesional.sector ?? "Sin sector"}
                    </p>

                    {horario && (
                      <p className="mt-1 text-sm text-gray-500">
                        Horario: {horario.entrada} - {horario.salida}
                      </p>
                    )}
                  </div>

                  <span
                    className={
                      ausencia
                        ? "text-sm font-semibold text-red-600"
                        : "text-sm font-semibold text-green-600"
                    }
                  >
                    {ausencia ? "No disponible" : "Disponible"}
                  </span>
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="mb-3 text-sm font-semibold text-gray-700">
                    Actividades
                  </p>

                  {actividadesProfesional.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      Sin actividades registradas.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {actividadesProfesional.map((actividad) => {
                        const reemplazo = reemplazos.find(
                          (item) => item.actividadId === actividad.id
                        );


                      const candidatos = ausencia
                        ? buscarCandidatosCobertura(
                            profesional,
                            actividad,
                            profesionales,
                            año,
                            mes,
                            fechaSeleccionada,
                            reemplazos,
                            actividades
                          )
                        : [];


                        const candidatosGestion = candidatos.map(
                          ({ profesional: candidato }) => ({
                            id: candidato.id,
                            nombre: candidato.nombre,
                          })
                        );

                        if (reemplazo) {
                          const actual = profesionales.find(
                            (item) =>
                              item.id ===
                              reemplazo.profesionalReemplazoId
                          );

                          if (
                            actual &&
                            !candidatosGestion.some(
                              (item) => item.id === actual.id
                            )
                          ) {
                            candidatosGestion.push({
                              id: actual.id,
                              nombre: actual.nombre,
                            });
                          }
                        }

                        return (
                          <div
                            key={actividad.id}
                            className="rounded-lg bg-white p-3"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">
                                  {actividad.horaInicio} - {actividad.horaFin}
                                </span>

                                <span className="text-sm text-gray-600">
                                  {actividad.nombre}
                                </span>
                              </div>

                              {reemplazo && (
                                <span className="text-xs font-semibold text-green-600">
                                  ✓ Cubierta
                                </span>
                              )}
                            </div>

                            {ausencia && !reemplazo && (
                              <div className="mt-3 border-t pt-3">
                                <p className="text-sm font-semibold text-gray-700">
                                  Posibles reemplazos
                                </p>

                                {candidatos.length === 0 ? (
                                  <p className="mt-2 text-sm text-red-600">
                                    No se encontraron candidatos compatibles.
                                  </p>
                                ) : (
                                  <div className="mt-2 space-y-2">
                                    {candidatos.map(
                                      ({
                                        profesional: candidato,
                                        mismoSector,
                                      }) => (
                                        <div
                                          key={candidato.id}
                                          className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                                        >
                                          <div>
                                            <p className="text-sm font-medium text-gray-800">
                                              {candidato.nombre}
                                            </p>

                                            <p className="text-xs text-gray-500">
                                              Sector{" "}
                                              {candidato.sector ?? "Sin sector"}
                                            </p>
                                          </div>

                                          <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-gray-600">
                                              {mismoSector
                                                ? "Mismo sector"
                                                : "Otro sector"}
                                            </span>

                                            <form
                                              action={confirmarReemplazo.bind(
                                                null,
                                                actividad.id,
                                                profesional.id,
                                                candidato.id
                                              )}
                                            >
                                              <input
                                                type="hidden"
                                                name="fecha"
                                                value={fechaSeleccionada}
                                              />

                                              <button
                                                type="submit"
                                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                              >
                                                Confirmar
                                              </button>
                                            </form>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {reemplazo && (
                              <AccionesReemplazo
                                actividadId={actividad.id}
                                profesionalAusenteId={profesional.id}
                                profesionalReemplazoId={
                                  reemplazo.profesionalReemplazoId
                                }
                                nombreReemplazo={
                                  profesionales.find(
                                    (item) =>
                                      item.id ===
                                      reemplazo.profesionalReemplazoId
                                  )?.nombre ?? "Profesional no encontrado"
                                }
                                candidatos={candidatosGestion}
                                fecha={fechaSeleccionada}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {ausencia && actividadesProfesional.length > 0 && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-white p-4">
                    <p className="font-semibold text-red-700">
                      ⚠️ Impacto de ausencia
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Esta ausencia afecta{" "}
                      <strong>{actividadesProfesional.length}</strong>{" "}
                      actividad
                      {actividadesProfesional.length !== 1 ? "es" : ""}{" "}
                      programada
                      {actividadesProfesional.length !== 1 ? "s" : ""}.
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      Se requiere revisar cobertura.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
