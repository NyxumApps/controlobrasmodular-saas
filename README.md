# ObraControl

SaaS multiempresa para constructoras: presupuesto y rentabilidad por obra, incidencias, contratos y pagos a subcontratistas, evidencias, invitaciones y roles.

La referencia funcional y visual es [SPEC_MIGRACION_COMPLETA.md](SPEC_MIGRACION_COMPLETA.md).

## Tecnología

- Monorepo pnpm, TypeScript 5.9, Node 22 o superior
- Web: React 19, Vite 7, Tailwind 4, shadcn/ui (`artifacts/obra-control`)
- API: Express 5, Drizzle ORM (`artifacts/api-server`)
- Supabase: PostgreSQL, Auth y Storage

## Puesta en marcha

1. Instalar dependencias:
   ```bash
   pnpm install
   ```
2. Crear el proyecto en Supabase y aplicar, en orden, los archivos de `supabase/migrations/`.
3. Copiar `.env.example` como `.env` y completar los valores.
4. En Supabase > Authentication > URL Configuration, definir la URL del sitio y agregar `http://localhost:3002/**` a las URL de redirección.
5. Iniciar la API y la web, cada una en su terminal:
   ```bash
   pnpm run dev:api
   ```
   ```bash
   pnpm run dev
   ```

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm run typecheck` | Revisa tipos en todo el repositorio |
| `pnpm run test` | Ejecuta las pruebas (requiere `DATABASE_URL`) |
| `pnpm run build` | Revisa tipos y compila |
| `pnpm --filter @workspace/api-spec run codegen` | Regenera cliente y validadores desde OpenAPI |

## Diferencias frente a la especificación

La especificación describe la versión alojada en Replit. Esta versión cambia solo la infraestructura:

| Tema | Especificación | Esta versión |
|---|---|---|
| Autenticación | Clerk | Supabase Auth, con formularios propios de la misma apariencia |
| Sesión hacia la API | Cookie de Clerk | Encabezado `Authorization: Bearer` |
| Archivos | Google Cloud Storage vía Replit | Bucket privado en Supabase Storage |
| Invitaciones | Correo de Clerk | Correo de Supabase Auth; el token propio concede la membresía |
| Dominios permitidos | `REPLIT_DOMAINS` | `ALLOWED_HOSTS` |
| Columnas `clerk_*` | Identificadores de Clerk | Mismos nombres; guardan el identificador de Supabase Auth |

Rutas, pantallas, textos, roles, reglas de negocio y esquema de base de datos se mantienen.

## Documentación

- [Recomendaciones de calidad, escala y rendimiento](docs/RECOMENDACIONES.md)
- [Libro de marca](docs/marca/LIBRO_DE_MARCA.md)
