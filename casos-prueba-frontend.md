# Casos de Prueba — Dashboard de Auditoría (Frontend)

> **Enfoque:** Pruebas manuales sobre la interfaz gráfica del dashboard SSE.
> **Precondición general:** Todos los servicios levantados en Kubernetes, Ingress configurado, `conjunta3p.espe.edu.ec` resolviendo correctamente.

---

## 1. Carga y visualización inicial

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-01** | Carga del dashboard con datos existentes | 1. Abrir `http://conjunta3p.espe.edu.ec/dashboard` | La página carga completamente. Se ve una tabla o lista de eventos de auditoría ordenados por fecha descendente. |
| **F-02** | Carga del dashboard sin datos previos | 1. Truncar la tabla de auditoría<br>2. Recargar el dashboard | Se ve un mensaje tipo "No hay eventos registrados" o una lista vacía. La página no queda en blanco ni muestra error. |
| **F-03** | Indicador de conexión SSE | 1. Abrir el dashboard<br>2. Observar el estado de conexión | Se muestra un indicador visual (ej. punto verde, texto "Conectado") que confirma que el SSE está activo. |
| **F-04** | Título y estructura visible | 1. Abrir el dashboard | La página tiene un título claro (ej. "Panel de Auditoría - CavaLocal"), y secciones diferenciadas: filtros, lista de eventos, detalle. |

---

## 2. Actualización en tiempo real (SSE)

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-05** | Nuevo evento aparece automáticamente al crear un vino | 1. Tener el dashboard abierto<br>2. En otra pestaña/terminal: `curl -X POST http://conjunta3p.espe.edu.ec/api/wines -H "Content-Type: application/json" -d '{...}'`<br>3. Volver al dashboard | El nuevo evento aparece en la lista sin recargar la página, en menos de 2 segundos. |
| **F-06** | Nuevo evento al actualizar un vino | 1. Dashboard abierto<br>2. Ejecutar `PUT /api/wines/:id` | El evento de actualización aparece en tiempo real con la acción "update". |
| **F-07** | Nuevo evento al eliminar un vino | 1. Dashboard abierto<br>2. Ejecutar `DELETE /api/wines/:id` | El evento de eliminación aparece en tiempo real. |
| **F-08** | Nuevo evento al crear una reserva | 1. Dashboard abierto<br>2. Crear reserva desde el frontend de CavaLocal (checkout) | El evento de "reservation" con acción "create" aparece automáticamente. |
| **F-09** | Nuevo evento al procesar un pago | 1. Dashboard abierto<br>2. Pagar una reserva desde el frontend | El evento de "payment" aparece automáticamente. |
| **F-10** | Múltiples eventos simultáneos | 1. Dashboard abierto<br>2. Ejecutar 5 operaciones de creación rápidamente (script)<br>3. Observar | Los 5 eventos aparecen uno tras otro, sin pérdidas ni saltos. |
| **F-11** | Reconexión automática al caer el SSE | 1. Dashboard abierto (indicador "Conectado")<br>2. Detener el pod de auditoría: `kubectl scale deployment audit --replicas=0`<br>3. Esperar 10s<br>4. Restaurar: `kubectl scale deployment audit --replicas=1` | El indicador cambia a "Desconectado" (o similar) durante la caída, y vuelve a "Conectado" automáticamente al restaurarse. No se pierde la página. |
| **F-12** | Eventos acumulados durante desconexión | 1. Dashboard abierto<br>2. Detener SSE (escalar a 0)<br>3. Crear 3 eventos mientras está caído<br>4. Restaurar SSE (escalar a 1)<br>5. Esperar reconexión | Al reconectar, los 3 eventos creados durante la caída se reflejan en el dashboard (ya sea por recuperación histórica o por recarga de la página). |

---

