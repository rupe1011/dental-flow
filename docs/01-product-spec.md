# Product Spec — Planificador Dental CESFAM

## 1. Objetivo

Crear una aplicación web que facilite la planificación y gestión del personal dental del CESFAM, reemplazando progresivamente el uso manual del Excel por una interfaz visual, simple y fácil de entender.

El objetivo principal es permitir que la persona encargada pueda:

- Visualizar el calendario de trabajo.
- Entender fácilmente qué odontólogos y TENS están disponibles cada día.
- Detectar rápidamente cuándo una ausencia puede comprometer la atención clínica.
- Encontrar alternativas de cobertura para una TENS ausente.
- Registrar ausencias y actualizar el calendario.
- Controlar los permisos según los límites establecidos y el historial acumulado.
- Mantener la información de extensión horaria en un módulo separado.

---

# 2. Problema

Actualmente la planificación se gestiona mediante un archivo Excel con varias hojas, calendarios semanales, registros de permisos y una sección de extensiones horarias.

El principal problema no es solamente registrar quién trabaja cada día.

El problema es que, cuando un funcionario deja de estar disponible, la persona encargada debe analizar manualmente:

- Qué atención clínica queda afectada.
- Qué odontólogo necesita cobertura.
- Qué TENS están disponibles.
- Qué sector corresponde.
- Qué horarios son compatibles.
- Qué restricciones existen.
- Qué alternativa produce el menor impacto en la organización.

La aplicación debe facilitar este proceso y hacer visible el impacto de una ausencia de forma inmediata.

---

# 3. Usuarios

## Usuario principal

Persona encargada de organizar y mantener el calendario del personal dental.

Necesita una herramienta rápida y visual para tomar decisiones de planificación.

## Funcionarios

En una versión posterior podrían consultar su calendario, disponibilidad o registrar solicitudes.

No forman parte necesariamente del primer MVP como usuarios autenticados.

---

# 4. Concepto principal de la aplicación

La aplicación debe responder principalmente a esta pregunta:

> "Si esta persona no trabaja este día, ¿qué impacto tiene sobre la atención clínica y cómo puedo cubrirlo?"

Flujo principal:

Funcionario no disponible
→ detectar actividades afectadas
→ identificar necesidad de cobertura
→ buscar TENS disponibles
→ evaluar compatibilidad
→ mostrar alternativas
→ encargado selecciona una alternativa
→ actualizar calendario.

---

# 5. Calendario

La aplicación debe mostrar el calendario del mes actual de forma visual.

Debe ser posible identificar fácilmente:

- Fecha.
- Jornada.
- Odontólogos.
- TENS.
- Actividades/atenciones.
- Ausencias.
- Problemas de cobertura.
- Alertas.

La interfaz debe ser considerablemente más fácil de interpretar que el Excel actual.

El calendario original contiene planificación horaria y actividades clínicas, incluyendo bloques de 30 minutos y actividades como controles, urgencias, reuniones, CESFAM, feriados y períodos no disponibles.

La aplicación deberá conservar la información relevante del calendario sin obligar al usuario a interpretar una planilla extensa.

---

# 6. Cobertura odontólogo–TENS

En horario diurno NO existe actualmente una pareja fija y predefinida de odontólogo + TENS.

La aplicación debe permitir visualizar de forma didáctica qué cobertura corresponde en cada momento/día.

Esto es importante porque una persona que solicita un día libre debe poder ver rápidamente si su ausencia afecta una atención clínica.

Ejemplo conceptual:

Odontólogo
↓
necesita TENS
↓
TENS disponible / no disponible
↓
cobertura OK / problema

La aplicación no debe asumir parejas permanentes durante la jornada diurna.

---

# 7. Ausencias

"Ausencia" significa cualquier situación en la que un funcionario no estará disponible para trabajar.

Ejemplos:

- Licencia médica.
- Feriado legal.
- Permiso administrativo.
- Permiso de capacitación.
- Permiso compensatorio.
- Otros permisos.
- Cualquier otro motivo válido de ausencia.

