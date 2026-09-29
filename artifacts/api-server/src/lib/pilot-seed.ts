import { db, worksTable, budgetItemsTable, expensesTable, incidentsTable, subcontractorsTable, contractsTable, commitmentsTable, companySettingsTable, companyMetricsTable } from "@workspace/db";

export async function ensurePilotData(companyId: string): Promise<void> {
  const tenantId = (localId: string) => `${companyId}-${localId}`;
  const works = [
    { id: tenantId("w1"), companyId, name: "Condominio Los Malinches", client: "Desarrollos del Valle", location: "Escazú, San José", status: "en curso" as const, progress: 45, budget: 150000000, startDate: "2023-11-01", endDate: "2024-06-30", manager: "Carlos Ruiz" },
    { id: tenantId("w2"), companyId, name: "Oficinas Sabana Norte", client: "Inversiones Sabana SA", location: "Sabana, San José", status: "en curso" as const, progress: 80, budget: 85000000, startDate: "2023-08-15", endDate: "2024-03-15", manager: "Ana Soto" },
    { id: tenantId("w3"), companyId, name: "Bodegas Coyol", client: "Logística Global", location: "El Coyol, Alajuela", status: "planificación" as const, progress: 5, budget: 220000000, startDate: "2024-02-01", endDate: "2024-11-30", manager: "Luis Méndez" },
  ];
  await db.insert(worksTable).values(works).onConflictDoNothing();
  await db.insert(budgetItemsTable).values([
    { id: tenantId("b1"), companyId, workId: tenantId("w1"), code: "1.01", name: "Movimiento de Tierras", budgeted: 15000000, spent: 14500000, committed: 0, unit: "m3" },
    { id: tenantId("b2"), companyId, workId: tenantId("w1"), code: "2.01", name: "Cimientos y Placas", budgeted: 25000000, spent: 22000000, committed: 3500000, unit: "m3" },
    { id: tenantId("b3"), companyId, workId: tenantId("w1"), code: "3.01", name: "Mampostería Nivel 1", budgeted: 18000000, spent: 10000000, committed: 5000000, unit: "m2" },
    { id: tenantId("b4"), companyId, workId: tenantId("w1"), code: "4.01", name: "Acabados Nivel 1", budgeted: 30000000, spent: 0, committed: 10000000, unit: "glb" },
    { id: tenantId("b5"), companyId, workId: tenantId("w2"), code: "1.01", name: "Estructura Metálica", budgeted: 40000000, spent: 38000000, committed: 2000000, unit: "kg" },
    { id: tenantId("b6"), companyId, workId: tenantId("w2"), code: "2.01", name: "Cerramientos de Vidrio", budgeted: 25000000, spent: 20000000, committed: 5500000, unit: "m2" },
  ]).onConflictDoNothing();
  await db.insert(expensesTable).values([
    { id: tenantId("e1"), companyId, workId: tenantId("w1"), itemId: tenantId("b1"), description: "Alquiler de vagonetas semana 1", amount: 1500000, type: "equipo", date: "2023-11-05", vendor: "Maquinaria CR" },
    { id: tenantId("e2"), companyId, workId: tenantId("w1"), itemId: tenantId("b2"), description: "Concreto premezclado 210", amount: 4500000, type: "material", date: "2023-11-15", vendor: "Holcim" },
    { id: tenantId("e3"), companyId, workId: tenantId("w2"), itemId: tenantId("b5"), description: "Acero estructural", amount: 12000000, type: "material", date: "2023-09-01", vendor: "ArcelorMittal" },
  ]).onConflictDoNothing();
  await db.insert(incidentsTable).values([
    { id: tenantId("i1"), companyId, workId: tenantId("w1"), title: "Retraso en entrega de acero", description: "El proveedor notificó un retraso de 3 días en varilla #4.", status: "en proceso", priority: "alta", assignee: "Carlos Ruiz", createdAt: new Date("2024-01-10T10:00:00Z") },
    { id: tenantId("i2"), companyId, workId: tenantId("w1"), title: "Lluvia afectó chorrea", description: "Se tuvo que posponer la chorrea de placas del sector sur.", status: "resuelto", priority: "media", assignee: "Carlos Ruiz", createdAt: new Date("2024-01-05T14:30:00Z") },
    { id: tenantId("i3"), companyId, workId: tenantId("w2"), title: "Cambio en especificación de vidrio", description: "El arquitecto solicitó vidrio temperado en lugar de laminado en fachada norte.", status: "abierto", priority: "alta", assignee: "Ana Soto", createdAt: new Date("2024-01-12T09:15:00Z") },
  ]).onConflictDoNothing();
  await db.insert(subcontractorsTable).values([
    { id: tenantId("s1"), companyId, name: "Eléctrica del Norte", specialty: "Electricidad", phone: "8888-1111", email: "info@elnorte.cr", status: "activo" },
    { id: tenantId("s2"), companyId, name: "Acabados Finos SA", specialty: "Pintura y Gypsum", phone: "8888-2222", email: "contacto@acabados.cr", status: "activo" },
    { id: tenantId("s3"), companyId, name: "Climatización Total", specialty: "Aire Acondicionado", phone: "8888-3333", email: "ventas@climatotal.cr", status: "activo" },
  ]).onConflictDoNothing();
  await db.insert(contractsTable).values([
    { id: tenantId("c1"), companyId, workId: tenantId("w1"), subcontractorId: tenantId("s1"), scope: "Instalación eléctrica completa etapas 1 y 2", amount: 12000000, progress: 30, approvedPaid: 2000000, pendingPayment: 1500000, evidenceCount: 3 },
    { id: tenantId("c2"), companyId, workId: tenantId("w2"), subcontractorId: tenantId("s3"), scope: "Sistemas VRF en todos los niveles", amount: 18000000, progress: 90, approvedPaid: 15000000, pendingPayment: 1200000, evidenceCount: 12 },
  ]).onConflictDoNothing();
  await db.insert(commitmentsTable).values([
    { id: tenantId("cm1"), companyId, workId: tenantId("w1"), itemId: tenantId("b2"), description: "Concreto comprometido", amount: 3500000 },
    { id: tenantId("cm2"), companyId, workId: tenantId("w1"), itemId: tenantId("b4"), description: "Acabados contratados", amount: 10000000 },
  ]).onConflictDoNothing();
  await db.insert(companySettingsTable).values({ companyId, profitability: true, communications: true, subcontractors: true }).onConflictDoNothing();
  await db.insert(companyMetricsTable).values({ companyId }).onConflictDoNothing();
}