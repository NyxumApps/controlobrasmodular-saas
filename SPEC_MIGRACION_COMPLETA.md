# SPEC_MIGRACION_COMPLETA — ObraControl

Referencia para reconstruir el proyecto con Cursor, Claude y v0 a partir del código actual. «Actual» es comportamiento observado; «propuesto» es una sustitución para una instalación fuera de Replit. El archivo no traslada por sí mismo usuarios, archivos ni datos.

## SECCIÓN 1: ESPECIFICACIONES DE UI Y FRONTEND (v0)

## Alcance y shell global

**Artefacto:** `artifacts/obra-control`.

**Rutas declaradas en `src/App.tsx` (líneas 78–100):**
- `/`: `HomeRedirect`; autenticado redirige a `/dashboard`, anónimo muestra landing.
- `/sign-in/*?`: Clerk `SignIn`.
- `/sign-up/*?`: Clerk `SignUp`.
- `/invite/:token/*?`: registro/aceptación de invitación.
- `/invite/:token/sign-in/*?`: inicio de sesión desde invitación.
- `/dashboard`: dashboard/portafolio.
- `/obras`: listado.
- `/obras/:id`: detalle de obra.
- `/incidencias`: incidencias, solo funcional si comunicaciones está activo.
- `/subcontratistas`: contratos/directorio, solo funcional si subcontratistas está activo.
- `/validacion`: métricas MVP.
- `/modulos`: switches de módulos.
- `/configuracion`: empresa, miembros, invitaciones, auditoría.
- Cualquier otra: `NotFound`.

Todas las rutas autenticadas pasan por `Show signed-in` + `StoreProvider` + `AppLayout`; las anónimas son redirigidas a `/`. `ErrorBoundary` se reinicia por ubicación. `StoreProvider` carga `/api/bootstrap`; durante carga muestra `Cargando información compartida…`; ante error muestra onboarding `AccessPending`.

### Layout compartido (`src/components/layout.tsx`)
- Desktop (`lg+`): sidebar fijo/pegajoso de `w-64`, alto `h-screen`, borde derecho, encabezado de 16 (`h-16`) con ícono `HardHat` y “ObraControl”; navegación vertical con Dashboard, Obras, módulos condicionales Incidencias y Subcontratistas, Módulos y Configuración.
- Mobile (`<lg`): header fijo `h-16`, logo textual, `UserButton`, botón hamburguesa/X; menú a pantalla completa desde `top-16` cuando `mobileOpen=true`; cada enlace cierra menú.
- Área principal: `pt-16 lg:pt-0`, scroll vertical, padding `p-4 md:p-8`, contenido máximo `max-w-6xl` centrado.
- Activo: `bg-primary text-primary-foreground`; inactivo: `text-muted-foreground`, hover `bg-accent`.
- Pie desktop: `UserButton`, nombre de empresa y rol desde store.
- Navegación condicional: communications controla Incidencias; subcontractors controla Subcontratistas. No hay filtro de navegación por rol para Dashboard/Obras/Módulos/Configuración; las restricciones se aplican dentro de cada página/componente.

## Rutas públicas y autenticación

### `/` anónimo
Landing oscura `min-h-screen bg-slate-950`, centrada, logo, texto “CONTROL DE OBRA”, titular “La información de su obra, compartida y segura.”, subtítulo y dos botones:
- “Crear cuenta”: navega `/sign-up`.
- “Iniciar sesión”: navega `/sign-in`.
No hay validación adicional.

### `/sign-in` y `/sign-up`
Contenedor `min-h-[100dvh]`, `bg-slate-100`, centrado, padding horizontal. Clerk usa apariencia shadcn con tokens explícitos: primary `#0f766e`, foreground `#16332d`, muted `#53716a`, danger `#b91c1c`, background `#fff`, input `#f8fafc`, neutral `#cbd5e1`, fuente `Inter`, radio `0.75rem`; tarjeta de 440 px máx., redondeada `rounded-2xl`, sombra `shadow-xl`. Localización: “Bienvenido de nuevo / Ingresa para continuar a ObraControl” y “Crea tu cuenta / Comienza a coordinar tus obras”. Validaciones y estados (email, contraseña, OTP, errores) pertenecen a Clerk.

### Invitaciones
`/invite/:token` muestra Clerk SignUp al usuario anónimo; al autenticarse hace `POST /api/invitations/accept`, estado inicial “Validando tu invitación…”, éxito limpia queries y navega al success path, error muestra mensaje del servidor. Usuario autenticado ve pantalla centrada con mensaje. `/invite/:token/sign-in` muestra Clerk SignIn con retorno preservando token/query.

## `/dashboard` — Portafolio (`src/pages/dashboard.tsx`)
Layout de espacio vertical `space-y-6`.
- Encabezado: “Portafolio”; “Resumen general de proyectos en ejecución.”
- Cuatro cards KPI: Obras Activas (obras `en curso` / total), Presupuesto Ejecutado (gastos totales / presupuesto de obras activas), Alertas de Costo (líneas donde `spent + committed > budgeted`), Incidencias Abiertas (status distinto de `resuelto`). Importes con `formatColones`, porcentajes con `formatPercent`, importes `font-mono`.
- Dos columnas: “Obras en Curso”, enlaces `/obras/:id`, barra de progreso y ejecutado/presupuesto; estado vacío “No hay obras activas en este momento.”; “Actividad Reciente”, gastos e incidencias recientes derivados de datos, sin acciones.
- Banner “Validación MVP: Semana 3”, texto fijo y enlace activo `/validacion` (“Ver Métricas de Validación”).
- Sin inputs ni validaciones; solo estados derivados y vacíos.
- Sin control explícito por rol en UI; datos dependen del bootstrap/aislamiento del servidor.

## `/obras` — listado y creación (`src/pages/obras/index.tsx`)
- Encabezado “Obras”, subtítulo y botón “Nueva Obra”. El botón/dialogo NO aparece para `site_manager`.
- Búsqueda libre “Buscar obra o ubicación…”; filtra nombre o ubicación, case-insensitive.
- Cards clicables a `/obras/:id`: nombre, badge de status (`En curso`, `Planificación`, `Pausada`, `Completada`), ubicación, fecha inicio `es-CR`, avance, presupuesto y ejecutado. Estado vacío: “No se encontraron obras con ese criterio.”
- Dialog “Registrar Nueva Obra”: inputs requeridos nombre (`text`), cliente (`text`), ubicación (`text`), presupuesto (`number`), fecha inicio (`date`), fecha fin (`date`). HTML `required`; no hay min/rango ni mensaje propio; presupuesto se convierte con `Number`. Submit crea status `planificación`, progreso 0 y manager igual al nombre de empresa. Botones “Cancelar” y “Crear Obra”. Tras éxito cierra y limpia.
- Estados locales: búsqueda, diálogo abierto/cerrado, formulario. No hay spinner/error visual propio si POST falla.
- Permiso UI: `site_manager` no puede crear; otros roles sí. La autorización real se valida servidor-side según texto de Configuración.

## `/obras/:id` — detalle (`src/pages/obras/detail.tsx`)
- Si id inexistente: “Obra no encontrada”. Al montar una obra intenta registrar revisión (`reviewWork`) una sola vez por id y emite analytics.
- Cabecera: volver a `/obras`, nombre, badge de status, ubicación y cliente.
- KPIs: Avance Físico/progress bar, Presupuesto aprobado, Proyectado (gastado + comprometido). Si hay sobregiro muestra alerta y “Marcar alerta atendida”; botón deshabilitado si ya atendida o `site_manager`, texto cambia a “Alerta atendida”.
- Tabla “Líneas de Presupuesto”: código, actividad, presupuesto, gastado, diferencia; sobregiro usa badge destructivo. Vacío “No hay líneas de presupuesto registradas.”
- **Botón “Importar CSV” es inerte:** `variant=outline`, no tiene handler ni diálogo/input.
- “Gastos Recientes”: hasta 5 cards con descripción, proveedor, fecha, importe y tipo. Vacío “No hay gastos registrados.”
- **Botón “Ver todos los gastos” es inerte:** aparece si hay >5, pero no tiene handler/enlace.
- Dialog “Registrar Gasto”: línea de presupuesto (`select required`), monto (`number`, `min=1`, `step=1`, required), descripción required, proveedor required, tipo select (`material`, `mano_obra`, `equipo`, `subcontrato`, `otro`). Handler adicionalmente aborta si línea o monto faltan; no valida NaN, rango superior ni texto. Botones Cancelar/Guardar Gasto. Crea fecha actual, refresca por store.
- Permisos: registrar gasto no está oculto/deshabilitado por rol en UI; marcar alerta sí bloquea `site_manager`. Servidor debe imponer autorización.

## `/incidencias` (`src/pages/incidencias.tsx`)
- Si communications apagado: pantalla centrada “Módulo de comunicaciones desactivado.”; normalmente ruta además desaparece de nav.
- Encabezado + “Reportar Incidencia”. Búsqueda libre por título/descripción. Filtro tipo tabs/botones: `todas`, `abierto`, `en proceso`, `resuelto`; son botones funcionales, no inertes.
- Dialog “Nueva Incidencia”: obra (`select required`), título (`required`), detalle `Textarea required`, prioridad select alta/media/baja, asignado opcional, fotografía opcional con tipos JPG/PNG/WEBP. Texto: máximo 10 MB. Handler exige obra, asigna “Sin asignar”, crea incidencia y luego sube foto si existe. No captura error/spinner en formulario; input foto no reutiliza el componente compartido.
- Cada card: obra, antigüedad localizada en español, título, prioridad coloreada, descripción, adjuntos, asignado, estado y select de cambio de status. Select ofrece “Marcar Abierto”, “En proceso”, “Resolver”. Vacío con icono y texto “No hay incidencias…”.
- No hay restricción de rol en UI para crear/cambiar estados; módulo es el único gate visible.

## `/subcontratistas` (`src/pages/subcontratistas.tsx`)
- Si módulo apagado: “Módulo de subcontratistas desactivado.” y nav condicional.
- Dos columnas: “Contratos Activos” y “Directorio”. Cada contrato muestra subcontratista, obra, especialidad, monto contractual, alcance, avance, pagado, pendiente y evidencias.
- `FileAttachments contractId` para adjuntar/ver/descargar/eliminar evidencia.
- Si pendiente > 0: “Aprobar Pago”; botón `disabled` para `site_manager`. Si pendiente 0: badge “Al día”. No hay confirmación ni estado loading propio.
- Directorio muestra nombre, especialidad, teléfono y email. Sin inputs, búsqueda o CRUD.

## `/modulos` (`src/pages/modulos.tsx`)
Cards para Rentabilidad/Core, Comunicaciones/Incidencias y Subcontratistas.
- Rentabilidad: badge “Módulo Core” con `pointer-events-none` y texto “No se puede desactivar”; no switch.
- Comunicaciones/Subcontratistas: `Switch` controlado por store; `disabled={role === 'site_manager'}`. Toggle llama API y analytics; no hay error/loading propio.
- Descripciones exactas: gestión de presupuesto/líneas/avance/proyección; eventos/bitácora/alertas/asignación; contratos/avances/aprobaciones/pagos.

## `/configuracion` (`src/pages/configuracion.tsx`)
- Encabezado y cards.
- Datos empresa: input nombre, botón “Guardar Cambios”; ambos disabled si no `owner_manager`. No validación de no vacío ni feedback de éxito propio.
- Equipo/permisos: solo owner puede invitar. Input email con type email (pero botón solo exige `trim`, no validación email explícita), select Oficina/Jefe de obra, “Invitar”. Invitaciones muestran correo, rol, vencimiento, estado Pendiente/Aceptada/Cancelada/Vencida. Pendientes: “Cancelar”; vencidas/canceladas: “Reenviar”; acción global bloquea controles mientras opera y muestra “Cancelando…”/“Reenviando…”, toasts de éxito/error.
- Miembros: muestra “Miembro N” (no nombre real); select de roles Dueño/Gerente, Oficina, Jefe de obra; disabled para no-owner.
- Auditoría solo owner: estados cargando/error/vacío/lista; eventos traducidos y detalles de pagos, roles, módulos e invitaciones.
- Panel “Rol asignado”: texto de perspectiva para Dueño/Gerente/Oficina/Jefe de obra. Nota explícita: permisos se validan de forma segura en servidor.

