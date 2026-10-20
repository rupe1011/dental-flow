
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function irAlCalendario(
  fecha: string,
  tipo: "success" | "error",
  mensaje: string
): never {
  const params = new URLSearchParams({
    fecha,
    tipo,
    mensaje,
  });

  redirect(`/calendario?${params.toString()}`);
}

function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado. Inténtalo nuevamente.";
}

function convertirHoraAMinutos(hora: string): number | null {
  const coincidencia = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);

  if (!coincidencia) return null;

  return Number(coincidencia[1]) * 60 + Number(coincidencia[2]);
}

function seSolapan(
  inicioA: string,
  finA: string,
  inicioB: string,
  finB: string
): boolean {
  const aInicio = convertirHoraAMinutos(inicioA);
  const aFin = convertirHoraAMinutos(finA);
  const bInicio = convertirHoraAMinutos(inicioB);
  const bFin = convertirHoraAMinutos(finB);

  // Ante horarios inválidos, no asumimos que existe disponibilidad.
  if (
    aInicio === null ||
    aFin === null ||
    bInicio === null ||
    bFin === null ||
    aFin <= aInicio ||
    bFin <= bInicio
  ) {
    return true;
  }

  return aInicio < bFin && bInicio < aFin;
}

function obtenerFechaLocal(fecha: Date): string {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${año}-${mes}-${dia}`;
}

async function validarCandidato(
  actividadId: number,
  profesionalAusenteId: number,
  profesionalReemplazoId: number
) {
  if (
    !Number.isInteger(actividadId) ||
    actividadId <= 0 ||
    !Number.isInteger(profesionalAusenteId) ||
    profesionalAusenteId <= 0 ||
    !Number.isInteger(profesionalReemplazoId) ||
    profesionalReemplazoId <= 0
  ) {
    throw new Error("Los datos del reemplazo no son válidos.");
  }

  if (profesionalAusenteId === profesionalReemplazoId) {
    throw new Error(
      "El profesional ausente no puede reemplazarse a sí mismo."
    );
  }

  const [actividad, ausente, candidato] = await Promise.all([
    prisma.actividad.findUnique({
      where: { id: actividadId },
    }),
    prisma.profesional.findUnique({
      where: { id: profesionalAusenteId },
      include: { ausencias: true },
    }),
    prisma.profesional.findUnique({
      where: { id: profesionalReemplazoId },
      include: {
        horarios: {
          include: { periodo: true },
        },
        ausencias: true,
        restricciones: true,
      },
    }),
  ]);

  if (!actividad || !ausente || !candidato) {
    throw new Error("No se encontraron todos los datos necesarios.");
  }

  if (actividad.profesionalId !== profesionalAusenteId) {
    throw new Error(
      "La actividad no corresponde al profesional ausente indicado."
    );
  }

  const fecha = obtenerFechaLocal(actividad.fecha);

  const ausenteRegistrado = ausente.ausencias.some((item) => {
    const inicio = obtenerFechaLocal(item.fechaInicio);
    const fin = obtenerFechaLocal(item.fechaFin);

    return fecha >= inicio && fecha <= fin;
  });

  if (!ausenteRegistrado) {
    throw new Error(
      "No hay una ausencia registrada para ese profesional en esta fecha."
    );
  }

  if (!candidato.activo) {
    throw new Error("El profesional seleccionado está inactivo.");
  }

  const candidatoAusente = candidato.ausencias.some((item) => {
    const inicio = obtenerFechaLocal(item.fechaInicio);
    const fin = obtenerFechaLocal(item.fechaFin);

    return fecha >= inicio && fecha <= fin;
  });

  if (candidatoAusente) {
    throw new Error(
      "El profesional seleccionado tiene una ausencia registrada ese día."
    );
  }

  const año = actividad.fecha.getFullYear();
  const mes = actividad.fecha.getMonth() + 1;

  const horario = candidato.horarios.find(
    (item) =>
      item.periodo.año === año &&
      item.periodo.mes === mes
  );

  if (!horario) {
    throw new Error(
      "El profesional no tiene horario registrado para ese periodo."
    );
  }

  const inicioActividad = convertirHoraAMinutos(actividad.horaInicio);
  const finActividad = convertirHoraAMinutos(actividad.horaFin);
  const entradaCandidato = convertirHoraAMinutos(horario.entrada);
  const salidaCandidato = convertirHoraAMinutos(horario.salida);

  if (
    inicioActividad === null ||
    finActividad === null ||
    entradaCandidato === null ||
    salidaCandidato === null ||
    finActividad <= inicioActividad ||
    salidaCandidato <= entradaCandidato
  ) {
    throw new Error(
      "La actividad o el horario contiene horas no válidas."
    );
  }

  if (
    entradaCandidato > inicioActividad ||
    salidaCandidato < finActividad
  ) {
    throw new Error(
      "El horario del profesional no cubre toda la actividad."
    );
  }

  if (actividad.lugar) {
    const restricciones = candidato.restricciones.filter(
      (item) =>
        item.activo &&
        item.tipo === "LUGAR" &&
        item.valor === actividad.lugar
    );

    if (
      restricciones.length > 0 &&
      !restricciones.some((item) => item.permite)
    ) {
      throw new Error(
        "El profesional tiene una restricción para esa ubicación."
      );
    }
  }

  // Validar conflictos con otras actividades habituales del candidato.
  // Se excluye la actividad que necesita cobertura.
  const inicioDia = new Date(`${fecha}T00:00:00`);
  const finDia = new Date(`${fecha}T23:59:59.999`);

  const actividadesExistentes = await prisma.actividad.findMany({
    where: {
      profesionalId: profesionalReemplazoId,
      id: { not: actividadId },
      fecha: {
        gte: inicioDia,
        lte: finDia,
      },
    },
  });

  const actividadEnConflicto = actividadesExistentes.some((existente) =>
    seSolapan(
      actividad.horaInicio,
      actividad.horaFin,
      existente.horaInicio,
      existente.horaFin
    )
  );

  if (actividadEnConflicto) {
    throw new Error(
      "El profesional ya tiene una actividad asignada que se solapa con este horario."
    );
  }

  // Validar conflictos con otros reemplazos confirmados.
  const otrosReemplazos = await prisma.reemplazo.findMany({
    where: {
      profesionalReemplazoId,
      estado: "CONFIRMADO",
      actividadId: {
        not: actividadId,
      },
    },
    include: {
      actividad: true,
    },
  });

  const reemplazoEnConflicto = otrosReemplazos.some((reemplazo) => {
    const actividadReemplazo = reemplazo.actividad;

    if (obtenerFechaLocal(actividadReemplazo.fecha) !== fecha) {
      return false;
    }

    return seSolapan(
      actividad.horaInicio,
      actividad.horaFin,
      actividadReemplazo.horaInicio,
      actividadReemplazo.horaFin
    );
  });

  if (reemplazoEnConflicto) {
    throw new Error(
      "El profesional ya tiene otra cobertura confirmada que coincide en horario."
    );
  }

  return actividad;
}

export async function confirmarReemplazo(
  actividadId: number,
  profesionalAusenteId: number,
  profesionalReemplazoId: number,
  formData?: FormData
) {
  let fecha = String(formData?.get("fecha") ?? "2026-10-06");

  try {
    const actividad = await validarCandidato(
      actividadId,
      profesionalAusenteId,
      profesionalReemplazoId
    );

    fecha = obtenerFechaLocal(actividad.fecha);

    const existente = await prisma.reemplazo.findUnique({
      where: { actividadId },
    });

    if (existente) {
      throw new Error(
        "Esta actividad ya tiene un reemplazo confirmado."
      );
    }

    await prisma.reemplazo.create({
      data: {
        actividadId,
        profesionalAusenteId,
        profesionalReemplazoId,
        estado: "CONFIRMADO",
      },
    });
  } catch (error) {
    revalidatePath("/calendario");
    irAlCalendario(fecha, "error", obtenerMensajeError(error));
  }

  revalidatePath("/calendario");
  irAlCalendario(
    fecha,
    "success",
    "El reemplazo se confirmó correctamente."
  );
}

export async function cambiarReemplazo(formData: FormData) {
  let fecha = String(formData.get("fecha") ?? "2026-10-06");

  try {
    const actividadId = Number(formData.get("actividadId"));
    const profesionalAusenteId = Number(
      formData.get("profesionalAusenteId")
    );
    const profesionalReemplazoId = Number(
      formData.get("profesionalReemplazoId")
    );

    const actividad = await validarCandidato(
      actividadId,
      profesionalAusenteId,
      profesionalReemplazoId
    );

    fecha = obtenerFechaLocal(actividad.fecha);

    const existente = await prisma.reemplazo.findUnique({
      where: { actividadId },
    });

    if (!existente) {
      throw new Error(
        "Esta actividad no tiene un reemplazo que cambiar."
      );
    }

    await prisma.reemplazo.update({
      where: { actividadId },
      data: {
        profesionalAusenteId,
        profesionalReemplazoId,
        estado: "CONFIRMADO",
        fechaConfirmacion: new Date(),
      },
    });
  } catch (error) {
    revalidatePath("/calendario");
    irAlCalendario(fecha, "error", obtenerMensajeError(error));
  }

  revalidatePath("/calendario");
  irAlCalendario(
    fecha,
    "success",
    "El reemplazo se cambió correctamente."
  );
}

export async function cancelarReemplazo(formData: FormData) {
  let fecha = String(formData.get("fecha") ?? "2026-10-06");

  try {
    const actividadId = Number(formData.get("actividadId"));

    if (!Number.isInteger(actividadId) || actividadId <= 0) {
      throw new Error("El identificador de la actividad no es válido.");
    }

    const existente = await prisma.reemplazo.findUnique({
      where: { actividadId },
      include: { actividad: true },
    });

    if (!existente) {
      throw new Error(
        "Esta actividad no tiene un reemplazo que cancelar."
      );
    }

    fecha = obtenerFechaLocal(existente.actividad.fecha);

    await prisma.reemplazo.delete({
      where: { actividadId },
    });
  } catch (error) {
    revalidatePath("/calendario");
    irAlCalendario(fecha, "error", obtenerMensajeError(error));
  }

  revalidatePath("/calendario");
  irAlCalendario(
    fecha,
    "success",
    "El reemplazo se canceló. La cobertura debe revisarse nuevamente."
  );
}
