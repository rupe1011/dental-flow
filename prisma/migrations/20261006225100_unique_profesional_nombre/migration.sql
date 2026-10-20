/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Profesional` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Profesional_nombre_key" ON "Profesional"("nombre");