## `/validacion` (`src/pages/validacion.tsx`)
- Clave privada opcional de analítica: password, autocomplete off; botón disabled si vacía; envía header `x-pilot-analytics-key`; clave inválida muestra “La clave no es válida.”. Si no hay métricas agregadas usa `state.metrics`.
- Cards: Regreso semanal, Uso de obras, Alertas Atendidas, Incidencias Resueltas, Pagos Aprobados, Preferencia de módulos.
- Retención por módulo (tres cards), explicación “Cómo leer el piloto” y “Medición segura”. Sin permisos de rol explícitos; endpoint de analytics protege con clave.

## Adjuntos compartidos (`src/components/file-attachments.tsx`)
- Usado en incidencias y contratos. Filtra estrictamente por `incidentId` o `contractId` desde `state.attachments`.
- Input hidden `accept=image/jpeg,image/png,image/webp,application/pdf`; máximo exacto `10 * 1024 * 1024` bytes. Rechazo: toast “Tipo no permitido / Usa JPG, PNG, WEBP o PDF.” o “Archivo demasiado grande / El tamaño máximo es 10 MB.”
- Botón outline dashed: “Adjuntar foto o PDF” o compacto “Adjuntar”; durante subida disabled, spinner y “Cargando…”. Flujo store: reserva URL, PUT al storage, POST metadata `/attachments`; éxito toast “Archivo guardado”; fallo “No se pudo cargar”.
- Lista: icono imagen/PDF, nombre truncado, preview (`target=_blank`), descarga y eliminación. Eliminar muestra toast éxito/error (“Revisa tus permisos.”); no hay confirmación. Compacto sin archivos: “Sin archivos”.
- El componente no inspecciona rol; permisos y aislamiento deben venir del API.

## Tokens visuales exactos (`src/index.css`)
- Fuentes importadas: Plus Jakarta Sans 400/500/600/700/800; Space Mono 400/700; theme `--font-sans: 'Plus Jakarta Sans'`, `--font-mono: 'Space Mono'`.
- Light/root: background `hsl(40 15% 96%)`, foreground `hsl(220 20% 15%)`; card/popover `40 20% 99%`; primary `15 90% 55%`, primary-foreground blanco; secondary `220 15% 90%`; muted `40 10% 92%`, muted-foreground `220 10% 45%`; accent `40 20% 90%`; destructive `0 84% 60%`; border/input `220 10% 85%`; ring `15 90% 55%`; radius `0.25rem`.
- Sidebar: background `220 20% 15%`, foreground `40 20% 96%`, border `220 20% 20%`, primary naranja `15 90% 55%`, accent `220 20% 25%`.
- Dark: background `220 20% 10%`, card `220 20% 14%`, foreground `40 15% 96%`, muted/accent/border/input `220 20% 20%/25%`, primary y destructive iguales.
- Tema global: body `font-sans antialiased bg-background text-foreground`; todos los elementos `border-border`; radios derivados sm `radius-2`, md `radius`, lg `radius+2`.
- Inconsistencia relevante: Clerk usa paleta teal (`#0f766e`) y landing usa `bg-slate-950`/`teal-500`, mientras dashboard interno usa `primary` naranja CSS.

## Botones/controles explícitamente inertes o no implementados
1. `/obras/:id` — “Importar CSV”: sin `onClick`, no input/dialog.
2. `/obras/:id` — “Ver todos los gastos”: sin handler/enlace.
3. `/modulos` — badge “Módulo Core” tiene `pointer-events-none` intencional; no es botón.
4. Dashboard — actividad y métricas son solo lectura; no hay acciones en KPI/cards.
5. Subcontratistas — directorio y contratos no tienen edición/alta.

## Modelo de permisos observado
Roles de store: `owner_manager`, `office`, `site_manager`; etiquetas Dueño, Oficina, Jefe de obra (Configuración también contempla texto Gerente). Restricciones visibles: owner gestiona nombre, invitaciones, revocación/reenvío, roles y auditoría; site manager no crea obra, no marca alerta, no aprueba pagos y no cambia módulos opcionales. El resto de operaciones no tiene gate visual; el código deja claro que la autorización definitiva es server-side.

## SECCIÓN 2: BASE DE DATOS Y PERSISTENCIA

## Archivos inspeccionados
- `lib/db/src/schema/obra-control.ts:6-136` (todo el dominio)
- `lib/db/src/schema/analytics-events.ts:10-27`
- `lib/db/src/schema/index.ts:20-21` exporta ambos
- `lib/db/drizzle.config.ts:8-13`: PostgreSQL, `DATABASE_URL`, schema `src/schema/index.ts`
- Piloto/onboarding: `artifacts/api-server/src/lib/pilot-seed.ts:3-44`, `routes/onboarding.ts:11-37`, test `pilot-seed.integration.test.ts:8-20`.

## Tipos enum PostgreSQL
`membership_role`: `owner_manager`, `office`, `site_manager`.
`invitation_status`: `pending`, `accepted`, `revoked`.
`work_status`: `planificación`, `en curso`, `pausada`, `completada`.
`incident_status`: `abierto`, `en proceso`, `resuelto`.
`incident_priority`: `alta`, `media`, `baja`.
`expense_type`: `material`, `mano_obra`, `equipo`, `subcontrato`, `otro`.
`subcontractor_status`: `activo`, `inactivo`.

## Tablas, columnas y constraints
Todas las longitudes son `varchar(n)` indicadas; salvo notas, `NOT NULL`.

- `companies`: `id varchar(80) PK`; `name varchar(200)`; `created_at timestamptz DEFAULT now()`.
- `memberships`: `id varchar(100) PK`; `company_id varchar(80) FK companies(id) ON DELETE CASCADE`; `clerk_user_id varchar(128)`; `role membership_role DEFAULT site_manager`; `created_at timestamptz DEFAULT now()`. Unique global en `clerk_user_id`.
- `company_invitations`: `id varchar(100) PK`; `company_id varchar(80) FK companies CASCADE`; `email varchar(320)`; `role membership_role`; `token_hash varchar(64)`; `clerk_invitation_id varchar(128) NULL`; `clerk_revocation_pending boolean DEFAULT false`; `clerk_revocation_attempts integer DEFAULT 0`; `clerk_revocation_next_attempt_at timestamptz NULL`; `clerk_revocation_last_attempt_at timestamptz NULL`; `clerk_revocation_last_error varchar(240) NULL`; `status invitation_status DEFAULT pending`; `invited_by_clerk_user_id varchar(128)`; `accepted_by_clerk_user_id varchar(128) NULL`; `expires_at timestamptz`; `accepted_at timestamptz NULL`; `created_at timestamptz DEFAULT now()`. Unique `token_hash`.
- `works`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `name/client/location text`; `status work_status`; `progress integer`; `budget integer`; `start_date/end_date date`; `manager text`.
- `budget_items`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `work_id varchar(80) FK works CASCADE`; `code/name text`; `budgeted integer`; `spent integer DEFAULT 0`; `committed integer DEFAULT 0`; `unit varchar(30)`.
- `expenses`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `work_id varchar(80) FK works CASCADE`; `item_id varchar(80) FK budget_items` (sin acción delete); `description text`; `amount integer`; `type expense_type`; `date date`; `vendor text`.
- `commitments`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `work_id varchar(80) FK works CASCADE`; `item_id varchar(80) NULL FK budget_items` (sin acción delete); `description text`; `amount integer`.
- `incidents`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `work_id varchar(80) FK works CASCADE`; `title/description/assignee text`; `status incident_status`; `priority incident_priority`; `created_at timestamptz DEFAULT now()`.
- `subcontractors`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `name/specialty/phone/email text`; `status subcontractor_status`.
- `contracts`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `work_id varchar(80) FK works CASCADE`; `subcontractor_id varchar(80) FK subcontractors` (sin acción delete); `scope text`; `amount/progress integer`; `approved_paid/pending_payment/evidence_count integer DEFAULT 0`.
- `attachments`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `incident_id varchar(80) NULL FK incidents CASCADE`; `contract_id varchar(80) NULL FK contracts CASCADE`; `object_path text UNIQUE`; `file_name text`; `content_type varchar(160)`; `size integer`; `uploaded_by varchar(128)`; `created_at timestamptz DEFAULT now()`.
- `pending_uploads`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `user_id varchar(128)`; `object_path text UNIQUE`; `file_name text`; `content_type varchar(160)`; `size integer`; `uploaded boolean DEFAULT false`; `expires_at timestamptz`; `created_at timestamptz DEFAULT now()`.
- `company_settings`: `company_id varchar(80) PK/FK companies CASCADE`; `profitability/communications/subcontractors boolean DEFAULT true`.
- `company_metrics`: `company_id varchar(80) PK/FK companies CASCADE`; nueve enteros `works_created`, `works_reviewed`, `expenses_registered`, `cost_alerts_acted_on`, `incidences_created`, `incidences_resolved`, `evidence_uploads`, `payment_approvals`, `module_changes`, todos `DEFAULT 0`.
- `addressed_cost_alerts`: `company_id varchar(80) FK companies CASCADE`; `budget_item_id varchar(80)` sin FK; `addressed_at timestamptz DEFAULT now()`; PK compuesta `(company_id,budget_item_id)`.
- `audit_events`: `id varchar(80) PK`; `company_id varchar(80) FK companies CASCADE`; `actor_user_id varchar(128)`; `action varchar(80)`; `target_id varchar(128) NULL`; `details jsonb DEFAULT '{}'` (NOT NULL); `created_at timestamptz DEFAULT now()`.
- `analytics_events`: `id serial PK`; `event_name varchar(50)`; `visitor_hash varchar(64)`; `module varchar(30)`; `properties jsonb`; `occurred_at timestamptz DEFAULT now()`; no company/tenant FK.

## Índices exactos
`memberships_clerk_user_uq UNIQUE(clerk_user_id)`, `memberships_company_idx(company_id)`.
`company_invitations_token_uq UNIQUE(token_hash)`, `company_invitations_company_idx(company_id)`, `company_invitations_email_idx(email)`, `company_invitations_revocation_retry_idx(clerk_revocation_pending, clerk_revocation_next_attempt_at)`.
`works_company_idx(company_id)`; `budget_items_company_work_idx(company_id,work_id)`; `expenses_company_work_idx(company_id,work_id)`; `commitments_company_work_idx(company_id,work_id)`; `incidents_company_work_idx(company_id,work_id)`; `subcontractors_company_idx(company_id)`; `contracts_company_work_idx(company_id,work_id)`.
`attachments.object_path UNIQUE`, `attachments_company_idx(company_id)`, `attachments_incident_idx(incident_id)`, `attachments_contract_idx(contract_id)`.
`pending_uploads.object_path UNIQUE`, `pending_uploads_company_user_idx(company_id,user_id)`, `pending_uploads_expires_idx(expires_at)`.
`addressed_alerts_company_idx(company_id)`; `audit_events_company_created_idx(company_id,created_at)`.
Analytics: `analytics_events_occurred_at_idx(occurred_at)`, `analytics_events_visitor_idx(visitor_hash)`.

## Seed piloto reproducible
`ensurePilotData(companyId)` deriva todos los IDs como ``${companyId}-${localId}``, por lo que dos empresas no comparten IDs. Inserta secuencialmente: 3 `works` (`w1..w3`), 6 `budget_items` (`b1..b6`), 3 `expenses` (`e1..e3`), 3 `incidents` (`i1..i3`), 3 `subcontractors` (`s1..s3`), 2 `contracts` (`c1..c2`), 2 `commitments` (`cm1..cm2`), una configuración y métricas. Todos los inserts usan `onConflictDoNothing()`, por lo que es idempotente si IDs y valores permanecen iguales; no actualiza datos preexistentes. Debe existir previamente `companies.id=companyId` por FK. El test crea dos companies UUID, ejecuta `Promise.all(ensurePilotData)`, verifica seis obras y ausencia de IDs compartidos, y borra companies (CASCADE).