## 3. Filtros

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-13** | Filtrar por entidad | 1. Tener eventos variados (wine, reservation, user, etc.)<br>2. Seleccionar "wine" en el filtro de entidad | Solo se muestran eventos con entidad "wine". |
| **F-14** | Filtrar por acción | 1. Tener eventos create, update, delete<br>2. Seleccionar "create" en el filtro de acción | Solo se muestran eventos de creación. |
| **F-15** | Filtrar por usuario | 1. Tener eventos de distintos usuarios<br>2. Escribir un email o ID de usuario | Solo se muestran eventos de ese usuario. |
| **F-16** | Combinar filtros (entidad + acción) | 1. Seleccionar "reservation" + "create" | Solo eventos de reservas creadas. La combinación funciona como intersección. |
| **F-17** | Combinar filtros (entidad + usuario + acción) | 1. Seleccionar 3 filtros simultáneamente | Intersección de los 3 filtros aplicada correctamente. |
| **F-18** | Limpiar filtros | 1. Aplicar varios filtros<br>2. Hacer clic en "Limpiar" o "Reset" | Todos los filtros se borran y se ven todos los eventos nuevamente. |
| **F-19** | Filtro sin resultados | 1. Aplicar filtro que no coincida con ningún evento (ej. entidad inexistente) | Se muestra mensaje "No se encontraron eventos" o similar. |
| **F-20** | Filtro insensible a mayúsculas | 1. Seleccionar "Wine" (con mayúscula) vs "wine" | Ambos producen el mismo resultado. |

---

## 4. Detalle del evento (JSON)

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-21** | Ver detalle de un evento al hacer clic | 1. El dashboard muestra la lista de eventos<br>2. Hacer clic en un evento | Se expande un panel, modal o sección que muestra el JSON completo del campo `data`. |
| **F-22** | Cerrar el detalle | 1. Tener el detalle abierto<br>2. Hacer clic fuera o en botón "Cerrar" | El detalle se cierra y se vuelve a la vista de lista. |
| **F-23** | Formato JSON legible | 1. Abrir detalle de un evento | El JSON se muestra con formato legible (indentado, coloreado). No se ve como texto plano sin formato. |
| **F-24** | Detalle de evento update (before/after) | 1. Abrir detalle de un evento "update" | El JSON debe mostrar claramente `before` y `after` con los datos anteriores y posteriores. |
| **F-25** | Scroll en JSON largo | 1. Abrir detalle de un evento con `data` muy grande | El panel de detalle tiene scroll vertical para ver todo el contenido. No desborda el layout. |

---

## 5. Paginación y carga de datos

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-26** | Paginación visible si hay muchos eventos | 1. Tener 25+ eventos en DB<br>2. Abrir dashboard | Se ven los primeros 10-20 eventos, con controles de paginación (siguiente/anterior/números). |
| **F-27** | Navegar a página siguiente | 1. Hacer clic en "Siguiente" o número de página | Los eventos cambian a la página solicitada. |
| **F-28** | Volver a página anterior | 1. Ir a página 2<br>2. Hacer clic en "Anterior" | Vuelve a página 1 con los eventos correctos. |
| **F-29** | Eventos nuevos insertados al inicio (no rompen paginación) | 1. Estar en página 2<br>2. Llega un evento nuevo por SSE | El evento nuevo aparece al inicio de la página actual o se muestra una notificación. No se pierde la posición de paginación abruptamente. |
| **F-30** | Scroll infinito (si aplica) | 1. Hacer scroll hacia abajo (en caso de infinite scroll) | Más eventos se cargan automáticamente al llegar al final. |

---

## 6. Interacción y usabilidad

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-31** | Tooltip o columna con información de timestamp | 1. Pasar el mouse sobre la fecha de un evento | Se muestra el timestamp completo en formato legible o tooltip con hora exacta. |
| **F-32** | Diferencia visual entre acciones | 1. Tener eventos create, update, delete | Cada tipo de acción tiene un color o ícono diferente (ej. verde=create, amarillo=update, rojo=delete). |
| **F-33** | Contador de eventos totales | 1. Observar el dashboard | Se muestra un contador tipo "Mostrando 10 de 47 eventos". |
| **F-34** | Atajo de teclado o botón para recargar | 1. Presionar F5 o botón "Recargar" | La lista se refresca manualmente trayendo datos actualizados desde la API. |

---

