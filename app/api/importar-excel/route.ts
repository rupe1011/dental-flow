import { NextResponse } from "next/server";
import { previsualizarExcel } from "@/lib/importar-excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("archivo");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecciona un archivo Excel (.xlsx)." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ error: "El archivo debe tener formato .xlsx." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera el límite de 10 MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resultado = await previsualizarExcel(buffer);
    return NextResponse.json(resultado);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pude leer el Excel.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