Onboarding (`routes/onboarding.ts`): exige Clerk `userId`, valida Zod y nombre no vacío; dentro de transacción toma `pg_advisory_xact_lock(hashtext(userId))`, rechaza si ya existe cualquier membership del usuario, crea `company-${randomUUID()}` y `membership-${randomUUID()}` con rol `owner_manager`; después de commit llama `ensurePilotData(companyId)`. La siembra queda fuera de la transacción de onboarding: un fallo puede dejar compañía/membership sin datos piloto. El lock usa `hashtext` (colisiones teóricas).

### Consideraciones de integridad fuera del esquema actual
- El DDL generado debajo contiene los siete `CREATE TYPE`, las 17 tablas, PK/UNIQUE/FK e índices definidos en Drizzle; respetar acentos y nombres exactos de enums/columnas. `serial` implica secuencia para `analytics_events.id`.
- Añadir explícitamente `CHECK` en DDL/migración si se requieren invariantes: `progress BETWEEN 0 AND 100`, importes/tamaños/contadores `>=0`, fechas coherentes, `size` límite y exactamente uno de `incident_id`/`contract_id` para attachments. El schema actual no los declara.
- Riesgo de aislamiento: aunque cada tabla tiene `company_id`, las FKs de `work_id`, `item_id`, `subcontractor_id`, `incident_id`, `contract_id` no verifican que el registro referenciado pertenezca a la misma empresa. Para evitar cruces, usar FKs compuestas (p.ej. `(company_id,work_id)` a `works(company_id,id)`, y equivalentes en todas las relaciones), agregando UNIQUE compuesto en padres; actualmente no existen esos UNIQUE. `addressed_cost_alerts.budget_item_id` ni siquiera tiene FK.
- `attachments` permite ambos NULL o ambos poblados; no hay `CHECK`. `company_invitations` carece de unicidad parcial para una sola invitación pending por email/empresa (resend/concurrencia depende de lógica). `email`, hashes y nombres no tienen normalización/case-insensitive constraints.
- ON DELETE por defecto es `NO ACTION` donde no se especifica: expenses/commitments→budget_items y contracts→subcontractors. CASCADE de companies/works puede chocar con esas relaciones si quedan referencias. `company_id` en hijos sí referencia companies, pero no hay RLS declarada; aislamiento depende de API (`where company_id`) y autorización.
- `analytics_events` no es tenant-scoped deliberadamente en el schema; no debe mezclarse con datos de compañía sin una migración de diseño. `jsonb DEFAULT '{}'` debe emitirse como objeto JSON (`'{}'::jsonb`). Índices de FK no están todos presentes (por ejemplo algunos `company_id` sí, relaciones secundarias no), y los índices no son constraints de integridad.

### DDL SQL PostgreSQL completo

Generado con Drizzle Kit desde el esquema versionado. Ejecutar una vez sobre una base vacía. Las claves foráneas se agregan después de las tablas; ON UPDATE conserva el valor PostgreSQL por defecto NO ACTION. El ORM no define CHECK adicionales y usa identificadores varchar excepto el serial de analítica. Las FKs independientes de company_id y entidad padre no garantizan por sí solas el aislamiento entre empresas: el servidor valida pertenencia. Este DDL representa el código, no una auditoría de drift de producción.

```sql
CREATE TYPE "public"."expense_type" AS ENUM('material', 'mano_obra', 'equipo', 'subcontrato', 'otro');
CREATE TYPE "public"."incident_priority" AS ENUM('alta', 'media', 'baja');
CREATE TYPE "public"."incident_status" AS ENUM('abierto', 'en proceso', 'resuelto');
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'revoked');
CREATE TYPE "public"."membership_role" AS ENUM('owner_manager', 'office', 'site_manager');
CREATE TYPE "public"."subcontractor_status" AS ENUM('activo', 'inactivo');
CREATE TYPE "public"."work_status" AS ENUM('planificación', 'en curso', 'pausada', 'completada');
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" varchar(50) NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"module" varchar(30) NOT NULL,
	"properties" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "addressed_cost_alerts" (
	"company_id" varchar(80) NOT NULL,
	"budget_item_id" varchar(80) NOT NULL,
	"addressed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addressed_cost_alerts_company_id_budget_item_id_pk" PRIMARY KEY("company_id","budget_item_id")
);

CREATE TABLE "attachments" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"incident_id" varchar(80),
	"contract_id" varchar(80),
	"object_path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" varchar(160) NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachments_object_path_unique" UNIQUE("object_path")
);

CREATE TABLE "audit_events" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"actor_user_id" varchar(128) NOT NULL,
	"action" varchar(80) NOT NULL,
	"target_id" varchar(128),
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "budget_items" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"budgeted" integer NOT NULL,
	"spent" integer DEFAULT 0 NOT NULL,
	"committed" integer DEFAULT 0 NOT NULL,
	"unit" varchar(30) NOT NULL
);

CREATE TABLE "commitments" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"item_id" varchar(80),
	"description" text NOT NULL,
	"amount" integer NOT NULL
);

CREATE TABLE "companies" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "company_invitations" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "membership_role" NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"clerk_invitation_id" varchar(128),
	"clerk_revocation_pending" boolean DEFAULT false NOT NULL,
	"clerk_revocation_attempts" integer DEFAULT 0 NOT NULL,
	"clerk_revocation_next_attempt_at" timestamp with time zone,
	"clerk_revocation_last_attempt_at" timestamp with time zone,
	"clerk_revocation_last_error" varchar(240),
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by_clerk_user_id" varchar(128) NOT NULL,
	"accepted_by_clerk_user_id" varchar(128),
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "company_metrics" (
	"company_id" varchar(80) PRIMARY KEY NOT NULL,
	"works_created" integer DEFAULT 0 NOT NULL,
	"works_reviewed" integer DEFAULT 0 NOT NULL,
	"expenses_registered" integer DEFAULT 0 NOT NULL,
	"cost_alerts_acted_on" integer DEFAULT 0 NOT NULL,
	"incidences_created" integer DEFAULT 0 NOT NULL,
	"incidences_resolved" integer DEFAULT 0 NOT NULL,
	"evidence_uploads" integer DEFAULT 0 NOT NULL,
	"payment_approvals" integer DEFAULT 0 NOT NULL,
	"module_changes" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "company_settings" (
	"company_id" varchar(80) PRIMARY KEY NOT NULL,
	"profitability" boolean DEFAULT true NOT NULL,
	"communications" boolean DEFAULT true NOT NULL,
	"subcontractors" boolean DEFAULT true NOT NULL
);

CREATE TABLE "contracts" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"subcontractor_id" varchar(80) NOT NULL,
	"scope" text NOT NULL,
	"amount" integer NOT NULL,
	"progress" integer NOT NULL,
	"approved_paid" integer DEFAULT 0 NOT NULL,
	"pending_payment" integer DEFAULT 0 NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "expenses" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"item_id" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"type" "expense_type" NOT NULL,
	"date" date NOT NULL,
	"vendor" text NOT NULL
);

CREATE TABLE "incidents" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"work_id" varchar(80) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "incident_status" NOT NULL,
	"priority" "incident_priority" NOT NULL,
	"assignee" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "memberships" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"clerk_user_id" varchar(128) NOT NULL,
	"role" "membership_role" DEFAULT 'site_manager' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "pending_uploads" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"object_path" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" varchar(160) NOT NULL,
	"size" integer NOT NULL,
	"uploaded" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pending_uploads_object_path_unique" UNIQUE("object_path")
);

CREATE TABLE "subcontractors" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"name" text NOT NULL,
	"specialty" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"status" "subcontractor_status" NOT NULL
);

CREATE TABLE "works" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"company_id" varchar(80) NOT NULL,
	"name" text NOT NULL,
	"client" text NOT NULL,
	"location" text NOT NULL,
	"status" "work_status" NOT NULL,
	"progress" integer NOT NULL,
	"budget" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"manager" text NOT NULL
);

ALTER TABLE "addressed_cost_alerts" ADD CONSTRAINT "addressed_cost_alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_item_id_budget_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."budget_items"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_metrics" ADD CONSTRAINT "company_metrics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_subcontractor_id_subcontractors_id_fk" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_item_id_budget_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."budget_items"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subcontractors" ADD CONSTRAINT "subcontractors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "works" ADD CONSTRAINT "works_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "analytics_events_occurred_at_idx" ON "analytics_events" USING btree ("occurred_at");
CREATE INDEX "analytics_events_visitor_idx" ON "analytics_events" USING btree ("visitor_hash");
CREATE INDEX "addressed_alerts_company_idx" ON "addressed_cost_alerts" USING btree ("company_id");
CREATE INDEX "attachments_company_idx" ON "attachments" USING btree ("company_id");
CREATE INDEX "attachments_incident_idx" ON "attachments" USING btree ("incident_id");
CREATE INDEX "attachments_contract_idx" ON "attachments" USING btree ("contract_id");
CREATE INDEX "audit_events_company_created_idx" ON "audit_events" USING btree ("company_id","created_at");
CREATE INDEX "budget_items_company_work_idx" ON "budget_items" USING btree ("company_id","work_id");
CREATE INDEX "commitments_company_work_idx" ON "commitments" USING btree ("company_id","work_id");
CREATE UNIQUE INDEX "company_invitations_token_uq" ON "company_invitations" USING btree ("token_hash");
CREATE INDEX "company_invitations_company_idx" ON "company_invitations" USING btree ("company_id");
CREATE INDEX "company_invitations_email_idx" ON "company_invitations" USING btree ("email");
CREATE INDEX "company_invitations_revocation_retry_idx" ON "company_invitations" USING btree ("clerk_revocation_pending","clerk_revocation_next_attempt_at");
CREATE INDEX "contracts_company_work_idx" ON "contracts" USING btree ("company_id","work_id");
CREATE INDEX "expenses_company_work_idx" ON "expenses" USING btree ("company_id","work_id");
CREATE INDEX "incidents_company_work_idx" ON "incidents" USING btree ("company_id","work_id");
CREATE UNIQUE INDEX "memberships_clerk_user_uq" ON "memberships" USING btree ("clerk_user_id");
CREATE INDEX "memberships_company_idx" ON "memberships" USING btree ("company_id");
CREATE INDEX "pending_uploads_company_user_idx" ON "pending_uploads" USING btree ("company_id","user_id");
CREATE INDEX "pending_uploads_expires_idx" ON "pending_uploads" USING btree ("expires_at");
CREATE INDEX "subcontractors_company_idx" ON "subcontractors" USING btree ("company_id");
CREATE INDEX "works_company_idx" ON "works" USING btree ("company_id");
```

### Semillas y datos mínimos reproducibles

La versión actual no define catálogos obligatorios. El onboarding autenticado crea la empresa y su membresía real y ejecuta ensurePilotData con ajustes y métricas por defecto más datos de demostración. Este SQL opcional reproduce exactamente las filas piloto de negocio con IDs locales e inserciones idempotentes; no crea usuarios Clerk falsos. Una base vacía funciona desde el onboarding, no requiere correr el SQL demo. La empresa demo no es accesible desde la UI sin una membresía real creada mediante el flujo de autenticación. Las fechas antiguas son parte del seed de ejemplo del código, no datos vigentes.

