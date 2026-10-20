-- CreateTable
CREATE TABLE "Reemplazo" (
    "id" SERIAL NOT NULL,
    "actividadId" INTEGER NOT NULL,
    "profesionalAusenteId" INTEGER NOT NULL,
    "profesionalReemplazoId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "fechaConfirmacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reemplazo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reemplazo_actividadId_key" ON "Reemplazo"("actividadId");

-- AddForeignKey
ALTER TABLE "Reemplazo" ADD CONSTRAINT "Reemplazo_actividadId_fkey" FOREIGN KEY ("actividadId") REFERENCES "Actividad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reemplazo" ADD CONSTRAINT "Reemplazo_profesionalAusenteId_fkey" FOREIGN KEY ("profesionalAusenteId") REFERENCES "Profesional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reemplazo" ADD CONSTRAINT "Reemplazo_profesionalReemplazoId_fkey" FOREIGN KEY ("profesionalReemplazoId") REFERENCES "Profesional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
