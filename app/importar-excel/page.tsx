"use client";

import Link from "next/link";
import { useState } from "react";

type Actividad = {
  profesional: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  nombre: string;
  lugar: string | null;
  hoja: string;
};

type EstadoDisponibilidad = {
  profesional: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  hoja: string;
};

type Resultado = {
  periodo: { anio: number; mes: number; etiqueta: string };
  hojasLeidas: string[];
  actividades: Actividad[];
  estadosDisponibilidad: EstadoDisponibilidad[];
  advertencias: string[];
  resumen: { actividades: number; profesionales: number; dias: number };
};

export default function ImportarExcelPage() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function previsualizar() {
    if (!archivo) {
      setError("Selecciona un archivo Excel primero.");
      return;
    }

    setCargando(true);
    setError("");
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const respuesta = await fetch("/api/importar-excel", {
        method: "POST",
        body: formData,
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo leer el archivo.");
      }
      setResultado(datos as Resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al leer el Excel.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-blue-700 hover:underline">
          ← Volver al inicio
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-gray-900">Importar calendario Excel</h1>
        <p className="mt-2 text-gray-600">
          Selecciona el calendario mensual para revisar las actividades y los estados de disponibilidad antes de guardarlos.
        </p>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <label htmlFor="archivo" className="mb-2 block font-medium text-gray-800">
            Archivo Excel (.xlsx)
          </label>
          <input
            id="archivo"
            type="file"
            accept=".xlsx"
            onChange={(event) => {
              setArchivo(event.target.files?.[0] ?? null);
              setResultado(null);
              setError("");
            }}
            className="block w-full text-sm text-gray-700"
          />
          <p className="mt-2 text-sm text-gray-500">
            Máximo 10 MB. Esta vista previa no guarda cambios en la base de datos.
          </p>
          <button
            type="button"
            onClick={previsualizar}
            disabled={!archivo || cargando}
            className="mt-5 rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? "Leyendo archivo..." : "Generar vista previa"}
          </button>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
        </section>

        {resultado && (
          <>
            <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Resultado de la lectura</h2>
              <p className="mt-2 text-gray-600">Periodo detectado: {resultado.periodo.etiqueta}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Actividades normales</p>
                  <p className="mt-1 text-2xl font-bold">{resultado.resumen.actividades}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Profesionales detectados</p>
                  <p className="mt-1 text-2xl font-bold">{resultado.resumen.profesionales}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Días con registros</p>
                  <p className="mt-1 text-2xl font-bold">{resultado.resumen.dias}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">Hojas leídas: {resultado.hojasLeidas.join(", ") || "Ninguna"}</p>
              {resultado.advertencias.length > 0 && (
                <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <h3 className="font-semibold text-amber-900">Advertencias</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                    {resultado.advertencias.map((aviso, index) => <li key={index}>{aviso}</li>)}
                  </ul>
                </div>
              )}
            </section>

            <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Actividades detectadas</h2>
              <p className="mt-1 text-sm text-gray-500">Se muestran hasta 100 registros. Todavía no se ha guardado ninguno.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600"><tr>
                    <th className="p-3">Fecha</th><th className="p-3">Profesional</th><th className="p-3">Horario</th><th className="p-3">Actividad</th><th className="p-3">Lugar</th><th className="p-3">Hoja</th>
                  </tr></thead>
                  <tbody>
                    {resultado.actividades.slice(0, 100).map((actividad, index) => (
                      <tr key={`${actividad.fecha}-${actividad.profesional}-${actividad.horaInicio}-${index}`} className="border-t">
                        <td className="whitespace-nowrap p-3">{actividad.fecha}</td><td className="p-3">{actividad.profesional}</td><td className="whitespace-nowrap p-3">{actividad.horaInicio}–{actividad.horaFin}</td><td className="p-3">{actividad.nombre}</td><td className="p-3">{actividad.lugar || "—"}</td><td className="p-3">{actividad.hoja}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Estados de disponibilidad</h2>
              <p className="mt-1 text-sm text-gray-500">Estos registros se separan de las actividades clínicas. Por ahora solo se muestran; no se guardan en la base de datos.</p>
              {resultado.estadosDisponibilidad.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">No se detectaron estados reconocidos.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600"><tr>
                      <th className="p-3">Fecha</th><th className="p-3">Profesional</th><th className="p-3">Horario</th><th className="p-3">Estado</th><th className="p-3">Hoja</th>
                    </tr></thead>
                    <tbody>
                      {resultado.estadosDisponibilidad.slice(0, 100).map((estado, index) => (
                        <tr key={`${estado.fecha}-${estado.profesional}-${estado.horaInicio}-${index}`} className="border-t">
                          <td className="whitespace-nowrap p-3">{estado.fecha}</td><td className="p-3">{estado.profesional}</td><td className="whitespace-nowrap p-3">{estado.horaInicio}–{estado.horaFin}</td><td className="p-3">{estado.estado}</td><td className="p-3">{estado.hoja}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