```sql
BEGIN;
-- Catálogos globales obligatorios: ninguno. Empresa demo y ajustes, no credenciales ni usuarios ficticios.
INSERT INTO companies (id,name) VALUES ('demo-local','ObraControl Demo') ON CONFLICT (id) DO NOTHING;
INSERT INTO company_settings (company_id,profitability,communications,subcontractors) VALUES ('demo-local',true,true,true) ON CONFLICT (company_id) DO NOTHING;
INSERT INTO company_metrics (company_id) VALUES ('demo-local') ON CONFLICT (company_id) DO NOTHING;
INSERT INTO works (id,company_id,name,client,location,status,progress,budget,start_date,end_date,manager) VALUES
('demo-local-w1','demo-local','Condominio Los Malinches','Desarrollos del Valle','Escazú, San José','en curso',45,150000000,'2023-11-01','2024-06-30','Carlos Ruiz'),
('demo-local-w2','demo-local','Oficinas Sabana Norte','Inversiones Sabana SA','Sabana, San José','en curso',80,85000000,'2023-08-15','2024-03-15','Ana Soto'),
('demo-local-w3','demo-local','Bodegas Coyol','Logística Global','El Coyol, Alajuela','planificación',5,220000000,'2024-02-01','2024-11-30','Luis Méndez') ON CONFLICT (id) DO NOTHING;
INSERT INTO budget_items (id,company_id,work_id,code,name,budgeted,spent,committed,unit) VALUES
('demo-local-b1','demo-local','demo-local-w1','1.01','Movimiento de Tierras',15000000,14500000,0,'m3'),
('demo-local-b2','demo-local','demo-local-w1','2.01','Cimientos y Placas',25000000,22000000,3500000,'m3'),
('demo-local-b3','demo-local','demo-local-w1','3.01','Mampostería Nivel 1',18000000,10000000,5000000,'m2'),
('demo-local-b4','demo-local','demo-local-w1','4.01','Acabados Nivel 1',30000000,0,10000000,'glb'),
('demo-local-b5','demo-local','demo-local-w2','1.01','Estructura Metálica',40000000,38000000,2000000,'kg'),
('demo-local-b6','demo-local','demo-local-w2','2.01','Cerramientos de Vidrio',25000000,20000000,5500000,'m2') ON CONFLICT (id) DO NOTHING;
INSERT INTO expenses (id,company_id,work_id,item_id,description,amount,type,date,vendor) VALUES
('demo-local-e1','demo-local','demo-local-w1','demo-local-b1','Alquiler de vagonetas semana 1',1500000,'equipo','2023-11-05','Maquinaria CR'),
('demo-local-e2','demo-local','demo-local-w1','demo-local-b2','Concreto premezclado 210',4500000,'material','2023-11-15','Holcim'),
('demo-local-e3','demo-local','demo-local-w2','demo-local-b5','Acero estructural',12000000,'material','2023-09-01','ArcelorMittal') ON CONFLICT (id) DO NOTHING;
INSERT INTO incidents (id,company_id,work_id,title,description,status,priority,assignee,created_at) VALUES
('demo-local-i1','demo-local','demo-local-w1','Retraso en entrega de acero','El proveedor notificó un retraso de 3 días en varilla #4.','en proceso','alta','Carlos Ruiz','2024-01-10T10:00:00Z'),
('demo-local-i2','demo-local','demo-local-w1','Lluvia afectó chorrea','Se tuvo que posponer la chorrea de placas del sector sur.','resuelto','media','Carlos Ruiz','2024-01-05T14:30:00Z'),
('demo-local-i3','demo-local','demo-local-w2','Cambio en especificación de vidrio','El arquitecto solicitó vidrio temperado en lugar de laminado en fachada norte.','abierto','alta','Ana Soto','2024-01-12T09:15:00Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO subcontractors (id,company_id,name,specialty,phone,email,status) VALUES
('demo-local-s1','demo-local','Eléctrica del Norte','Electricidad','8888-1111','info@elnorte.cr','activo'),
('demo-local-s2','demo-local','Acabados Finos SA','Pintura y Gypsum','8888-2222','contacto@acabados.cr','activo'),
('demo-local-s3','demo-local','Climatización Total','Aire Acondicionado','8888-3333','ventas@climatotal.cr','activo') ON CONFLICT (id) DO NOTHING;
INSERT INTO contracts (id,company_id,work_id,subcontractor_id,scope,amount,progress,approved_paid,pending_payment,evidence_count) VALUES
('demo-local-c1','demo-local','demo-local-w1','demo-local-s1','Instalación eléctrica completa etapas 1 y 2',12000000,30,2000000,1500000,3),
('demo-local-c2','demo-local','demo-local-w2','demo-local-s3','Sistemas VRF en todos los niveles',18000000,90,15000000,1200000,12) ON CONFLICT (id) DO NOTHING;
INSERT INTO commitments (id,company_id,work_id,item_id,description,amount) VALUES
('demo-local-cm1','demo-local','demo-local-w1','demo-local-b2','Concreto comprometido',3500000),
('demo-local-cm2','demo-local','demo-local-w1','demo-local-b4','Acabados contratados',10000000) ON CONFLICT (id) DO NOTHING;
COMMIT;
```

## SECCIÓN 3: BACKEND, API CONTRACTS Y REGLAS DE NEGOCIO

## Matriz API (base `/api`; evidencia en rutas y OpenAPI)

### Seguridad transversal
- `app.ts:36-50`: host permitido, Clerk middleware, cookies firmadas, JSON; router montado en `/api`.
- `routes/index.ts:14-22`: públicos: `GET /healthz`, analytics, onboarding y aceptación de invitación; invitaciones de gestión llevan su propio `requireAuth`; desde `/bootstrap` en adelante se aplica `requireAuth` global.
- `auth.ts:7-42`: roles exactos `owner_manager`, `office`, `site_manager`; identidad/empresa se obtiene exclusivamente de Clerk + primera membresía DB. Sin sesión: `401 {error:"Unauthorized"}`; usuario autenticado sin membresía: `403 {error:"Tu cuenta todavía no pertenece a una empresa"}`; rol insuficiente: `403 {error:"Forbidden"}`. Toda consulta tenant relevante filtra `companyId`.
- Política (`authorization-policy.ts:8-12`): Owner/Gerente: todo (`company_settings`, `member_roles`, `create_work`, `expense`, `incident`, `incident_status`, `approve_payment`, `evidence`, `cost_alert`, `work_review`, `modules`). Oficina: todo salvo `member_roles`. Responsable de obra: solo `expense`, `incident`, `incident_status`, `evidence`, `work_review`.

### Endpoints exactos
| Método/ruta | Body exacto | Éxito/forma | Ramas principales y permiso |
|---|---|---|---|
| `GET /healthz` | ninguno | 200 `{status:"ok"}` | público |
| `POST /onboarding/company` | `{name:string}` (Zod 1..120; se hace trim y no puede quedar vacío) | 201 `{companyId,role:"owner_manager"}` | 401 sin Clerk; 400 nombre inválido; 409 `{error:"Tu cuenta ya pertenece a una empresa"}`. Crea company + membresía owner bajo advisory lock y siembra datos. Público respecto a membresía. |
| `POST /analytics/events` | `{name,module,properties}`. Eventos: `work_created`/profitability `{initial_status:"planificación"}`; `work_reviewed` `{status}`; `expense_registered` `{expense_type: material|mano_obra|equipo|subcontrato|otro,creates_overrun:boolean}`; `cost_alert_addressed` `{alert_type:"projected_overrun"}`; `incident_created` communications `{priority:alta|media|baja}`; `incident_status_changed` `{from_status,to_status,priority}`; `incident_resolved` `{priority}`; `evidence_upload_selected` subcontractors `{evidence_type:image|document}`; `payment_approved` `{has_evidence:boolean,progress_band:low|medium|high}`; `module_toggled` communications/subcontractors `{enabled:boolean}`. | 204 vacío + cookie visitor firmada | 403 si no same-site; 400 inválido/evento o propiedades extra/faltantes; 429 >120 eventos/IP/hora. Hash SHA-256 del visitor, sin user/company. |
| `GET /analytics/summary` | — | 200 `{totalEvents,weeklyVisitors,returningVisitors,worksCreated,worksReviewed,expensesRegistered,costAlertsActedOn,incidencesCreated,incidencesResolved,evidenceUploads,paymentApprovals,moduleChanges,byModule:{profitability,communications,subcontractors:{currentWeeklyVisitors,previousWeeklyVisitors,returningVisitors,retentionRate}}}` | 403 si no same-site o `x-pilot-analytics-key` no coincide en comparación timing-safe. Retención = `round(returningVisitors/previousVisitors*100)`; si cero, 0. |
| `POST /invitations` | `{email:email,role:"office"|"site_manager"}` | 201 Invitation `{id,email,role,status,expiresAt,createdAt}` | Solo owner (`member_roles`; oficina queda denegada aunque puede cambiar company). 400; 409 correo ya pending vigente; 400 host inválido; 502 Clerk. Token aleatorio 32 bytes, hash DB, vigencia 7 días, lock por company+email, URL `/invite/{token}`. |
| `DELETE /invitations/:id` | — | 200 Invitation revocada | Solo owner; 400 id inválido; 404 otra empresa/no existe; 409 no pending/vencida; 502 Clerk falló (DB queda revocada y marca retry). Auditoría. |
| `POST /invitations/:id/resend` | — | 201 nueva Invitation | Solo owner; 400 id/host; 404; 409 solo revoked/expired o replacement pending; 502 Clerk. Nueva token/vigencia, lock por email; reemplaza vencida a revoked; limpia reserva si fallo. |
| `POST /invitations/accept` | `{token:string}` (32..200) | 200 `{companyId,role}` | 401 no autenticado; 400 body; 409 `{error}` por token inexistente/vencido/usado, email verificado distinto o cuenta ya miembro. Exige email Clerk verificado, lock por hash, crea membresía y marca accepted. |
| `GET /bootstrap` | — | 200 `{user:{id},company,role,members[],invitations[],works[],budgetItems[],expenses[],incidents[],subcontractors[],contracts[],attachments[],commitments[],addressedCostAlerts:string[],settings,metrics}` | 401 contexto ausente. Todo filtrado tenant; invitations solo owner (otros reciben `[]`). Invitaciones pending vencidas se serializan como `expired`; fechas ISO. |
| `POST /works` | `{name,client,location,status,progress,budget,startDate,endDate,manager}` | 201 fila Work; fuerza `status:"planificación"`, `progress:0`, manager `|| ""`, asigna id/company | `create_work`; 400 Zod. Incrementa `metrics.worksCreated`. |
| `POST /expenses` | `{workId,itemId,description,amount,type,date,vendor}` (`amount` entero positivo) | 201 Expense | `expense`; 400; 404 si partida/obra no es misma empresa o item no pertenece a work. Fórmula `budgetItem.spent += amount`, métrica `expensesRegistered++`, transacción. |
| `POST /incidents` | `{workId,title,description,priority,assignee}` | 201 Incident, `createdAt` ISO, status forzado `abierto` | `incident`; 400; 404 obra cross-tenant. `incidencesCreated++`. |
| `PATCH /incidents/:id/status` | `{status:"abierto"|"en proceso"|"resuelto"}` | 200 Incident | `incident_status`; 400 params/body; 404. Si cruza hacia/desde resuelto, `incidencesResolved += +1/-1`; status mismo no cambia métrica. |
| `PATCH /contracts/:id/payment` | `{amount}` entero >0 | 200 contrato actualizado | `approve_payment`; 400 body o amount no válido; 404. Fórmula validación `integer && amount>0 && amount<=pendingPayment`; `approvedPaid += amount`, `pendingPayment -= amount`, métrica +1 y auditoría. Lock transaccional. |
| `PATCH /company` | `{name}` | 200 Company | `company_settings`; 400; actualiza solo company contextual. |
| `PATCH /members/:id/role` | `{role:"owner_manager"|"office"|"site_manager"}` | 200 membresía | Solo owner; 400; 404; 409 si intenta degradar al último owner. Advisory lock; auditoría si cambia. |
| `PATCH /settings/modules` | `{module:"profitability"|"communications"|"subcontractors",enabled:boolean}` | 200 settings | Todos salvo site manager (`modules`); 400; 404 settings inexistentes. Si cambia, `moduleChanges++` + auditoría. |
| `POST /cost-alerts/:id/address` | — | 204 vacío | Todos salvo site manager (`cost_alert`); 400 id; 404 partida ajena/no existe. Insert idempotente (`onConflictDoNothing`); solo primera vez incrementa `costAlertsActedOn` y audita. |
| `POST /works/:id/review` | — | 204 vacío | Todos los roles (`work_review`); 400 id; 404 obra ajena/no existe; `worksReviewed++`. |
| `POST /storage/uploads/request-url` | `{name,size,contentType}`; tipos únicamente `image/jpeg,image/png,image/webp,application/pdf`, 1..10 MiB | 200 `{uploadURL:"/api/storage/uploads/{uuid}/content",objectPath}` | `evidence`; 400 archivo; 429 si >=20 pendientes o reservados >100 MiB. Reserva TTL 15 min por company/user. |
| `PUT /storage/uploads/:id/content` | cuerpo binario; headers `Content-Length` y `Content-Type` deben coincidir exactamente | 204 vacío | Requiere contexto y propietario de reserva; 404 no encontrada/cross-tenant; 410 expirada; 400 headers/tamaño/contenido; 409 usada. |
| `POST /attachments` | `{objectPath,fileName,contentType,size,incidentId XOR contractId}` | 201 Attachment `{id,incidentId,contractId,fileName,contentType,size,uploadedBy,createdAt}` | `evidence`; 400 archivo/destino, mismatch o contenido; 404 parent cross-tenant; 409 pending ausente/usada. Verifica metadata real; contrato `evidenceCount++` y métrica. |
| `GET /attachments/:id/content` | — | 200 stream binario, `Content-Type`, disposition inline y length | Autenticado; 404 incluso params inválidos/no tenant. |
| `DELETE /attachments/:id` | — | 204 vacío | Autenticado; 404; 403 site_manager solo puede borrar sus propios archivos (owner/office cualquiera). Borra DB+objeto; contrato `greatest(evidenceCount-1,0)`. |
| `GET /audit-events` | — | 200 array últimos 50 `{id,actorUserId,action,targetId,details,createdAt}` | Solo owner exacto; 403. Tenant filtrado, desc fecha. |

