import React, { createContext, useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type WorkStatus = 'planificación' | 'en curso' | 'pausada' | 'completada';
export type IncidentStatus = 'abierto' | 'en proceso' | 'resuelto';

export type Work = {
  id: string;
  name: string;
  client: string;
  location: string;
  status: WorkStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate: string;
  manager: string;
};

export type BudgetItem = {
  id: string;
  workId: string;
  code: string;
  name: string;
  budgeted: number;
  spent: number;
  committed: number;
  unit: string;
};

export type Expense = {
  id: string;
  workId: string;
  itemId: string;
  description: string;
  amount: number;
  type: 'material' | 'mano_obra' | 'equipo' | 'subcontrato' | 'otro';
  date: string;
  vendor: string;
};

export type Incident = {
  id: string;
  workId: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: 'alta' | 'media' | 'baja';
  assignee: string;
  createdAt: string;
};

export type Attachment = { id: string; incidentId: string | null; contractId: string | null; fileName: string; contentType: string; size: number; uploadedBy: string; createdAt: string };

export type Subcontractor = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  status: 'activo' | 'inactivo';
};

export type Contract = {
  id: string;
  workId: string;
  subcontractorId: string;
  scope: string;
  amount: number;
  progress: number;
  approvedPaid: number;
  pendingPayment: number;
  evidenceCount: number;
};

export type ModuleSettings = {
  profitability: boolean;
  communications: boolean;
  subcontractors: boolean;
};

export type ValidationMetrics = {
  worksCreated: number;
  worksReviewed: number;
  expensesRegistered: number;
  costAlertsActedOn: number;
  incidencesCreated: number;
  incidencesResolved: number;
  evidenceUploads: number;
  paymentApprovals: number;
  moduleChanges: number;
};

export type StoreState = {
  members: { id: string; clerkUserId: string; role: 'owner_manager' | 'office' | 'site_manager' }[];
  invitations: { id: string; email: string; role: 'office' | 'site_manager'; status: 'pending' | 'accepted' | 'revoked' | 'expired'; expiresAt: string; createdAt: string }[];
  works: Work[];
  budgetItems: BudgetItem[];
  expenses: Expense[];
  incidents: Incident[];
  subcontractors: Subcontractor[];
  contracts: Contract[];
  attachments: Attachment[];
  addressedCostAlerts: string[];
  settings: {
    modules: ModuleSettings;
    role: 'Dueño' | 'Gerente' | 'Oficina' | 'Jefe de obra';
    companyName: string;
  };
  metrics: ValidationMetrics;
};

