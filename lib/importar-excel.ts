
import ExcelJS from "exceljs";

export type ActividadExcelPreview = {
  profesional: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  nombre: string;
  lugar: string | null;
  hoja: string;
};

export type EstadoDisponibilidadExcelPreview = {
  profesional: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  hoja: string;
};

export type ResultadoImportacionExcel = {
  periodo: {
    anio: number;
    mes: number;
    etiqueta: string;
  };
  hojasLeidas: string[];
  actividades: ActividadExcelPreview[];
  estadosDisponibilidad: EstadoDisponibilidadExcelPreview[];
  advertencias: string[];
  resumen: {
    actividades: number;
    profesionales: number;
    dias: number;
  };
};

const COLUMNAS_HORARIO = [1, 3, 5, 7, 9, 11];
const COLUMNAS_FECHA = [2, 4, 6, 8, 10, 12];

const HOJAS_SEMANA = [
  "SEMANA 1",
  "SEMANA 2",
  "SEMANA 3",
  "SEMANA 4",
  "SEMANA 5",
];

// Lugares que reconocemos expresamente en el Excel.
// Los valores desconocidos no se clasificarán como lugares.
const LUGARES_CONOCIDOS = [
  "CESFAM",
  "POSTA LOS LOROS",
  "CLÍNICA MÓVIL",
  "JUNAEB",
];

// Estados de disponibilidad: se muestran aparte y nunca como actividades clínicas.
const ESTADOS_DISPONIBILIDAD = new Set([
  "NO DISPONIBLE",
  "FERIADO",
  "FERIADO LEGAL",
  "PERMISO ADMINISTRATIVO",
  "PERMISO DE CAPACITACION",
  "PERMISO CAPACITACION",
  "LICENCIA MEDICA",
  "PERMISO COMPESATORIO",
  "DESCANSO REPARATORIO",
  "P. ADM. 1/2 DIA TARDE",
  "P. ADM. 1/2 DIA MANANA",
]);

function esEstadoDisponibilidad(valor: string): boolean {
  return ESTADOS_DISPONIBILIDAD.has(normalizarTexto(valor).replace(/\s+/g, " "));
}

function valorCelda(value: ExcelJS.CellValue): unknown {
  if (value && typeof value === "object" && "result" in value) {
    return value.result;
  }

  if (value && typeof value === "object" && "text" in value) {
    return value.text;
  }

  return value;
}

function texto(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim();
}

function normalizarTexto(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleUpperCase("es-CL");
}

function detectarLugar(encabezadoDia: string): string | null {
  const encabezadoNormalizado = normalizarTexto(encabezadoDia);

  const lugarEncontrado = LUGARES_CONOCIDOS.find(
    (lugar) => normalizarTexto(lugar) === encabezadoNormalizado,
  );

  return lugarEncontrado ?? null;
}