### Mismatches OpenAPI ↔ implementación
1. OpenAPI no documenta `PUT /storage/uploads/{id}/content` (endpoint esencial del flujo upload), ni sus 400/404/409/410.
2. Casi todas las operaciones protegidas omiten `401` (y varias `400`, `404`, `409`, `429`, `502`) aunque runtime las devuelve; `GET /bootstrap` solo declara 401, no 403 membership-less.
3. OpenAPI declara respuestas demasiado genéricas (`additionalProperties:true`) para onboarding, payment, role, modules y accept; no expresa cuerpos exactos ni errores/mensajes.
4. `POST /works` schema exige `status/progress/manager` y permite valores arbitrarios, pero implementación los ignora/sobrescribe; respuesta siempre planificación/0. `WorkInput` no limita enum ni documenta coerción.
5. `IncidentInput` no documenta que respuesta/creación fuerza `status=abierto`; Incident schema tampoco enumera status/priority.
6. `AttachmentInput` no expresa XOR entre `incidentId` y `contractId`, ni MIME permitidos; OpenAPI permite ambos/ninguno mientras runtime rechaza. Tampoco documenta metadata/content validation y 409.
7. Upload schema permite cualquier `contentType` no vacío, runtime solo cuatro MIME; OpenAPI no documenta cuotas 20/100 MiB ni TTL.
8. OpenAPI dice invitation resend 409 “only expired/revoked”, pero runtime distingue además `already_pending`; create 409 description menciona “already a member”, runtime solo pending duplicate (no comprueba membership email).
9. OpenAPI audit `targetId` requerido en schema pero tabla/serialización puede producir null según definición; enum de acciones omite acciones de invitación (`invitation.revoked`, `invitation.resent`) que sí se insertan.
10. OpenAPI analytics solo documenta 400 para events y no 403 same-site/429; summary omite 403 y requisito header `x-pilot-analytics-key`.
11. OpenAPI no documenta `GET /attachments/:id/content` necesidad de autenticación/tenant ni que params inválidos devuelven 404; tampoco fecha ISO/headers concretos.
12. OpenAPI `CompanyOnboardingInput` minLength 1, pero runtime hace trim (por tanto espacios pasan schema pero fallan 400); `CompanyUpdate` no declara max length aunque Zod puede imponerlo.
13. OpenAPI `/cost-alerts` y `/works/{id}/review` solo declaran 204/403; runtime también 400 y 404. Incident status/payment/role/modules igualmente omiten validación y not-found branches.
14. OpenAPI no declara autorización/roles por operación ni el filtrado tenant; especialmente `/members/:id/role` owner-only, `/audit-events` owner-only, e invitations owner-only, mientras `office` puede `PATCH /company` y módulos.
15. OpenAPI `Invitation.status` enum incluye `expired`, pero DB bootstrap deriva expired solo al serializar pending vencida; revoke/resend persistencia y estados deben entenderse con ese flujo.

Las operaciones JSON requieren Content-Type application/json y sesión Clerk de mismo origen. Los errores controlados usan un objeto JSON con clave error; 204 carece de cuerpo y la descarga devuelve bytes. No existe contrato JSON de 500 en la aplicación: Express 5 delega los errores no capturados a su manejador por defecto, por lo que no se debe asumir una respuesta JSON 500. Un 401 típico es un objeto error con valor Unauthorized; un 403 por rol usa valor Forbidden. Los 400, 404, 409, 410, 429 y 502 dependen de cada ruta y se describen arriba.

### Ejemplos JSON de solicitud y respuesta

Los IDs y fechas de esta tabla son sintéticos. Para respuestas de mutación basadas en Drizzle, se muestran solo los campos diferenciadores de la fila completa; la matriz anterior determina tipo y estados. El JSON de 500 no está definido por el servidor.

| Operación | Solicitud JSON | Respuesta de éxito (extracto) |
|---|---|---|
| GET /healthz | Sin body | `{"status":"ok"}` |
| POST /onboarding/company | `{"name":"ObraControl Demo"}` | `{"companyId":"company-demo","role":"owner_manager"}` |
| POST /analytics/events | `{"name":"work_created","module":"profitability","properties":{"initial_status":"planificación"}}` | 204 sin body |
| POST /invitations | `{"email":"ejemplo@example.org","role":"office"}` | `{"id":"invite-demo","email":"ejemplo@example.org","role":"office","status":"pending","expiresAt":"2026-10-05T00:00:00.000Z","createdAt":"2026-09-28T00:00:00.000Z"}` |
| POST /invitations/accept | `{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}` | `{"companyId":"company-demo","role":"office"}` |
| POST /works | `{"name":"Obra demo","client":"Cliente demo","location":"San José","status":"en curso","progress":50,"budget":1000000,"startDate":"2026-09-01","endDate":"2026-12-31","manager":"Ana"}` | `{"id":"w-demo","companyId":"company-demo","name":"Obra demo","client":"Cliente demo","location":"San José","status":"planificación","progress":0,"budget":1000000,"startDate":"2026-09-01","endDate":"2026-12-31","manager":"Ana"}` |
| POST /expenses | `{"workId":"w-demo","itemId":"b-demo","description":"Materiales","amount":1000,"type":"material","date":"2026-09-28","vendor":"Proveedor demo"}` | `{"id":"e-demo","amount":1000,"type":"material"}` |
| POST /incidents | `{"workId":"w-demo","title":"Retraso","description":"Entrega aplazada","priority":"alta","assignee":"Ana"}` | `{"id":"i-demo","status":"abierto","priority":"alta","createdAt":"2026-09-28T00:00:00.000Z"}` |
| PATCH /incidents/:id/status | `{"status":"resuelto"}` | `{"id":"i-demo","status":"resuelto"}` |
| PATCH /contracts/:id/payment | `{"amount":1000}` | `{"id":"c-demo","approvedPaid":1000,"pendingPayment":0}` |
| PATCH /company | `{"name":"Nuevo nombre"}` | `{"id":"company-demo","name":"Nuevo nombre"}` |
| PATCH /members/:id/role | `{"role":"office"}` | `{"id":"membership-demo","role":"office"}` |
| PATCH /settings/modules | `{"module":"communications","enabled":false}` | `{"companyId":"company-demo","profitability":true,"communications":false,"subcontractors":true}` |
| POST /storage/uploads/request-url | `{"name":"foto.png","size":1024,"contentType":"image/png"}` | `{"uploadURL":"/api/storage/uploads/00000000-0000-4000-8000-000000000000/content","objectPath":"/objects/uploads/00000000-0000-4000-8000-000000000000"}` |
| POST /attachments | `{"objectPath":"/objects/uploads/00000000-0000-4000-8000-000000000000","fileName":"foto.png","contentType":"image/png","size":1024,"incidentId":"i-demo"}` | `{"id":"a-demo","incidentId":"i-demo","contractId":null,"fileName":"foto.png","contentType":"image/png","size":1024,"uploadedBy":"user-demo","createdAt":"2026-09-28T00:00:00.000Z"}` |

Las restantes rutas no reciben JSON: `DELETE /invitations/:id` devuelve la invitación revocada; `POST /invitations/:id/resend` devuelve la nueva invitación; `POST /cost-alerts/:id/address`, `POST /works/:id/review`, `PUT /storage/uploads/:id/content` y `DELETE /attachments/:id` devuelven 204 sin body; el PUT envía bytes y exige Content-Length y Content-Type exactos. `GET /bootstrap` entrega el objeto completo descrito en la matriz, con arrays vacíos cuando no hay filas; `GET /analytics/summary` exige `x-pilot-analytics-key` y devuelve totales/retención por módulo; `GET /audit-events` devuelve arreglo; `GET /attachments/:id/content` devuelve bytes y encabezados de tipo/disposición. Para cada endpoint los errores 400, 401, 403, 404, 409, 410, 429 y 502 solo ocurren cuando la matriz indica esa rama; no se prometen estados no implementados.

## SECCIÓN 4: ÁRBOL DE PROYECTO Y MAPEO DE DEPENDENCIAS

### Árbol compacto (fuente relevante; se omiten `node_modules/`, artefactos `dist/`, mapas y `.tsbuildinfo`)
```
.
├── package.json                         # workspace raíz: typecheck/build/test
├── pnpm-workspace.yaml                  # catálogo pnpm y overrides
├── pnpm-lock.yaml
├── tsconfig.json / tsconfig.base.json
├── .replit / .replitignore              # configuración Replit
├── replit.md                            # operación y arquitectura declarada
├── scripts/
│   ├── package.json, tsconfig.json
│   ├── post-merge.sh
│   └── src/hello.ts
├── artifacts/
│   ├── api-server/                       # API Express, auth, rutas y storage
│   │   ├── package.json, tsconfig.json, build.mjs
│   │   └── src/
│   │       ├── index.ts, app.ts
│   │       ├── middlewares/              # auth Clerk y proxy Clerk
│   │       ├── routes/                   # health, bootstrap, onboarding,
│   │       │                             # mutations, invitations, attachments,
│   │       │                             # audit-events, analytics
│   │       └── lib/                      # storage, logging, seed,
│   │                                     # serialización, políticas,
│   │                                     # integridad multi-tenant e invitaciones;
│   │                                     # tests unitarios/integración
│   ├── obra-control/                     # frontend React/Vite principal
│   │   ├── package.json, vite.config.ts, tsconfig.json, index.html
│   │   ├── public/                       # logo, favicon, robots
│   │   └── src/
│   │       ├── App.tsx, main.tsx, index.css
│   │       ├── components/               # layout, errores, adjuntos, ui/*
│   │       ├── hooks/
│   │       ├── lib/                      # store, analytics, routing invitaciones
│   │       └── pages/                    # dashboard, obras, incidencias,
│   │                                     # subcontratistas, validación,
│   │                                     # módulos, configuración, 404
│   └── mockup-sandbox/                   # sandbox de diseño / preview Canvas
│       ├── package.json, vite.config.ts, tsconfig.json, index.html
│       ├── mockupPreviewPlugin.ts
│       └── src/                          # App, hooks, lib, estilos,
│           ├── components/mockups/       # control-room y obra-control
│           └── components/ui/*
├── lib/
│   ├── db/                               # PostgreSQL + Drizzle
│   │   ├── package.json, drizzle.config.ts
│   │   └── src/index.ts, schema/index.ts,
│   │       schema/obra-control.ts, schema/analytics-events.ts
│   ├── api-spec/                          # OpenAPI fuente + Orval
│   │   ├── openapi.yaml, orval.config.ts, package.json
│   ├── api-zod/                           # validadores/tipos generados
│   └── api-client-react/                  # cliente fetch + hooks React generados
├── attached_assets/                       # prompts/documentación adjunta
└── screenshots/
```
`lib/api-zod/src/generated/` contiene los modelos OpenAPI (company, member, work, incident, expense, contracts, invitations, attachments, analytics, etc.); `lib/api-client-react/src/generated/` contiene API y schemas generados.

