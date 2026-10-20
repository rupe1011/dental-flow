import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const profesionales = await prisma.profesional.findMany({
      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json({
      ok: true,
      profesionales,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo consultar la base de datos",
      },
      { status: 500 }
    );
  }
}