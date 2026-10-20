
const secciones = [
  {
    titulo: "Calendario",
    descripcion: "Consulta las actividades y revisa la cobertura diaria.",
    href: "/calendario",
  },
  {
    titulo: "Profesionales",
    descripcion: "Consulta los profesionales registrados en DentalFlow.",
    href: "/profesionales",
  },
  {
    titulo: "Ausencias",
    descripcion: "Registra ausencias y revisa su impacto en la agenda.",
    href: "/ausencias",
  },
  {
    titulo: "Importar Excel",
    descripcion: "Carga un calendario mensual y revisa los datos antes de importarlos.",
    href: "/importar-excel",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Planificación odontológica
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
            DentalFlow
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Organiza las agendas, gestiona las ausencias y encuentra
            alternativas de cobertura para el equipo dental.
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Panel principal
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {secciones.map((seccion) => (
              <a
                key={seccion.href}
                href={seccion.href}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {seccion.titulo}
                </h3>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {seccion.descripcion}
                </p>

                <span className="mt-5 inline-block text-sm font-medium text-blue-700">
                  Abrir sección →
                </span>
              </a>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-gray-200 pt-5 text-sm text-gray-500">
          DentalFlow · Planificación y cobertura del equipo dental
        </footer>
      </div>
    </main>
  );
}