type StoreContextType = {
  state: StoreState;
  role: 'owner_manager' | 'office' | 'site_manager';
  loading: boolean;
  actions: {
    createWork: (data: Omit<Work, 'id'>) => Promise<void>;
    createExpense: (data: Omit<Expense, 'id'>) => Promise<void>;
    createIncident: (data: Omit<Incident, 'id' | 'status' | 'createdAt'>) => Promise<Incident>;
    changeIncidentStatus: (id: string, status: IncidentStatus) => Promise<void>;
    approvePayment: (id: string, amount: number) => Promise<void>;
    uploadAttachment: (file: File, target: { incidentId?: string; contractId?: string }) => Promise<void>;
    deleteAttachment: (id: string) => Promise<void>;
    updateCompanyName: (name: string) => Promise<void>;
    updateMemberRole: (id: string, role: 'owner_manager' | 'office' | 'site_manager') => Promise<void>;
    inviteMember: (email: string, role: 'office' | 'site_manager') => Promise<void>;
    revokeInvitation: (id: string) => Promise<void>;
    resendInvitation: (id: string) => Promise<void>;
    toggleModule: (module: keyof ModuleSettings, enabled: boolean) => Promise<void>;
    markCostAlert: (id: string) => Promise<void>;
    reviewWork: (id: string) => Promise<void>;
  };
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['bootstrap'], queryFn: async () => {
    const response = await fetch('/api/bootstrap');
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'No se pudo cargar la información compartida');
    return response.json();
  }, staleTime: 10_000 });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] }),
      queryClient.invalidateQueries({ queryKey: ['/audit-events'] }),
    ]);
  };
  const request = async <T = unknown>(path: string, method: string, data?: unknown): Promise<T> => {
    const response = await fetch(`/api${path}`, { method, headers: data ? { 'Content-Type': 'application/json' } : undefined, body: data ? JSON.stringify(data) : undefined });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'No se pudo guardar el cambio');
    const result = response.status === 204 ? undefined : await response.json();
    await refresh();
    return result as T;
  };
  if (query.isError) return <AccessPending error={query.error.message} onCreated={() => query.refetch()} />;
  if (query.isLoading || !query.data) return <div className="min-h-screen grid place-items-center text-muted-foreground">Cargando información compartida…</div>;
  const data = query.data;
  const roleLabels = { owner_manager: 'Dueño' as const, office: 'Oficina' as const, site_manager: 'Jefe de obra' as const };
  const state: StoreState = { members: data.members, invitations: data.invitations, works: data.works, budgetItems: data.budgetItems, expenses: data.expenses, incidents: data.incidents, subcontractors: data.subcontractors, contracts: data.contracts, attachments: data.attachments, addressedCostAlerts: data.addressedCostAlerts, settings: { modules: data.settings, role: roleLabels[data.role as keyof typeof roleLabels], companyName: data.company.name }, metrics: data.metrics };
  const actions: StoreContextType['actions'] = {
    createWork: data => request('/works', 'POST', data),
    createExpense: data => request('/expenses', 'POST', data),
    createIncident: data => request<Incident>('/incidents', 'POST', data),
    changeIncidentStatus: (id, status) => request(`/incidents/${id}/status`, 'PATCH', { status }),
    approvePayment: (id, amount) => request(`/contracts/${id}/payment`, 'PATCH', { amount }),
    uploadAttachment: async (file, target) => {
      const reservation = await request<{ uploadURL: string; objectPath: string }>('/storage/uploads/request-url', 'POST', { name: file.name, size: file.size, contentType: file.type });
      const upload = await fetch(reservation.uploadURL, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!upload.ok) throw new Error((await upload.json().catch(() => null))?.error ?? 'No se pudo transferir el archivo');
      await request('/attachments', 'POST', { objectPath: reservation.objectPath, fileName: file.name, contentType: file.type, size: file.size, ...target });
    },
    deleteAttachment: id => request(`/attachments/${id}`, 'DELETE'),
    updateCompanyName: name => request('/company', 'PATCH', { name }),
    updateMemberRole: (id, role) => request(`/members/${id}/role`, 'PATCH', { role }),
    inviteMember: (email, role) => request('/invitations', 'POST', { email, role }),
    revokeInvitation: id => request(`/invitations/${id}`, 'DELETE'),
    resendInvitation: id => request(`/invitations/${id}/resend`, 'POST'),
    toggleModule: (module, enabled) => request('/settings/modules', 'PATCH', { module, enabled }),
    markCostAlert: id => request(`/cost-alerts/${encodeURIComponent(id)}/address`, 'POST'),
    reviewWork: id => request(`/works/${id}/review`, 'POST'),
  };

  return (
    <StoreContext.Provider value={{ state, role: data.role, loading: query.isFetching, actions }}>
      {children}
    </StoreContext.Provider>
  );
}

function AccessPending({ error, onCreated }: { error: string; onCreated: () => Promise<unknown> }) {
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [creationError, setCreationError] = useState("");
  const createCompany = async () => {
    setSaving(true);
    setCreationError("");
    try {
      const response = await fetch('/api/onboarding/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'No se pudo crear la empresa');
      await onCreated();
    } catch (cause) {
      setCreationError(cause instanceof Error ? cause.message : 'No se pudo crear la empresa');
    } finally {
      setSaving(false);
    }
  };
  return <div className="min-h-screen grid place-items-center p-6"><div className="max-w-lg rounded-xl border bg-card p-6 text-center"><h1 className="text-xl font-semibold">Configura tu acceso</h1><p className="mt-2 text-muted-foreground">{error}</p><p className="mt-5 text-sm text-muted-foreground">Si te invitaron, abre el enlace enviado a tu correo. Si eres el primer dueño, crea una empresa nueva.</p><div className="mt-5 flex gap-2"><input className="h-10 flex-1 rounded-md border bg-background px-3 text-sm" value={companyName} onChange={event => setCompanyName(event.target.value)} placeholder="Nombre de la empresa" aria-label="Nombre de la empresa" /><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={!companyName.trim() || saving} onClick={() => void createCompany()}>{saving ? 'Creando…' : 'Crear empresa'}</button></div>{creationError && <p className="mt-3 text-sm text-destructive">{creationError}</p>}</div></div>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
