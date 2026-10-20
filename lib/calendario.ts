export function obtenerDiasDelMes(año: number, mes: number) {
  const dias = new Date(año, mes, 0).getDate();

  return Array.from({ length: dias }, (_, index) => {
    const dia = index + 1;

    const fecha = `${año}-${String(mes).padStart(2, "0")}-${String(
      dia
    ).padStart(2, "0")}`;

    return {
      dia,
      fecha,
    };
  });
}