### Dependencias/importaciones Replit detectadas
- `@replit/connectors-sdk` en `package.json` raíz; no hay importación de código encontrada. **Reemplazo:** eliminar; usar SDK oficial del proveedor (por ejemplo `@google-cloud/storage`, ya usado) o cliente HTTP/credenciales explícitas.
- `@replit/vite-plugin-cartographer` en `obra-control` y `mockup-sandbox`, cargado dinámicamente sólo cuando `REPL_ID` existe. **Reemplazo:** eliminar; Vite estándar, source maps/IDE y herramientas de inspección del navegador.
- `@replit/vite-plugin-dev-banner` en `obra-control` (sólo configuración). **Reemplazo:** eliminar; banner propio React o ninguno.
- `@replit/vite-plugin-runtime-error-modal` en ambos frontends, importado siempre. **Reemplazo:** `react-error-boundary`/Error Boundary propio (ya existe `components/error-boundary.tsx`) y overlay de Vite estándar.
- `REPL_ID`, `REPLIT_DOMAINS`, `REPLIT_DEV_DOMAIN` y proxy `/api/__clerk` son acoplamientos de despliegue Replit. **Reemplazo:** dominios/configuración de reverse proxy propios (`APP_URL`, `CLERK_PROXY_URL` opcional), o eliminar proxy Clerk si el frontend usa el dominio Clerk directamente.
- `objectStorage.ts` usa credencial externa Replit sidecar `http://127.0.0.1:1106`, `audience: "replit"` y `PRIVATE_OBJECT_DIR`. **Reemplazo:** S3-compatible (AWS S3/MinIO/R2) con `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, o GCS estándar con `GOOGLE_APPLICATION_CREDENTIALS`/Workload Identity y `GCS_BUCKET`.
- `.replit` declara módulos Replit (`nodejs-24`, `postgresql-16`), autoscale/router/workflow/Nix. **Reemplazo:** Node 24 + Postgres local Docker/Neon/Supabase, scripts npm/pnpm y reverse proxy/hosting convencional.
- `@google-cloud/storage`, Clerk, Express, Drizzle y PostgreSQL **no son dependencias Replit**; se pueden conservar al migrar.

### Inventario de archivos versionados

Árbol compacto arriba; inventario expandido de cada archivo de código/configuración versionado. Se omiten adjuntos, capturas y memoria interna del agente.

```text
.gitignore — fuente/configuración en raíz
.npmrc — fuente/configuración en raíz
.replit — fuente/configuración en raíz
.replitignore — fuente/configuración en raíz
artifacts/api-server/.replit-artifact/artifact.toml — registro de artefacto Replit
artifacts/api-server/build.mjs — fuente/configuración en artifacts/api-server
artifacts/api-server/package.json — scripts/dependencias
artifacts/api-server/src/app.ts — fuente/configuración en artifacts/api-server/src
artifacts/api-server/src/index.ts — fuente/configuración en artifacts/api-server/src
artifacts/api-server/src/lib/.gitkeep — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/analytics-policy.test.ts — prueba
artifacts/api-server/src/lib/analytics-policy.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/api-serialization.test.ts — prueba
artifacts/api-server/src/lib/api-serialization.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/authorization-integrity.test.ts — prueba
artifacts/api-server/src/lib/authorization-integrity.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/authorization-policy.test.ts — prueba
artifacts/api-server/src/lib/authorization-policy.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/clerk-invitation-revocations.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/expense-validation.test.ts — prueba
artifacts/api-server/src/lib/invitation-flow.integration.test.ts — prueba
artifacts/api-server/src/lib/invitation-security.test.ts — prueba
artifacts/api-server/src/lib/invitation-security.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/logger.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/objectStorage.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/pilot-seed.integration.test.ts — prueba
artifacts/api-server/src/lib/pilot-seed.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/tenant-integrity.test.ts — prueba
artifacts/api-server/src/lib/tenant-integrity.ts — fuente/configuración en artifacts/api-server/src/lib
artifacts/api-server/src/lib/tenant-routes.integration.test.ts — prueba
artifacts/api-server/src/middlewares/.gitkeep — middleware
artifacts/api-server/src/middlewares/auth.ts — middleware
artifacts/api-server/src/middlewares/clerkProxyMiddleware.test.ts — prueba
artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts — middleware
artifacts/api-server/src/routes/analytics.ts — endpoint
artifacts/api-server/src/routes/attachments.ts — endpoint
artifacts/api-server/src/routes/audit-events.ts — endpoint
artifacts/api-server/src/routes/bootstrap.ts — endpoint
artifacts/api-server/src/routes/health.ts — endpoint
artifacts/api-server/src/routes/index.ts — endpoint
artifacts/api-server/src/routes/invitations.ts — endpoint
artifacts/api-server/src/routes/mutations.ts — endpoint
artifacts/api-server/src/routes/onboarding.ts — endpoint
artifacts/api-server/tsconfig.json — opciones TypeScript
artifacts/mockup-sandbox/.replit-artifact/artifact.toml — registro de artefacto Replit
artifacts/mockup-sandbox/components.json — fuente/configuración en artifacts/mockup-sandbox
artifacts/mockup-sandbox/index.html — fuente/configuración en artifacts/mockup-sandbox
artifacts/mockup-sandbox/mockupPreviewPlugin.ts — fuente/configuración en artifacts/mockup-sandbox
artifacts/mockup-sandbox/package.json — scripts/dependencias
artifacts/mockup-sandbox/src/.generated/mockup-components.ts — fuente/configuración en artifacts/mockup-sandbox/src/.generated
artifacts/mockup-sandbox/src/App.tsx — fuente/configuración en artifacts/mockup-sandbox/src
artifacts/mockup-sandbox/src/components/mockups/control-room/ControlRoom.tsx — prototipo
artifacts/mockup-sandbox/src/components/mockups/control-room/FieldCrewCheckIn.tsx — prototipo
artifacts/mockup-sandbox/src/components/mockups/control-room/PortfolioComparison.tsx — prototipo
artifacts/mockup-sandbox/src/components/mockups/obra-control/ObraControlCommandCenter.tsx — prototipo
artifacts/mockup-sandbox/src/components/mockups/obra-control/ObraControlPolished.tsx — prototipo
artifacts/mockup-sandbox/src/components/mockups/obra-control/ObraControlPortfolio.tsx — prototipo
artifacts/mockup-sandbox/src/components/mockups/obra-control/ObraControlWarmDesk.css — prototipo
artifacts/mockup-sandbox/src/components/mockups/obra-control/ObraControlWarmDesk.tsx — prototipo
artifacts/mockup-sandbox/src/components/mockups/obra-control/PortfolioSplit.tsx — prototipo
artifacts/mockup-sandbox/src/components/ui/accordion.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/alert-dialog.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/alert.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/aspect-ratio.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/avatar.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/badge.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/breadcrumb.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/button-group.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/button.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/calendar.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/card.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/carousel.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/chart.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/checkbox.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/collapsible.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/command.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/context-menu.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/dialog.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/drawer.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/dropdown-menu.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/empty.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/field.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/form.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/hover-card.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/input-group.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/input-otp.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/input.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/item.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/kbd.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/label.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/menubar.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/navigation-menu.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/pagination.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/popover.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/progress.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/radio-group.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/resizable.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/scroll-area.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/select.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/separator.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/sheet.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/sidebar.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/skeleton.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/slider.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/sonner.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/spinner.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/switch.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/table.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/tabs.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/textarea.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/toast.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/toaster.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/toggle-group.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/toggle.tsx — primitiva UI
artifacts/mockup-sandbox/src/components/ui/tooltip.tsx — primitiva UI
artifacts/mockup-sandbox/src/hooks/use-mobile.tsx — fuente/configuración en artifacts/mockup-sandbox/src/hooks
artifacts/mockup-sandbox/src/hooks/use-toast.ts — fuente/configuración en artifacts/mockup-sandbox/src/hooks
artifacts/mockup-sandbox/src/index.css — estilos
artifacts/mockup-sandbox/src/lib/utils.ts — fuente/configuración en artifacts/mockup-sandbox/src/lib
artifacts/mockup-sandbox/src/main.tsx — fuente/configuración en artifacts/mockup-sandbox/src
artifacts/mockup-sandbox/tsconfig.json — opciones TypeScript
artifacts/mockup-sandbox/vite.config.ts — fuente/configuración en artifacts/mockup-sandbox
artifacts/obra-control/.replit-artifact/artifact.toml — registro de artefacto Replit
artifacts/obra-control/components.json — fuente/configuración en artifacts/obra-control
artifacts/obra-control/index.html — fuente/configuración en artifacts/obra-control
artifacts/obra-control/package.json — scripts/dependencias
artifacts/obra-control/public/favicon.svg — activo público
artifacts/obra-control/public/logo.svg — activo público
artifacts/obra-control/public/robots.txt — activo público
artifacts/obra-control/src/App.tsx — fuente/configuración en artifacts/obra-control/src
artifacts/obra-control/src/components/error-boundary.tsx — fuente/configuración en artifacts/obra-control/src/components
artifacts/obra-control/src/components/file-attachments.tsx — fuente/configuración en artifacts/obra-control/src/components
artifacts/obra-control/src/components/layout.tsx — fuente/configuración en artifacts/obra-control/src/components
artifacts/obra-control/src/components/ui/accordion.tsx — primitiva UI
artifacts/obra-control/src/components/ui/alert-dialog.tsx — primitiva UI
artifacts/obra-control/src/components/ui/alert.tsx — primitiva UI
artifacts/obra-control/src/components/ui/aspect-ratio.tsx — primitiva UI
artifacts/obra-control/src/components/ui/avatar.tsx — primitiva UI
artifacts/obra-control/src/components/ui/badge.tsx — primitiva UI
artifacts/obra-control/src/components/ui/breadcrumb.tsx — primitiva UI
artifacts/obra-control/src/components/ui/button-group.tsx — primitiva UI
artifacts/obra-control/src/components/ui/button.tsx — primitiva UI
artifacts/obra-control/src/components/ui/calendar.tsx — primitiva UI
artifacts/obra-control/src/components/ui/card.tsx — primitiva UI
artifacts/obra-control/src/components/ui/carousel.tsx — primitiva UI
artifacts/obra-control/src/components/ui/chart.tsx — primitiva UI
artifacts/obra-control/src/components/ui/checkbox.tsx — primitiva UI
artifacts/obra-control/src/components/ui/collapsible.tsx — primitiva UI
artifacts/obra-control/src/components/ui/command.tsx — primitiva UI
artifacts/obra-control/src/components/ui/context-menu.tsx — primitiva UI
artifacts/obra-control/src/components/ui/dialog.tsx — primitiva UI
artifacts/obra-control/src/components/ui/drawer.tsx — primitiva UI
artifacts/obra-control/src/components/ui/dropdown-menu.tsx — primitiva UI
artifacts/obra-control/src/components/ui/empty.tsx — primitiva UI
artifacts/obra-control/src/components/ui/field.tsx — primitiva UI
artifacts/obra-control/src/components/ui/form.tsx — primitiva UI
artifacts/obra-control/src/components/ui/hover-card.tsx — primitiva UI
artifacts/obra-control/src/components/ui/input-group.tsx — primitiva UI
artifacts/obra-control/src/components/ui/input-otp.tsx — primitiva UI
artifacts/obra-control/src/components/ui/input.tsx — primitiva UI
artifacts/obra-control/src/components/ui/item.tsx — primitiva UI
artifacts/obra-control/src/components/ui/kbd.tsx — primitiva UI
artifacts/obra-control/src/components/ui/label.tsx — primitiva UI
artifacts/obra-control/src/components/ui/menubar.tsx — primitiva UI
artifacts/obra-control/src/components/ui/navigation-menu.tsx — primitiva UI
artifacts/obra-control/src/components/ui/pagination.tsx — primitiva UI
artifacts/obra-control/src/components/ui/popover.tsx — primitiva UI
artifacts/obra-control/src/components/ui/progress.tsx — primitiva UI
artifacts/obra-control/src/components/ui/radio-group.tsx — primitiva UI
artifacts/obra-control/src/components/ui/resizable.tsx — primitiva UI
artifacts/obra-control/src/components/ui/scroll-area.tsx — primitiva UI
artifacts/obra-control/src/components/ui/select.tsx — primitiva UI
artifacts/obra-control/src/components/ui/separator.tsx — primitiva UI
artifacts/obra-control/src/components/ui/sheet.tsx — primitiva UI
artifacts/obra-control/src/components/ui/sidebar.tsx — primitiva UI
artifacts/obra-control/src/components/ui/skeleton.tsx — primitiva UI
artifacts/obra-control/src/components/ui/slider.tsx — primitiva UI
artifacts/obra-control/src/components/ui/sonner.tsx — primitiva UI
artifacts/obra-control/src/components/ui/spinner.tsx — primitiva UI
artifacts/obra-control/src/components/ui/switch.tsx — primitiva UI
artifacts/obra-control/src/components/ui/table.tsx — primitiva UI
artifacts/obra-control/src/components/ui/tabs.tsx — primitiva UI
artifacts/obra-control/src/components/ui/textarea.tsx — primitiva UI
artifacts/obra-control/src/components/ui/toast.tsx — primitiva UI
artifacts/obra-control/src/components/ui/toaster.tsx — primitiva UI
artifacts/obra-control/src/components/ui/toggle-group.tsx — primitiva UI
artifacts/obra-control/src/components/ui/toggle.tsx — primitiva UI
artifacts/obra-control/src/components/ui/tooltip.tsx — primitiva UI
artifacts/obra-control/src/hooks/use-mobile.tsx — fuente/configuración en artifacts/obra-control/src/hooks
artifacts/obra-control/src/hooks/use-toast.ts — fuente/configuración en artifacts/obra-control/src/hooks
artifacts/obra-control/src/index.css — estilos
artifacts/obra-control/src/lib/analytics.ts — fuente/configuración en artifacts/obra-control/src/lib
artifacts/obra-control/src/lib/invitation-routing.test.ts — prueba
artifacts/obra-control/src/lib/invitation-routing.ts — fuente/configuración en artifacts/obra-control/src/lib
artifacts/obra-control/src/lib/store.tsx — fuente/configuración en artifacts/obra-control/src/lib
artifacts/obra-control/src/lib/utils.ts — fuente/configuración en artifacts/obra-control/src/lib
artifacts/obra-control/src/main.tsx — fuente/configuración en artifacts/obra-control/src
artifacts/obra-control/src/pages/configuracion.tsx — página
artifacts/obra-control/src/pages/dashboard.tsx — página
artifacts/obra-control/src/pages/incidencias.tsx — página
artifacts/obra-control/src/pages/modulos.tsx — página
artifacts/obra-control/src/pages/not-found.tsx — página
artifacts/obra-control/src/pages/obras/detail.tsx — página
artifacts/obra-control/src/pages/obras/index.tsx — página
artifacts/obra-control/src/pages/subcontratistas.tsx — página
artifacts/obra-control/src/pages/validacion.tsx — página
artifacts/obra-control/tsconfig.json — opciones TypeScript
artifacts/obra-control/vite.config.ts — fuente/configuración en artifacts/obra-control
lib/api-client-react/package.json — scripts/dependencias
lib/api-client-react/src/custom-fetch.ts — fuente/configuración en lib/api-client-react/src
lib/api-client-react/src/generated/api.schemas.ts — cliente/validación generado de OpenAPI
lib/api-client-react/src/generated/api.ts — cliente/validación generado de OpenAPI
lib/api-client-react/src/index.ts — fuente/configuración en lib/api-client-react/src
lib/api-client-react/tsconfig.json — opciones TypeScript
lib/api-spec/openapi.yaml — fuente/configuración en lib/api-spec
lib/api-spec/orval.config.ts — fuente/configuración en lib/api-spec
lib/api-spec/package.json — scripts/dependencias
lib/api-zod/package.json — scripts/dependencias
lib/api-zod/src/generated/api.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/acceptInvitation200.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/analyticsEvent.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/analyticsEventModule.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/analyticsEventName.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/analyticsEventProperties.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/analyticsSummary.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/analyticsSummaryByModule.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/approveContractPayment200.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/attachment.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/attachmentInput.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/auditEvent.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/auditEventAction.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/auditEventDetails.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/bootstrap.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/bootstrapBudgetItemsItem.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/bootstrapCommitmentsItem.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/bootstrapContractsItem.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/bootstrapMetrics.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/bootstrapRole.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/bootstrapSettings.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/bootstrapSubcontractorsItem.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/company.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/companyOnboardingInput.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/companyUpdate.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/contractPaymentInput.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/expense.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/expenseInput.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/healthStatus.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/incident.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/incidentInput.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/incidentStatusInput.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/incidentStatusInputStatus.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/index.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/invitation.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/invitationAcceptance.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/invitationInput.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/invitationInputRole.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/invitationRole.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/invitationStatus.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/member.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/memberRole.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/memberRoleInput.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/memberRoleInputRole.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/moduleRetention.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/moduleUpdate.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/moduleUpdateModule.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/onboardCompany201.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/toggleModule200.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/updateMemberRole200.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/uploadUrlRequest.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/uploadUrlResponse.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/user.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/work.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/workInput.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/generated/types/workStatus.ts — cliente/validación generado de OpenAPI
lib/api-zod/src/index.ts — fuente/configuración en lib/api-zod/src
lib/api-zod/tsconfig.json — opciones TypeScript
lib/db/drizzle.config.ts — fuente/configuración en lib/db
lib/db/package.json — scripts/dependencias
lib/db/src/index.ts — fuente/configuración en lib/db/src
lib/db/src/schema/analytics-events.ts — esquema Drizzle
lib/db/src/schema/index.ts — esquema Drizzle
lib/db/src/schema/obra-control.ts — esquema Drizzle
lib/db/tsconfig.json — opciones TypeScript
package.json — scripts/dependencias
pnpm-lock.yaml — fuente/configuración en raíz
pnpm-workspace.yaml — fuente/configuración en raíz
replit.md — fuente/configuración en raíz
scripts/package.json — scripts/dependencias
scripts/post-merge.sh — fuente/configuración en scripts
scripts/src/hello.ts — fuente/configuración en scripts/src
scripts/tsconfig.json — opciones TypeScript
tsconfig.base.json — fuente/configuración en raíz
tsconfig.json — opciones TypeScript
```

## SECCIÓN 5: CONFIGURACIÓN DE ENTORNO Y REPRODUCIBILIDAD LOCAL

### Inventario `.env.example` (no existe `.env`, `.env.example` ni otro archivo de secretos en el árbol)
Variables leídas por código/configuración:

| Variable | Uso | Ejemplo seguro |
|---|---|---|
| `DATABASE_URL` | PostgreSQL para Drizzle/pg | `postgresql://app:app@localhost:5432/obracontrol` |
| `PORT` | Puerto API y Vite | `5000` (API; frontend exige también un valor) |
| `BASE_PATH` | base URL Vite | `/` |
| `NODE_ENV` | desarrollo/producción, proxy y cookies | `development` |
| `SESSION_SECRET` | firmado de cookies (`cookie-parser`) | `replace-with-long-random-secret` |
| `CLERK_PUBLISHABLE_KEY` | auth Clerk backend/proxy | `clave-pública-de-ejemplo` |
| `VITE_CLERK_PUBLISHABLE_KEY` | auth Clerk frontend | `clave-pública-de-ejemplo` |
| `CLERK_SECRET_KEY` | Clerk backend y proxy | `clave-secreta-de-ejemplo` |
| `PRIVATE_OBJECT_DIR` | prefijo/directorio de objetos Replit actual | `/objects` (migrar a bucket explícito) |
| `PILOT_ANALYTICS_KEY` | autorización del endpoint de analytics | `local-pilot-key` |
| `LOG_LEVEL` | nivel Pino | `info` |
| `REPL_ID` | activa plugins Replit en dev | *(eliminar fuera de Replit)* |
| `REPLIT_DOMAINS` | allowlist del proxy Clerk | `localhost:5000` *(sustituir)* |
| `REPLIT_DEV_DOMAIN` | dominio dev del proxy Clerk | *(sustituir por dominio local/deploy)* |