## 7. Responsividad y compatibilidad

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-35** | Vista en escritorio (1920×1080) | 1. Abrir dashboard en monitor full HD | Todos los elementos visibles sin scroll horizontal. Layout de múltiples columnas. |
| **F-36** | Vista en tablet (768×1024) | 1. Redimensionar a 768px de ancho | El layout se adapta (menús colapsables, una sola columna). Filtros accesibles. |
| **F-37** | Vista en móvil (375×667) | 1. Redimensionar a 375px de ancho | Todos los elementos funcionales. Filtros en acordeón o menú hamburguesa. Tabla con scroll horizontal si es necesario. |
| **F-38** | Navegadores: Chrome | 1. Abrir en Chrome | Todo funciona correctamente. |
| **F-39** | Navegadores: Firefox | 1. Abrir en Firefox | Todo funciona correctamente. |
| **F-40** | Navegadores: Edge | 1. Abrir en Edge | Todo funciona correctamente. |

---

## 8. Manejo de errores

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-41** | Error de conexión SSE al cargar | 1. Detener el servicio de auditoría antes de abrir el dashboard<br>2. Abrir `http://conjunta3p.espe.edu.ec/dashboard` | Se muestra un mensaje tipo "Error de conexión. Reintentando..." o "Servicio no disponible". No se queda cargando infinitamente. |
| **F-42** | Error 404 en ruta del dashboard | 1. Navegar a `http://conjunta3p.espe.edu.ec/dashboard/xyz` | Página 404 personalizada o redirección al dashboard. No muestra error crudo del servidor. |
| **F-43** | API de auditoría devuelve error | 1. Hacer que la API de auditoría falle (ej. detener DB)<br>2. Abrir dashboard | El dashboard muestra mensaje "Error al cargar datos históricos" pero sigue intentando conectar SSE. No se rompe completamente. |
| **F-44** | Script de dashboard no cargado | 1. Bloquear JS en el navegador<br>2. Recargar dashboard | Se ve al menos un mensaje estático "Este dashboard requiere JavaScript" o el HTML base es visible. |

---

## 9. Escalabilidad visual (2+ réplicas)

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-45** | Dashboard funciona con 2 réplicas de auditoría | 1. Escalar: `kubectl scale deployment audit --replicas=2`<br>2. Abrir dashboard<br>3. Generar eventos | El dashboard recibe eventos normalmente. No hay duplicados visibles en la interfaz. |
| **F-46** | Indicador de réplicas activas (opcional) | 1. Escalar a 2 réplicas<br>2. Observar dashboard | (Opcional) El dashboard muestra que el servicio está respaldado por múltiples instancias. |

---

## 10. Pruebas de límite y estrés desde el frontend

| ID | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| **F-47** | Eventos con datos JSON muy grandes | 1. Crear un vino con descripción de 10KB+ de texto<br>2. Ver el detalle en el dashboard | El evento se muestra correctamente. El detalle JSON no congela el navegador. |
| **F-48** | Ráfaga de 50 eventos en 5 segundos | 1. Script que crea 50 entidades rápidamente<br>2. Observar el dashboard | Los eventos aparecen en ráfaga. El navegador no se congela ni crashea. El contador final es 50. |
| **F-49** | Dashboard abierto 30 minutos continuos | 1. Dejar el dashboard abierto 30 min<br>2. Generar eventos intermitentemente | La memoria del navegador no crece descontroladamente. No hay leaks evidentes. Las reconexiones SSE funcionan. |
| **F-50** | Cerrar y reabrir el dashboard repetidamente | 1. Cerrar y abrir el dashboard 10 veces seguidas | Siempre carga correctamente. No hay errores de cache, ni eventos atascados. |

---

## Resumen de cubrimiento

| Área | IDs |
|---|---|
| Carga inicial | F-01 al F-04 |
| Tiempo real (SSE) | F-05 al F-12 |
| Filtros | F-13 al F-20 |
| Detalle JSON | F-21 al F-25 |
| Paginación | F-26 al F-30 |
| Usabilidad | F-31 al F-34 |
| Responsividad | F-35 al F-40 |
| Errores | F-41 al F-44 |
| Escalabilidad | F-45 al F-46 |
| Límite y estrés | F-47 al F-50 |
