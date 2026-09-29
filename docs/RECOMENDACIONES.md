# Recomendaciones para un SaaS de calidad, escalable y de alto rendimiento

Estado al 2026-09-28, tras migrar ObraControl de Replit/Clerk a Supabase. Cada punto indica qué pasa hoy, por qué importa y qué hacer. La prioridad va de **P0** (antes de recibir clientes reales) a **P3** (cuando el crecimiento lo pida).

## Resumen

| # | Recomendación | Prioridad | Esfuerzo |
|---|---|---|---|
| 1 | Paginar y dividir `GET /bootstrap` | P0 | Medio |
| 2 | Integridad multiempresa en la base de datos | P0 | Medio |
| 3 | Montos en `bigint` | P0 | Bajo |
| 4 | Siembra de datos piloto fuera de cada solicitud | P0 | Bajo |
| 5 | Correo propio (SMTP) para Supabase Auth | P0 | Bajo |
| 6 | Respaldos y plan de recuperación | P0 | Bajo |
| 7 | Monitoreo de errores y alertas | P1 | Bajo |
| 8 | CI en GitHub con pruebas y revisión obligatoria | P1 | Bajo |
| 9 | Límites de tasa y tareas compartidos entre instancias | P1 | Medio |
| 10 | Migraciones versionadas en lugar de `drizzle-kit push` | P1 | Bajo |
| 11 | Carga directa de archivos con URL firmada | P1 | Medio |
| 12 | Validación de formularios en el navegador | P1 | Medio |
| 13 | Renombrar columnas `clerk_*` | P2 | Bajo |
| 14 | Facturación y planes | P2 | Alto |
| 15 | División del código del navegador | P2 | Bajo |
| 16 | Pruebas de punta a punta | P2 | Medio |
| 17 | Accesibilidad | P2 | Medio |
| 18 | Uso en campo sin conexión | P3 | Alto |
| 19 | Cumplimiento y privacidad | P1 | Medio |
| 20 | Completar funciones inertes | P2 | Medio |

## Rendimiento y escala

### 1. Paginar y dividir `GET /bootstrap` — P0
**Hoy:** una sola llamada devuelve todas las obras, partidas, gastos, incidencias, contratos y adjuntos de la empresa, y se vuelve a pedir completa después de cada cambio.
**Riesgo:** con miles de gastos la respuesta pesa megabytes y cada clic se siente lento, sobre todo en el teléfono.
**Hacer:** dejar en `bootstrap` solo usuario, empresa, rol y módulos. Crear endpoints por recurso con paginación por cursor (`/works`, `/works/:id/expenses?cursor=`), y en el navegador usar una consulta de TanStack Query por recurso, invalidando solo la afectada. Calcular los KPI del portafolio en SQL.

### 4. Siembra de datos piloto fuera de cada solicitud — P0
**Hoy:** `resolveAuthorization` llama a `ensurePilotData` en cada solicitud autenticada: unas 20 sentencias `INSERT ... ON CONFLICT DO NOTHING` por llamada.
**Hacer:** sembrar una sola vez dentro de la transacción de onboarding (hoy queda fuera y un fallo deja la empresa sin datos) y quitar la llamada del middleware. Para clientes reales, que los datos de demostración sean opcionales.

### 9. Estado compartido entre instancias — P1
**Hoy:** el límite de 120 eventos por IP vive en la memoria del proceso. Con dos instancias cada una cuenta por separado, y se pierde al reiniciar.
**Hacer:** llevar el conteo a Postgres o a Redis (Upstash). Mover la limpieza de cargas vencidas a una tarea programada (`pg_cron` de Supabase) en vez de ejecutarla en cada solicitud de carga.

### 11. Carga directa de archivos — P1
**Hoy:** el archivo pasa por el servidor, que lo guarda completo en memoria (hasta 10 MB) antes de enviarlo a Supabase Storage.
**Hacer:** emitir una URL firmada de carga (`createSignedUploadUrl`) para que el navegador suba directo a Storage, y una URL firmada de corta duración para la descarga. El servidor conserva la reserva, la validación de tipo y tamaño, y el registro.

