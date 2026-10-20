"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MOTIVOS_VALIDOS = [
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

function volver(mensaje: string, tipo: "success" | "error"): never {
  const params = new URLSearchParams({ mensaje, tipo });
  redirect(`/ausencias?${params.toString()}`);
}

function convertirFecha(fecha: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;

  const [año, mes, dia] = fecha.split("-").map(Number);
  const resultado = new Date(año, mes - 1, dia);

  if (
    resultado.getFullYear() !== año ||
    resultado.getMonth() !== mes - 1 ||
    resultado.getDate() !== dia
  ) {
    return null;
  }

  return resultado;
}

export async function crearAusencia(formData: FormData) {
  const profesionalId = Number(formData.get("profesionalId"));
  const fechaInicioTexto = String(formData.get("fechaInicio") ?? "");
  const fechaFinTexto = String(formData.get("fechaFin") ?? "");
  const motivo = String(formData.get("motivo") ?? "");

  if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
    volver("Selecciona un profesional válido.", "error");
  }

  if (!MOTIVOS_VALIDOS.includes(motivo)) {
    volver("Selecciona un motivo válido.", "error");
  }

  const fechaInicio = convertirFecha(fechaInicioTexto);
  const fechaFin = convertirFecha(fechaFinTexto);

  if (!fechaInicio || !fechaFin) {
    volver("Introduce fechas válidas.", "error");
  }

  if (fechaFin < fechaInicio) {
    volver("La fecha final no puede ser anterior a la inicial.", "error");
  }

  const profesional = await prisma.profesional.findUnique({
    where: { id: profesionalId },
  });

  if (!profesional || !profesional.activo) {
    volver("El profesional no existe o está inactivo.", "error");
  }

  try {
    await prisma.ausencia.create({
      data: {
        profesionalId,
        fechaInicio,
        fechaFin,
        motivo,
      },
    });
  } catch {
    volver("No se pudo guardar la ausencia. Inténtalo nuevamente.", "error");
  }

  revalidatePath("/ausencias");
  revalidatePath("/calendario");

  volver("Ausencia registrada correctamente.", "success");
}