También se usa `import.meta.env.PROD` y `import.meta.env.BASE_URL` (flags/base URL provistos por Vite, no secretos). `DATABASE_URL` es obligatoria; `PORT` y `BASE_PATH` son obligatorias para las dos configuraciones Vite; el frontend falla si falta `VITE_CLERK_PUBLISHABLE_KEY`.

Para una migración sin Replit, añadir al template de destino (no leído actualmente): `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (o equivalentes GCS), y sustituir `PRIVATE_OBJECT_DIR`/sidecar.

### Scripts exactos
**Raíz `package.json`:**
- `pnpm run build` → `pnpm run typecheck && pnpm -r --if-present run build`
- `pnpm run test` → `pnpm -r --if-present run test`
- `pnpm run typecheck:libs` → `tsc --build`
- `pnpm run typecheck` → typecheck de libs y artifacts/scripts
- `preinstall` exige pnpm y borra `package-lock.json`/`yarn.lock` (por tanto no usar `npm install`; instalación reproducible: `pnpm install`).

**API:** `pnpm --filter @workspace/api-server run dev` (build + start, `NODE_ENV=development`); `build`; `start`; `test`; `typecheck`.

**Frontend:** `pnpm --filter @workspace/obra-control run dev|build|serve|test|typecheck`; sandbox: `pnpm --filter @workspace/mockup-sandbox run dev|build|preview|typecheck`.

**DB/migraciones:** `pnpm --filter @workspace/db run push` (`drizzle-kit push --config ./drizzle.config.ts`); `push-force` equivalente con `--force`. No hay script `migrate`; el proyecto usa push de Drizzle.

**OpenAPI:** `pnpm --filter @workspace/api-spec run codegen` (`orval --config ./orval.config.ts && pnpm -w run typecheck:libs`).

**Instalación solicitada por el prompt:** el repositorio no soporta `npm install` por su guard `preinstall`; comando correcto exacto es `pnpm install` (Node 24, pnpm workspace).

### Plantilla .env.example para el estado actual

Estas claves enumeran las lecturas de código y configuraciones. Son valores demostrativos no funcionales; el administrador debe proporcionar credenciales propias de Clerk y PostgreSQL fuera de Replit. `REPL_ID` debe permanecer sin definir fuera de Replit. `BASE_URL` y `PROD` son banderas generadas por Vite, no variables que se configuren manualmente. Para el frontend y API en hosts separados, configurar proxy /api del frontend a la API y Clerk para el origen correcto.

```dotenv
DATABASE_URL=postgresql://app:app@localhost:5432/obracontrol
PORT=5000
BASE_PATH=/
NODE_ENV=development
SESSION_SECRET=change-this-local-example-to-a-long-random-value
CLERK_PUBLISHABLE_KEY=own-clerk-public-key
VITE_CLERK_PUBLISHABLE_KEY=own-clerk-public-key
CLERK_SECRET_KEY=own-clerk-secret-key
PRIVATE_OBJECT_DIR=/example-bucket/private
PILOT_ANALYTICS_KEY=change-this-local-example-to-a-long-random-value
LOG_LEVEL=info
REPLIT_DOMAINS=localhost
REPLIT_DEV_DOMAIN=localhost
```

`DATABASE_URL` es necesaria para DB y Drizzle Kit; `PORT` determina la escucha API y la configuración Vite (ejecutar ambos servicios con puertos distintos); `BASE_PATH` determina la base Vite; `VITE_CLERK_PUBLISHABLE_KEY` es necesaria para renderizar la UI; `CLERK_SECRET_KEY` habilita invitaciones y proxy Clerk de producción; `SESSION_SECRET` firma la cookie analítica; `PILOT_ANALYTICS_KEY` habilita resumen analítico; `PRIVATE_OBJECT_DIR` es necesario para adjuntos pero **no** basta para quitar la dependencia del sidecar de credenciales Replit. `REPLIT_DOMAINS`/`REPLIT_DEV_DOMAIN` se usan en la allowlist actual y deben sustituirse en código por dominios propios antes del despliegue externo. El valor de `NODE_ENV` decide cookie segura y proxy Clerk. `LOG_LEVEL` configura Pino. Las credenciales de producción se guardan en un administrador de secretos, no en el repositorio.

**Propuesto, no implementado:** para sustituir el sidecar por S3 compatible, añadir configuración `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` y reescribir la conexión de objectStorage; con GCS estándar, usar `GOOGLE_APPLICATION_CREDENTIALS` o Workload Identity y `GCS_BUCKET`. Ninguna de esas variables S3/GCS es leída por la aplicación actual. Al trasladar archivos existentes, migrar tanto los objetos como sus referencias en la tabla attachments y verificar cada relación empresa/objeto. Si Clerk actual es gestionado por Replit, obtener un tenant externo, coordinar identidad de usuarios y remapear los Clerk user IDs de memberships/invitations antes de abrir acceso; no basta con copiar las claves actuales.

**Ejecución exacta del repositorio:** Node 24 y pnpm; `pnpm install`; `pnpm --filter @workspace/db run push` sobre una base de desarrollo vacía (no ejecutar push-force sobre datos reales); `pnpm --filter @workspace/api-spec run codegen`; `pnpm --filter @workspace/api-server run dev`; en otro proceso y con `PORT` frontend distinto, `pnpm --filter @workspace/obra-control run dev`; `pnpm run typecheck`, `pnpm run test`, `pnpm run build`. El root `preinstall` rechaza npm y no existe `npm run dev` raíz ni `db:migrate`: no usarlos. Una vez generado el SQL de esta especificación, se puede cargar en una base PostgreSQL vacía mediante `psql -d obracontrol -f schema.sql`, pero no correr a continuación `push` sin comprobar diferencias.

## SECCIÓN 6: CÓDIGO FUENTE DE LOS ESQUEMAS

Los tres archivos siguientes son la transcripción completa de las definiciones Drizzle y sus reexportaciones. El repositorio no declara tipos TypeScript exportados de selección/inserción por tabla; Drizzle permite derivarlos con typeof tabla.$inferSelect y typeof tabla.$inferInsert. No se atribuyen exports inexistentes.

### lib/db/src/schema/obra-control.ts

```ts
import {
  boolean, date, index, integer, jsonb, pgEnum, pgTable, primaryKey,
  text, timestamp, uniqueIndex, varchar,
} from "drizzle-orm/pg-core";