### 15. División del código del navegador — P2
**Hoy:** la compilación avisa de un paquete mayor a 500 kB.
**Hacer:** cargar cada página con `React.lazy`, y quitar dependencias que ninguna pantalla usa (`recharts`, `framer-motion`, `embla-carousel`, `react-icons`, entre otras).

### Conexiones a la base de datos
Usar el *Session pooler* de Supabase (puerto 5432), porque la API usa transacciones con `pg_advisory_xact_lock` y `SELECT ... FOR UPDATE`. Fijar `max` en el `Pool` según el plan de Supabase y el número de instancias. Agregar índices a las llaves foráneas que no los tienen (`expenses.item_id`, `commitments.item_id`, `contracts.subcontractor_id`); el asesor de rendimiento de Supabase los lista.

## Integridad y seguridad de los datos

### 2. Integridad multiempresa en la base de datos — P0
**Hoy:** el aislamiento entre empresas depende de que cada consulta del servidor filtre por `company_id`. Las llaves foráneas no verifican que, por ejemplo, un gasto y su obra sean de la misma empresa.
**Hacer:**
- Llaves foráneas compuestas: `UNIQUE (company_id, id)` en las tablas padre y `FOREIGN KEY (company_id, work_id) REFERENCES works (company_id, id)` en las hijas.
- Restricciones `CHECK`: `progress BETWEEN 0 AND 100`, montos `>= 0`, `end_date >= start_date`, y exactamente uno de `incident_id` / `contract_id` en `attachments`.
- Índice único parcial para una sola invitación pendiente por correo y empresa.
- Ya aplicado en esta migración: RLS activado en todas las tablas y permisos revocados a `anon` y `authenticated`, para que la API REST pública de Supabase no exponga datos.

### 3. Montos en `bigint` — P0
**Hoy:** los montos son `integer` (máximo 2.147.483.647). En colones eso es unos USD 4 millones: una obra grande o la suma de un portafolio lo supera y la operación falla.
**Hacer:** migrar las columnas de dinero a `bigint` y registrar la moneda por empresa.

### 5. Correo propio para autenticación — P0
**Hoy:** las invitaciones y confirmaciones salen por el servicio de correo integrado de Supabase, pensado para pruebas y con un límite muy bajo de envíos por hora.
**Hacer:** configurar SMTP propio (Resend, Postmark o Amazon SES) con dominio verificado (SPF, DKIM, DMARC) y traducir las plantillas al español con la voz de la marca.

### 6. Respaldos — P0
El plan gratuito de Supabase no incluye respaldos automáticos descargables y pausa los proyectos inactivos. Antes de recibir clientes: plan Pro, recuperación a un punto en el tiempo, y un ensayo de restauración documentado.

### 13. Renombrar columnas `clerk_*` — P2
Se conservaron los nombres del DDL de la especificación (`clerk_user_id`, `clerk_invitation_id`, `clerk_revocation_*`), que ahora guardan identificadores de Supabase o quedaron sin uso. Renombrar a `user_id` y eliminar las columnas de reintento de revocación, junto con el tipo generado en OpenAPI.

### 19. Cumplimiento y privacidad — P1
La Ley 8968 de Costa Rica regula el tratamiento de datos personales. Se necesita: política de privacidad y términos de servicio, consentimiento informado, procedimiento para exportar y eliminar los datos de una empresa, y registro de quién accede a qué. Conviene revisarlo con una persona abogada; este documento no es asesoría legal.

### Otros puntos de seguridad
- Encabezados de seguridad con `helmet` y una política de contenido (CSP).
- Límite de tasa en los endpoints autenticados, no solo en analítica.
- Activar en Supabase Auth la protección contra contraseñas filtradas y, para dueños, el segundo factor.
- El repositorio es público: activar en GitHub el escaneo de secretos y la protección de la rama `main`.

