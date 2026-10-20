-- CreateTable
CREATE TABLE "RestriccionCobertura" (
    "id" SERIAL NOT NULL,
    "profesionalId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "permite" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RestriccionCobertura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsabilidad" (
    "id" SERIAL NOT NULL,
    "profesionalId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "frecuencia" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Responsabilidad_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RestriccionCobertura" ADD CONSTRAINT "RestriccionCobertura_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsabilidad" ADD CONSTRAINT "Responsabilidad_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
