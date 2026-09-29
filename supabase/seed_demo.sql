-- Datos de demostración opcionales (SPEC_MIGRACION_COMPLETA.md, sección 2).
-- No son necesarios: el onboarding crea la empresa y sus datos piloto.

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