## Calidad y operación

### 7. Monitoreo — P1
Enviar los errores del servidor y del navegador a Sentry. Los errores 500 ya devuelven un `requestId` que la persona ve como "Referencia"; con Sentry, soporte puede encontrar el fallo exacto a partir de ese dato. Agregar un monitor externo sobre `/api/healthz` y hacer que ese endpoint compruebe también la base de datos.

### 8. Integración continua — P1
Flujo de GitHub Actions que ejecute `pnpm install --frozen-lockfile`, `pnpm run typecheck`, `pnpm run test` (con un servicio de Postgres) y `pnpm run build` en cada solicitud de cambio, con revisión obligatoria antes de fusionar a `main`.

### 10. Migraciones versionadas — P1
`drizzle-kit push` compara y aplica sin dejar historial, y puede borrar columnas. Usar `drizzle-kit generate` para producir archivos SQL revisables en `supabase/migrations/` y aplicarlos en orden. Probar cada migración en una rama de Supabase antes de producción.

### 16. Pruebas de punta a punta — P2
Las pruebas actuales cubren bien el servidor (roles, aislamiento, invitaciones). Falta Playwright para los recorridos críticos: registro, onboarding, crear obra, registrar gasto con sobregiro, aprobar pago, aceptar invitación.

### Despliegue
La API necesita un proceso persistente (usa transacciones largas y bloqueos), así que conviene un servicio de contenedores (Render, Fly.io, Railway) y no funciones sin servidor. El navegador puede servirse como sitio estático detrás de una CDN, con `/api` enrutado a la API en el mismo dominio. Definir `ALLOWED_HOSTS` con el dominio de producción. Mantener ambientes separados de desarrollo, pruebas y producción.

## Experiencia de uso

### 12. Validación en el navegador — P1
**Hoy:** los formularios dependen del atributo `required` de HTML. El proyecto ya incluye React Hook Form y Zod.
**Hacer:** validar con los esquemas Zod generados desde OpenAPI y mostrar el mensaje junto al campo: fechas coherentes, montos positivos, correo válido. Deshabilitar el botón y mostrar progreso mientras se guarda, y pedir confirmación antes de aprobar un pago o eliminar un archivo.

### 17. Accesibilidad — P2
Agregar `DialogDescription` a los diálogos, etiquetas a los botones de solo ícono, y verificar contraste y navegación con teclado. `index.html` fija `maximum-scale=1`, lo que impide hacer zoom en el teléfono; conviene quitarlo.

### 18. Uso sin conexión — P3
En obra la señal falla. Una PWA con cola de cambios pendientes permitiría registrar gastos e incidencias sin conexión y sincronizar después. Es un trabajo grande; antes conviene medir con clientes piloto cuánto lo necesitan.

### 20. Funciones inertes de la especificación — P2
La especificación documenta controles sin comportamiento, que se dejaron tal cual: "Importar CSV" y "Ver todos los gastos" en el detalle de obra, y el directorio de subcontratistas sin alta ni edición. Son los siguientes candidatos a construir. Tampoco existe una forma de crear partidas de presupuesto ni contratos desde la interfaz: hoy solo llegan por los datos piloto, así que una empresa real no puede cargar su propio presupuesto.

## Producto y negocio

### 14. Facturación y planes — P2
Integrar un proveedor de cobro recurrente y ligar los módulos activos al plan contratado. Hoy cualquier rol de oficina puede activar módulos sin costo. Verificar qué proveedor opera con cuentas bancarias de Costa Rica antes de elegir.

### Analítica
`analytics_events` no guarda empresa, a propósito. Para decisiones de producto conviene una herramienta dedicada (PostHog) con consentimiento, y conservar la tabla actual solo para las métricas anónimas del piloto.
