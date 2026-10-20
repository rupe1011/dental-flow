
import type { Profesional, Horario } from "@prisma/client";

type Restriccion = {
  tipo: string;
  valor: string;
  permite: boolean;
  activo: boolean;
};

type Responsabilidad = {
  nombre: string;
  frecuencia: string | null;
  activo: boolean;
};

type ProfesionalConDatos = Profesional & {
  horarios: (Horario & {
    periodo: {
      año: number;
      mes: number;
    };
  })[];
  ausencias: {
    fechaInicio: Date;
    fechaFin: Date;
  }[];
  restricciones: Restriccion[];
  responsabilidades: Responsabilidad[];
};

type ActividadCobertura = {
  id?: number;
  horaInicio: string;
  horaFin: string;
  lugar?: string | null;
};

type ActividadDelDia = {
  id: number;
  profesionalId: number | null;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
};

type ReemplazoConfirmado = {
  profesionalReemplazoId: number;
  estado: string;
  actividad: {
    id: number;
    fecha: Date;
    horaInicio: string;
    horaFin: string;
  };
};

export type CandidatoCobertura = {
  profesional: ProfesionalConDatos;
  mismoSector: boolean;
  tieneResponsabilidadEspecial: boolean;
  motivos: string[];
};

function convertirHoraAMinutos(hora: string): number | null {
  const coincidencia = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);

  if (!coincidencia) return null;

  return Number(coincidencia[1]) * 60 + Number(coincidencia[2]);
}

function obtenerFecha(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function estaAusenteEseDia(
  profesional: ProfesionalConDatos,
  fecha: string
): boolean {
  return profesional.ausencias.some((ausencia) => {
    const inicio = obtenerFecha(ausencia.fechaInicio);
    const fin = obtenerFecha(ausencia.fechaFin);

    return fecha >= inicio && fecha <= fin;
  });
}

function puedeTrabajarEnLugar(
  profesional: ProfesionalConDatos,
  lugar: string | null | undefined
): boolean {
  if (!lugar) return true;

  const restriccionesLugar = profesional.restricciones.filter(
    (restriccion) =>
      restriccion.activo &&
      restriccion.tipo === "LUGAR" &&
      restriccion.valor === lugar
  );

  if (restriccionesLugar.length === 0) return true;

  return restriccionesLugar.some((restriccion) => restriccion.permite);
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

  // Ante datos horarios inválidos, no asumir que existe disponibilidad.
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

function tieneActividadHabitualSolapada(
  profesionalId: number,
  fecha: string,
  actividad: ActividadCobertura,
  actividades: ActividadDelDia[]
): boolean {
  return actividades.some((existente) => {
    if (existente.profesionalId !== profesionalId) return false;

    // La propia actividad que necesita cobertura no cuenta como conflicto.
    if (actividad.id !== undefined && existente.id === actividad.id) {
      return false;
    }

    if (obtenerFecha(existente.fecha) !== fecha) return false;

    return seSolapan(
      actividad.horaInicio,
      actividad.horaFin,
      existente.horaInicio,
      existente.horaFin
    );
  });
}

function tieneReemplazoSolapado(
  profesionalId: number,
  fecha: string,
  actividad: ActividadCobertura,
  reemplazos: ReemplazoConfirmado[]
): boolean {
  return reemplazos.some((reemplazo) => {
    if (reemplazo.profesionalReemplazoId !== profesionalId) {
      return false;
    }

    if (reemplazo.estado !== "CONFIRMADO") return false;

    if (
      actividad.id !== undefined &&
      reemplazo.actividad.id === actividad.id
    ) {
      return false;
    }

    if (obtenerFecha(reemplazo.actividad.fecha) !== fecha) {
      return false;
    }

    return seSolapan(
      actividad.horaInicio,
      actividad.horaFin,
      reemplazo.actividad.horaInicio,
      reemplazo.actividad.horaFin
    );
  });
}

export function buscarCandidatosCobertura(
  profesionalAusente: ProfesionalConDatos,
  actividad: ActividadCobertura,
  profesionales: ProfesionalConDatos[],
  año: number,
  mes: number,
  fecha: string,
  reemplazosConfirmados: ReemplazoConfirmado[] = [],
  actividadesDelDia: ActividadDelDia[] = []
): CandidatoCobertura[] {
  const inicioActividad = convertirHoraAMinutos(actividad.horaInicio);
  const finActividad = convertirHoraAMinutos(actividad.horaFin);

  if (
    inicioActividad === null ||
    finActividad === null ||
    finActividad <= inicioActividad
  ) {
    return [];
  }

  return profesionales
    .filter((profesional) => {
      if (profesional.id === profesionalAusente.id) return false;
      if (!profesional.activo) return false;
      if (estaAusenteEseDia(profesional, fecha)) return false;

      if (!puedeTrabajarEnLugar(profesional, actividad.lugar)) {
        return false;
      }

      if (
        tieneActividadHabitualSolapada(
          profesional.id,
          fecha,
          actividad,
          actividadesDelDia
        )
      ) {
        return false;
      }

      if (
        tieneReemplazoSolapado(
          profesional.id,
          fecha,
          actividad,
          reemplazosConfirmados
        )
      ) {
        return false;
      }

      const horario = profesional.horarios.find(
        (item) =>
          item.periodo.año === año &&
          item.periodo.mes === mes
      );

      if (!horario) return false;

      const entrada = convertirHoraAMinutos(horario.entrada);
      const salida = convertirHoraAMinutos(horario.salida);

      if (entrada === null || salida === null) return false;

      if (entrada > inicioActividad || salida < finActividad) {
        return false;
      }

      return true;
    })
    .map((profesional) => {
      const mismoSector =
        Boolean(profesional.sector) &&
        profesional.sector === profesionalAusente.sector;

      const tieneResponsabilidadEspecial =
        profesional.responsabilidades.some(
          (responsabilidad) => responsabilidad.activo
        );

      const motivos: string[] = ["Horario general compatible"];

      if (actividad.lugar) {
        motivos.push(`Restricciones de lugar compatibles: ${actividad.lugar}`);
      }

      motivos.push("Sin actividades ni coberturas solapadas registradas");

      if (tieneResponsabilidadEspecial) {
        motivos.push(
          "Tiene una responsabilidad especial que debe revisarse"
        );
      }

      return {
        profesional,
        mismoSector,
        tieneResponsabilidadEspecial,
        motivos,
      };
    })
    .sort((a, b) => {
      if (
        !a.tieneResponsabilidadEspecial &&
        b.tieneResponsabilidadEspecial
      ) {
        return -1;
      }

      if (
        a.tieneResponsabilidadEspecial &&
        !b.tieneResponsabilidadEspecial
      ) {
        return 1;
      }

      return a.profesional.nombre.localeCompare(
        b.profesional.nombre
      );
    });
}