function fechaISO(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const anio = value.getUTCFullYear();
    const mes = String(value.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(value.getUTCDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(
      Date.UTC(1899, 11, 30) + value * 86400000,
    );

    return date.toISOString().slice(0, 10);
  }

  const raw = texto(value);

  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function horaNormalizada(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);

  if (!match) {
    return null;
  }

  const hora = Number(match[1]);
  const minuto = Number(match[2]);

  if (hora > 23 || minuto > 59) {
    return null;
  }

  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

function intervalo(
  raw: string,
): { inicio: string; fin: string } | null {
  const match = raw.match(
    /(\d{1,2}\s*:\s*\d{1,2})\s*-\s*(\d{1,2}\s*:\s*\d{1,2})/,
  );

  if (!match) {
    return null;
  }

  const inicio = horaNormalizada(match[1]);
  const fin = horaNormalizada(match[2]);

  if (!inicio || !fin || inicio >= fin) {
    return null;
  }

  return { inicio, fin };
}

function mismoGrupo(
  a: ActividadExcelPreview,
  b: ActividadExcelPreview,
): boolean {
  return (
    a.profesional === b.profesional &&
    a.fecha === b.fecha &&
    a.horaFin === b.horaInicio &&
    a.nombre === b.nombre &&
    a.lugar === b.lugar &&
    a.hoja === b.hoja
  );
}

function etiquetaPeriodo(
  workbook: ExcelJS.Workbook,
): {
  anio: number;
  mes: number;
  etiqueta: string;
} {
  const control = workbook.getWorksheet("CONTROL");

  const raw = control
    ? texto(valorCelda(control.getCell("B3").value))
    : "";

  const match = raw
    .toLocaleUpperCase("es-CL")
    .match(/([A-ZÁÉÍÓÚ]+)\s+(20\d{2})/);

  const meses: Record<string, number> = {
    ENERO: 1,
    FEBRERO: 2,
    MARZO: 3,
    ABRIL: 4,
    MAYO: 5,
    JUNIO: 6,
    JULIO: 7,
    AGOSTO: 8,
    SEPTIEMBRE: 9,
    SETIEMBRE: 9,
    OCTUBRE: 10,
    NOVIEMBRE: 11,
    DICIEMBRE: 12,
  };

  if (match && meses[match[1]]) {
    return {
      anio: Number(match[2]),
      mes: meses[match[1]],
      etiqueta: raw,
    };
  }

  for (const nombreHoja of HOJAS_SEMANA) {
    const sheet = workbook.getWorksheet(nombreHoja);

    if (!sheet) {
      continue;
    }

    for (const col of COLUMNAS_FECHA) {
      const fecha = fechaISO(
        valorCelda(sheet.getCell(4, col).value),
      );

      if (!fecha) {
        continue;
      }

      const [anio, mes] = fecha.split("-").map(Number);

      return {
        anio,
        mes,
        etiqueta: `${new Date(
          Date.UTC(anio, mes - 1, 1),
        )
          .toLocaleString("es-CL", {
            month: "long",
            timeZone: "UTC",
          })
          .toUpperCase()} ${anio}`,
      };
    }
  }

  throw new Error(
    "No pude identificar el mes y año en la hoja CONTROL ni en las fechas semanales.",
  );
}

function detectarFilasProfesionales(
  sheet: ExcelJS.Worksheet,
): number[] {
  const filas: number[] = [];

  for (let fila = 2; fila <= sheet.rowCount; fila++) {
    const nombre = texto(
      valorCelda(sheet.getCell(fila, 1).value),
    );

    const nombreNormalizado = normalizarTexto(nombre);

    if (!nombre) {
      continue;
    }

    // Excluir secciones que no son profesionales de la agenda diurna.
    if (
      nombreNormalizado.includes("EXTENSION") ||
      nombreNormalizado.includes("REEMPLAZ")
    ) {
      continue;
    }

    // Los profesionales tienen ENTRADA y SALIDA en la fila anterior.
    const encabezado = texto(
      valorCelda(sheet.getCell(fila - 1, 1).value),
    );

    if (!/^ENTRADA\b.*\bSALIDA\b/i.test(encabezado)) {
      continue;
    }

    // Confirmar que el bloque contiene horarios.
    const tieneHorarios = COLUMNAS_HORARIO.some((col) => {
      for (
        let desplazamiento = 2;
        desplazamiento <= 19;
        desplazamiento++
      ) {
        const rango = intervalo(
          texto(
            valorCelda(
              sheet.getCell(fila + desplazamiento, col).value,
            ),
          ),
        );

        if (rango) {
          return true;
        }
      }

      return false;
    });

    if (tieneHorarios) {
      filas.push(fila);
    }
  }

  return filas;
}

export async function previsualizarExcel(
  buffer: Buffer,
): Promise<ResultadoImportacionExcel> {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(buffer as never);

  const periodo = etiquetaPeriodo(workbook);
  const advertencias: string[] = [];
  const actividades: ActividadExcelPreview[] = [];
  const estadosDisponibilidad: EstadoDisponibilidadExcelPreview[] = [];
  const hojasLeidas: string[] = [];

  const prefijoFecha = `${periodo.anio}-${String(
    periodo.mes,
  ).padStart(2, "0")}-`;

  for (const nombreHoja of HOJAS_SEMANA) {
    const sheet = workbook.getWorksheet(nombreHoja);

    if (!sheet) {
      continue;
    }

    hojasLeidas.push(nombreHoja);

    const filasPorProfesional = detectarFilasProfesionales(sheet);

    if (filasPorProfesional.length !== 6) {
      advertencias.push(
        `${nombreHoja}: detecté ${filasPorProfesional.length} bloques de profesionales; se esperaban 6. Revisa la estructura antes de importar.`,
      );
    }

    for (const filaNombre of filasPorProfesional) {
      const profesional = texto(
        valorCelda(sheet.getCell(filaNombre, 1).value),
      );

      const filaInicio = filaNombre + 2;
      const filaFin = filaNombre + 19;

      for (const colHora of COLUMNAS_HORARIO) {
        const colActividad = colHora + 1;

        const fecha = fechaISO(
          valorCelda(sheet.getCell(4, colActividad).value),
        );

        if (!fecha || !fecha.startsWith(prefijoFecha)) {
          continue;
        }

        // El encabezado del día contiene el lugar o una anotación.
        // Solo los valores de la lista reconocida se guardan como lugar.
        const encabezadoDia = texto(
          valorCelda(
            sheet.getCell(filaNombre - 1, colActividad).value,
          ),
        );

        const lugar = detectarLugar(encabezadoDia);

        for (let fila = filaInicio; fila <= filaFin; fila++) {
          const rango = intervalo(
            texto(
              valorCelda(sheet.getCell(fila, colHora).value),
            ),
          );

          const nombreActividad = texto(
            valorCelda(sheet.getCell(fila, colActividad).value),
          );

          if (
            !rango ||
            !nombreActividad ||
            nombreActividad === "-"
          ) {
            continue;
          }

          if (esEstadoDisponibilidad(nombreActividad)) {
            estadosDisponibilidad.push({
              profesional,
              fecha,
              horaInicio: rango.inicio,
              horaFin: rango.fin,
              estado: nombreActividad,
              hoja: nombreHoja,
            });
            continue;
          }

          actividades.push({
            profesional,
            fecha,
            horaInicio: rango.inicio,
            horaFin: rango.fin,
            nombre: nombreActividad,
            lugar,
            hoja: nombreHoja,
          });
        }
      }
    }
  }

  actividades.sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      a.profesional.localeCompare(b.profesional, "es") ||
      a.horaInicio.localeCompare(b.horaInicio),
  );

  const agrupadas: ActividadExcelPreview[] = [];

  for (const actividad of actividades) {
    const anterior = agrupadas[agrupadas.length - 1];

    if (anterior && mismoGrupo(anterior, actividad)) {
      anterior.horaFin = actividad.horaFin;
    } else {
      agrupadas.push({ ...actividad });
    }
  }

  estadosDisponibilidad.sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      a.profesional.localeCompare(b.profesional, "es") ||
      a.horaInicio.localeCompare(b.horaInicio),
  );

  const estadosAgrupados: EstadoDisponibilidadExcelPreview[] = [];
  for (const estado of estadosDisponibilidad) {
    const anterior = estadosAgrupados[estadosAgrupados.length - 1];
    if (
      anterior &&
      anterior.profesional === estado.profesional &&
      anterior.fecha === estado.fecha &&
      anterior.horaFin === estado.horaInicio &&
      normalizarTexto(anterior.estado) === normalizarTexto(estado.estado) &&
      anterior.hoja === estado.hoja
    ) {
      anterior.horaFin = estado.horaFin;
    } else {
      estadosAgrupados.push({ ...estado });
    }
  }

  if (!hojasLeidas.length) {
    advertencias.push(
      "No encontré hojas SEMANA 1 a SEMANA 5.",
    );
  }

  if (agrupadas.length === 0) {
    advertencias.push(
      "No se detectaron actividades; el formato del Excel podría haber cambiado.",
    );
  }

  if (estadosAgrupados.length > 0) {
    advertencias.push(
      `Se detectaron ${estadosAgrupados.length} bloques de disponibilidad (feriados, permisos o NO DISPONIBLE). Se muestran por separado y todavía no se guardan en la base de datos.`,
    );
  }

  if (workbook.getWorksheet("EXTENSIONES")) {
    advertencias.push(
      "La hoja EXTENSIONES se detectó, pero se importará en una fase separada para no mezclarla con la agenda diurna.",
    );
  }

  const hojaPermisos = workbook.worksheets.find(
    (sheet) =>
      sheet.name
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleUpperCase("es-CL") === "PERMISOS FERIADO LEGAL",
  );

  if (hojaPermisos) {
    advertencias.push(
      "La hoja de permisos/feriado legal se detectó, pero todavía no se importa automáticamente.",
    );
  }

  return {
    periodo,
    hojasLeidas,
    actividades: agrupadas,
    estadosDisponibilidad: estadosAgrupados,
    advertencias,
    resumen: {
      actividades: agrupadas.length,
      profesionales: new Set([
        ...agrupadas.map((actividad) => actividad.profesional),
        ...estadosAgrupados.map((estado) => estado.profesional),
      ]).size,
      dias: new Set([
        ...agrupadas.map((actividad) => actividad.fecha),
        ...estadosAgrupados.map((estado) => estado.fecha),
      ]).size,
    },
  };
}