Al registrar una ausencia, el sistema debe actualizar el calendario y analizar automáticamente su impacto.

---

# 8. Análisis de impacto clínico

Cuando una persona queda no disponible, el sistema debe detectar si existen actividades o atenciones que requieren cobertura.

Estados posibles:

### Cobertura disponible

La ausencia no genera un problema porque existe una alternativa compatible.

### Cobertura pendiente

Existe una posible alternativa, pero requiere que el encargado tome una decisión.

### Sin cobertura

No existe una TENS compatible disponible.

Debe mostrarse una alerta clara indicando que la atención clínica podría quedar comprometida y que se debe conseguir apoyo.

---

# 9. Reglas para buscar una TENS de reemplazo

Cuando falta una TENS, el sistema debe buscar alternativas siguiendo el orden utilizado actualmente por la planificación.

## Prioridad 1 — Sector

Priorizar TENS del sector compatible:

- Rojo → Rojo.
- Verde → Verde.
- Amarillo → Amarillo.

## Prioridad 2 — Horario

La TENS debe tener un horario compatible con la necesidad de cobertura.

## Prioridad 3 — Uso de recursos

Debe considerarse la función adicional de Tatiana Vudvud.

Tatiana está encargada de la bodega de insumos dentales. Una vez por semana recibe formularios de solicitud de insumos emitidos por las demás TENS y posteriormente distribuye los insumos según disponibilidad.

Por lo tanto, cuando existan alternativas equivalentes, el sistema debe considerar la conveniencia de mantener a Tatiana disponible para sus funciones de bodega.

## Resultado

El sistema debe mostrar alternativas al encargado.

El MVP NO debe realizar necesariamente una reasignación automática irreversible.

La persona encargada debe poder revisar y confirmar la alternativa.

---

# 10. Horarios y restricciones conocidas

TENS:

- Tatiana Vudvud — 08:00–17:00 — sector rojo.
- Solange Fre — 08:30–17:30 — sector rojo.
- Yoselin Oliva — 08:00–17:00 — sector verde.
- Yoselin Rodríguez — 09:00–16:00 — sector verde.
- Camila Báez — 08:00–17:00 — sector amarillo / Los Loros.
- Patricia Rodríguez — 08:00–17:00.

Los viernes se trabaja una hora menos.

Restricción conocida:

- Yoselin Rodríguez no puede desplazarse a Los Loros.

Existen además otros TENS disponibles para apoyo en la hoja "Extensiones".

Estas reglas deberán poder convertirse posteriormente en reglas configurables, en lugar de quedar escritas directamente en la interfaz.

---

# 11. Permisos

La aplicación debe controlar los permisos considerando el acumulado histórico.

Los permisos pueden solicitarse durante todo el año, pero existen límites.

## Límites conocidos

### Feriado legal

15 días.

Excepciones:

- Solange Fre — 20 días.
- Carlos Bravo — 20 días.

### Permiso administrativo

6 días.

Excepción:

- Sebastián Báez — 12 días.

### Capacitación

3 días.

Excepción:

- Sebastián Báez — 6 días.

### Licencia médica

Sin límite predefinido.

La aplicación debe utilizar el historial acumulado de meses anteriores para determinar cuánto ha utilizado cada persona.

Si una nueva solicitud supera el límite correspondiente, debe mostrar una alerta.

---

# 12. Tipos de permisos existentes en el Excel

El archivo actual contiene códigos asociados a diferentes tipos de ausencia/permisos, entre ellos:

- FL — Feriado Legal.
- PA — Permiso Administrativo.
- PT — Permiso Administrativo 1/2 día tarde.
- PM — Permiso Administrativo 1/2 día mañana.
- PCA — Permiso Capacitación.
- PCO — Permiso Compensatorio.
- LM — Licencia Médica.
- DR — Descanso Reparatorio.

La aplicación deberá mapear estos registros a tipos comprensibles para el usuario.

---

# 13. Extensión horaria

La extensión horaria se considera un módulo separado del problema principal de cobertura diurna.