export const membershipRole = pgEnum("membership_role", ["owner_manager", "office", "site_manager"]);

export const invitationStatus = pgEnum("invitation_status", ["pending", "accepted", "revoked"]);
export const workStatus = pgEnum("work_status", ["planificación", "en curso", "pausada", "completada"]);
export const incidentStatus = pgEnum("incident_status", ["abierto", "en proceso", "resuelto"]);
export const incidentPriority = pgEnum("incident_priority", ["alta", "media", "baja"]);
export const expenseType = pgEnum("expense_type", ["material", "mano_obra", "equipo", "subcontrato", "otro"]);
export const subcontractorStatus = pgEnum("subcontractor_status", ["activo", "inactivo"]);

export const companiesTable = pgTable("companies", {
  id: varchar("id", { length: 80 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const membershipsTable = pgTable("memberships", {
  id: varchar("id", { length: 100 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  clerkUserId: varchar("clerk_user_id", { length: 128 }).notNull(),
  role: membershipRole("role").notNull().default("site_manager"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("memberships_clerk_user_uq").on(t.clerkUserId), index("memberships_company_idx").on(t.companyId)]);

export const companyInvitationsTable = pgTable("company_invitations", {
  id: varchar("id", { length: 100 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  role: membershipRole("role").notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  clerkInvitationId: varchar("clerk_invitation_id", { length: 128 }),
  clerkRevocationPending: boolean("clerk_revocation_pending").notNull().default(false),
  clerkRevocationAttempts: integer("clerk_revocation_attempts").notNull().default(0),
  clerkRevocationNextAttemptAt: timestamp("clerk_revocation_next_attempt_at", { withTimezone: true }),
  clerkRevocationLastAttemptAt: timestamp("clerk_revocation_last_attempt_at", { withTimezone: true }),
  clerkRevocationLastError: varchar("clerk_revocation_last_error", { length: 240 }),
  status: invitationStatus("status").notNull().default("pending"),
  invitedByClerkUserId: varchar("invited_by_clerk_user_id", { length: 128 }).notNull(),
  acceptedByClerkUserId: varchar("accepted_by_clerk_user_id", { length: 128 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  uniqueIndex("company_invitations_token_uq").on(t.tokenHash),
  index("company_invitations_company_idx").on(t.companyId),
  index("company_invitations_email_idx").on(t.email),
  index("company_invitations_revocation_retry_idx").on(t.clerkRevocationPending, t.clerkRevocationNextAttemptAt),
]);
export const worksTable = pgTable("works", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(), client: text("client").notNull(), location: text("location").notNull(), status: workStatus("status").notNull(),
  progress: integer("progress").notNull(), budget: integer("budget").notNull(), startDate: date("start_date", { mode: "string" }).notNull(), endDate: date("end_date", { mode: "string" }).notNull(), manager: text("manager").notNull(),
}, t => [index("works_company_idx").on(t.companyId)]);
export const budgetItemsTable = pgTable("budget_items", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), code: text("code").notNull(), name: text("name").notNull(),
  budgeted: integer("budgeted").notNull(), spent: integer("spent").notNull().default(0), committed: integer("committed").notNull().default(0), unit: varchar("unit", { length: 30 }).notNull(),
}, t => [index("budget_items_company_work_idx").on(t.companyId, t.workId)]);
export const expensesTable = pgTable("expenses", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), itemId: varchar("item_id", { length: 80 }).notNull().references(() => budgetItemsTable.id),
  description: text("description").notNull(), amount: integer("amount").notNull(), type: expenseType("type").notNull(), date: date("date", { mode: "string" }).notNull(), vendor: text("vendor").notNull(),
}, t => [index("expenses_company_work_idx").on(t.companyId, t.workId)]);
export const commitmentsTable = pgTable("commitments", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), itemId: varchar("item_id", { length: 80 }).references(() => budgetItemsTable.id), description: text("description").notNull(), amount: integer("amount").notNull(),
}, t => [index("commitments_company_work_idx").on(t.companyId, t.workId)]);
export const incidentsTable = pgTable("incidents", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), title: text("title").notNull(), description: text("description").notNull(), status: incidentStatus("status").notNull(), priority: incidentPriority("priority").notNull(), assignee: text("assignee").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("incidents_company_work_idx").on(t.companyId, t.workId)]);
export const subcontractorsTable = pgTable("subcontractors", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(), specialty: text("specialty").notNull(), phone: text("phone").notNull(), email: text("email").notNull(), status: subcontractorStatus("status").notNull(),
}, t => [index("subcontractors_company_idx").on(t.companyId)]);
export const contractsTable = pgTable("contracts", {
  id: varchar("id", { length: 80 }).primaryKey(), companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  workId: varchar("work_id", { length: 80 }).notNull().references(() => worksTable.id, { onDelete: "cascade" }), subcontractorId: varchar("subcontractor_id", { length: 80 }).notNull().references(() => subcontractorsTable.id),
  scope: text("scope").notNull(), amount: integer("amount").notNull(), progress: integer("progress").notNull(), approvedPaid: integer("approved_paid").notNull().default(0), pendingPayment: integer("pending_payment").notNull().default(0), evidenceCount: integer("evidence_count").notNull().default(0),
}, t => [index("contracts_company_work_idx").on(t.companyId, t.workId)]);

export const attachmentsTable = pgTable("attachments", {
  id: varchar("id", { length: 80 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  incidentId: varchar("incident_id", { length: 80 }).references(() => incidentsTable.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id", { length: 80 }).references(() => contractsTable.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull().unique(),
  fileName: text("file_name").notNull(),
  contentType: varchar("content_type", { length: 160 }).notNull(),
  size: integer("size").notNull(),
  uploadedBy: varchar("uploaded_by", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index("attachments_company_idx").on(t.companyId),
  index("attachments_incident_idx").on(t.incidentId),
  index("attachments_contract_idx").on(t.contractId),
]);

export const pendingUploadsTable = pgTable("pending_uploads", {
  id: varchar("id", { length: 80 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 128 }).notNull(),
  objectPath: text("object_path").notNull().unique(),
  fileName: text("file_name").notNull(),
  contentType: varchar("content_type", { length: 160 }).notNull(),
  size: integer("size").notNull(),
  uploaded: boolean("uploaded").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index("pending_uploads_company_user_idx").on(t.companyId, t.userId),
  index("pending_uploads_expires_idx").on(t.expiresAt),
]);
export const companySettingsTable = pgTable("company_settings", {
  companyId: varchar("company_id", { length: 80 }).primaryKey().references(() => companiesTable.id, { onDelete: "cascade" }),
  profitability: boolean("profitability").notNull().default(true), communications: boolean("communications").notNull().default(true), subcontractors: boolean("subcontractors").notNull().default(true),
});
export const companyMetricsTable = pgTable("company_metrics", {
  companyId: varchar("company_id", { length: 80 }).primaryKey().references(() => companiesTable.id, { onDelete: "cascade" }),
  worksCreated: integer("works_created").notNull().default(0), worksReviewed: integer("works_reviewed").notNull().default(0), expensesRegistered: integer("expenses_registered").notNull().default(0), costAlertsActedOn: integer("cost_alerts_acted_on").notNull().default(0), incidencesCreated: integer("incidences_created").notNull().default(0), incidencesResolved: integer("incidences_resolved").notNull().default(0), evidenceUploads: integer("evidence_uploads").notNull().default(0), paymentApprovals: integer("payment_approvals").notNull().default(0), moduleChanges: integer("module_changes").notNull().default(0),
});
export const addressedCostAlertsTable = pgTable("addressed_cost_alerts", {
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }), budgetItemId: varchar("budget_item_id", { length: 80 }).notNull(), addressedAt: timestamp("addressed_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.companyId, t.budgetItemId] }), index("addressed_alerts_company_idx").on(t.companyId)]);
export const auditEventsTable = pgTable("audit_events", {
  id: varchar("id", { length: 80 }).primaryKey(),
  companyId: varchar("company_id", { length: 80 }).notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  actorUserId: varchar("actor_user_id", { length: 128 }).notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  targetId: varchar("target_id", { length: 128 }),
  details: jsonb("details").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("audit_events_company_created_idx").on(t.companyId, t.createdAt)]);
```

### lib/db/src/schema/analytics-events.ts

```ts
import {
  index,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const analyticsEventsTable = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    eventName: varchar("event_name", { length: 50 }).notNull(),
    visitorHash: varchar("visitor_hash", { length: 64 }).notNull(),
    module: varchar("module", { length: 30 }).notNull(),
    properties: jsonb("properties")
      .$type<Record<string, string | number | boolean>>()
      .notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("analytics_events_occurred_at_idx").on(table.occurredAt),
    index("analytics_events_visitor_idx").on(table.visitorHash),
  ],
);
```

### lib/db/src/schema/index.ts

```ts
// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

export * from "./analytics-events";
export * from "./obra-control";
```
