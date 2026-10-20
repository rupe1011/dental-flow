
type Props = {
  tipo?: string;
  mensaje?: string;
};

export default function ResultadoAccion({
  tipo,
  mensaje,
}: Props) {
  if (!tipo || !mensaje) return null;

  const esError = tipo === "error";

  return (
    <div
      role={esError ? "alert" : "status"}
      className={`mb-6 rounded-lg border p-4 ${
        esError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-green-200 bg-green-50 text-green-800"
      }`}
    >
      <p className="font-semibold">
        {esError ? "No se pudo completar la operación" : "Operación completada"}
      </p>
      <p className="mt-1 text-sm">{mensaje}</p>
    </div>
  );
}