En este módulo sí existen relaciones de trabajo odontólogo–TENS previamente establecidas.

Relaciones conocidas:

- Tomás Yáñez → Tatiana Vudvud.
- Valentina Ventura → Solange Fre.
- Carlos Bravo → Yoselin Oliva.
- Sebastián Báez → Yoselin Rodríguez.
- Pablo Cortés → Camila Báez.
- Bastián Puelles → Patricia Rodríguez.

También existe el caso de reemplazo de Tomás Yáñez por Lisbeth Rivera durante su licencia médica.

La hoja "EXTENSIONES" contiene información adicional sobre estas asignaciones y funcionarios disponibles.

---

# 14. Casos especiales conocidos

Lisbeth Rivera reemplaza a Tomás Yáñez durante el período de licencia médica.

Existe además apoyo externo de una TENS.

La hoja "EXTENSIONES" contiene otros funcionarios que pueden utilizarse como apoyo.

Estos casos deben poder representarse en el sistema sin alterar la lógica general.

---

# 15. Interfaz propuesta para el MVP

La aplicación debería tener una interfaz simple y centrada en las tareas principales.

## Dashboard

Mostrar:

- Estado general del calendario.
- Ausencias recientes.
- Alertas de cobertura.
- Problemas pendientes.

## Calendario

Vista mensual/semanal.

Debe permitir seleccionar un día y visualizar:

- Personal disponible.
- Personal ausente.
- Atención/actividad.
- Cobertura TENS.
- Alertas.

## Ausencias

Permitir:

- Registrar ausencia.
- Seleccionar funcionario.
- Seleccionar período.
- Seleccionar motivo.
- Ver impacto generado.

## Permisos

Permitir consultar:

- Días utilizados.
- Días disponibles.
- Límites.
- Historial.

## Extensión horaria

Módulo separado para consultar y gestionar las asignaciones correspondientes.

---

# 16. Fuera del MVP

No forman parte de la primera versión:

- WhatsApp.
- Notificaciones automáticas externas.
- Login avanzado.
- Aplicación móvil.
- Integración con sistemas externos del CESFAM.
- Automatización completa de decisiones.
- Algoritmos avanzados de optimización.
- IA para tomar decisiones automáticamente.

Podrán evaluarse posteriormente.

---

# 17. Principio fundamental del producto

La aplicación debe **ayudar a la persona encargada a tomar decisiones**, no reemplazarla completamente.

El sistema debe:

1. Detectar problemas.
2. Explicar qué está afectado.
3. Buscar alternativas.
4. Ordenar las alternativas según las reglas conocidas.
5. Mostrar claramente las consecuencias.
6. Permitir que el encargado confirme el cambio.

---

# 18. MVP principal

El primer MVP se considera exitoso si permite realizar este flujo:

1. Abrir el calendario actual.
2. Seleccionar una fecha.
3. Ver de forma clara la planificación y cobertura.
4. Registrar que un funcionario no estará disponible.
5. Detectar qué atención/odontólogo queda afectado.
6. Buscar TENS disponibles.
7. Priorizar por sector.
8. Comprobar compatibilidad horaria.
9. Considerar restricciones conocidas.
10. Mostrar alternativas.
11. Permitir seleccionar una alternativa.
12. Actualizar el calendario.
13. Mostrar una alerta cuando no exista cobertura.
14. Consultar el acumulado de permisos y detectar excesos.

---

# 19. Criterio de diseño

La aplicación debe priorizar:

**Claridad > cantidad de información**

**Decisiones rápidas > complejidad**

**Alertas visuales > interpretación manual**

**Reglas explícitas > decisiones ocultas**

El usuario debería poder entender el estado de un día en pocos segundos, sin tener que interpretar una planilla extensa.

---

# 20. Próximo paso

Antes de implementar frontend/backend, convertir esta especificación en:

1. Modelo de datos.
2. Reglas de negocio detalladas.
3. Casos de uso.
4. Flujos de interfaz.
5. Arquitectura técnica.
6. Estructura de archivos.
7. Plan de implementación por etapas.