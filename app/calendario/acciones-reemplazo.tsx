
"use client";

import { useState } from "react";
import {
  cambiarReemplazo,
  cancelarReemplazo,
} from "./actions";

type Props = {
  actividadId: number;
  profesionalAusenteId: number;
  profesionalReemplazoId: number;
  nombreReemplazo: string;
  candidatos: {
    id: number;
    nombre: string;
  }[];
  fecha: string;
};

export default function AccionesReemplazo({
  actividadId,
  profesionalAusenteId,
  profesionalReemplazoId,
  nombreReemplazo,
  candidatos,
  fecha,
}: Props) {
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [seleccionado, setSeleccionado] = useState(
    String(profesionalReemplazoId)
  );

  return (
    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
      <p className="text-sm font-semibold text-green-800">
        Reemplazo confirmado: {nombreReemplazo}
      </p>

      <button
        type="button"
        onClick={() => setMostrarOpciones(!mostrarOpciones)}
        className="mt-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {mostrarOpciones ? "Cerrar opciones" : "Gestionar reemplazo"}
      </button>

      {mostrarOpciones && (
        <div className="mt-3 space-y-3">
          <form
            action={cambiarReemplazo}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  "¿Confirmas el cambio de profesional para esta actividad?"
                )
              ) {
                event.preventDefault();
              }
            }}
            className="space-y-2"
          >
            <input
              type="hidden"
              name="actividadId"
              value={actividadId}
            />
            <input
              type="hidden"
              name="profesionalAusenteId"
              value={profesionalAusenteId}
            />
            <input type="hidden" name="fecha" value={fecha} />

            <label className="block text-sm font-medium text-gray-700">
              Nuevo profesional
            </label>

            <select
              name="profesionalReemplazoId"
              value={seleccionado}
              onChange={(event) => setSeleccionado(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm"
            >
              {candidatos.map((candidato) => (
                <option key={candidato.id} value={candidato.id}>
                  {candidato.nombre}
                  {candidato.id === profesionalReemplazoId
                    ? " (actual)"
                    : ""}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={
                Number(seleccionado) === profesionalReemplazoId
              }
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar cambio
            </button>
          </form>

          <form
            action={cancelarReemplazo}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  "¿Seguro que quieres cancelar este reemplazo? La actividad volverá a quedar pendiente de cobertura."
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input
              type="hidden"
              name="actividadId"
              value={actividadId}
            />
            <input type="hidden" name="fecha" value={fecha} />

            <button
              type="submit"
              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Cancelar reemplazo
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
