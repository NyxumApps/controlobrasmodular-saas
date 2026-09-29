-- Seguridad de la API de datos de Supabase.
--
-- ObraControl lee y escribe solo desde su servidor (conexión directa a Postgres),
-- donde se validan empresa y rol. Supabase además publica cada tabla de `public`
-- por su API REST con la clave pública; sin RLS cualquiera podría leerlas.
-- Activar RLS sin políticas cierra esa puerta para `anon` y `authenticated`
-- y no afecta al servidor, que se conecta con el rol dueño de las tablas.

ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."addressed_cost_alerts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."budget_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."commitments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pending_uploads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subcontractors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."works" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
