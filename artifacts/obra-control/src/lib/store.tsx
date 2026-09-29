import React, { createContext, useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiJson, toApiError } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

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
    return apiJson<any>('/api/bootstrap');
  }, staleTime: 10_000, retry: (failures, error) => ['offline', 'timeout', 'server'].includes(toApiError(error).kind) && failures < 2 });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] }),
      queryClient.invalidateQueries({ queryKey: ['/audit-events'] }),
    ]);
  };
  // Every change goes through here, so a failure is always explained to the
  // person even when the screen that started it has no error state of its own.
  const notifyFailure = (cause: unknown) => {
    const error = toApiError(cause);
    if (!error.notified) {
      error.notified = true;
      toast({ title: error.title, description: error.requestId ? `${error.message} (Referencia: ${error.requestId})` : error.message });
    }
    return error;
  };
  const request = async <T = unknown>(path: string, method: string, data?: unknown, done?: string): Promise<T> => {
    try {
      const result = await apiJson<T>(`/api${path}`, method, data);
      await refresh();
      if (done) toast({ title: done });
      return result;
    } catch (cause) {
      throw notifyFailure(cause);
    }
  };
  if (query.isError) {
    const failure = toApiError(query.error);
    if (failure.kind === 'permission') return <AccessPending error={failure.message} onCreated={() => query.refetch()} />;
    return <LoadFailed title={failure.title} message={failure.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  }
  if (query.isLoading || !query.data) return <div className="min-h-screen grid place-items-center text-muted-foreground">Cargando información compartida…</div>;
  const data = query.data;
  const roleLabels = { owner_manager: 'Dueño' as const, office: 'Oficina' as const, site_manager: 'Jefe de obra' as const };
  const state: StoreState = { members: data.members, invitations: data.invitations, works: data.works, budgetItems: data.budgetItems, expenses: data.expenses, incidents: data.incidents, subcontractors: data.subcontractors, contracts: data.contracts, attachments: data.attachments, addressedCostAlerts: data.addressedCostAlerts, settings: { modules: data.settings, role: roleLabels[data.role as keyof typeof roleLabels], companyName: data.company.name }, metrics: data.metrics };
  const actions: StoreContextType['actions'] = {
    createWork: data => request('/works', 'POST', data, 'Obra creada'),
    createExpense: data => request('/expenses', 'POST', data, 'Gasto registrado'),
    createIncident: data => request<Incident>('/incidents', 'POST', data, 'Incidencia reportada'),
    changeIncidentStatus: (id, status) => request(`/incidents/${id}/status`, 'PATCH', { status }, 'Estado actualizado'),
    approvePayment: (id, amount) => request(`/contracts/${id}/payment`, 'PATCH', { amount }, 'Pago aprobado'),
    uploadAttachment: async (file, target) => {
      const reservation = await request<{ uploadURL: string; objectPath: string }>('/storage/uploads/request-url', 'POST', { name: file.name, size: file.size, contentType: file.type });
      await apiFetch(reservation.uploadURL, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file, signal: AbortSignal.timeout(120_000) }).catch(cause => { throw notifyFailure(cause); });
      await request('/attachments', 'POST', { objectPath: reservation.objectPath, fileName: file.name, contentType: file.type, size: file.size, ...target });
    },
    deleteAttachment: id => request(`/attachments/${id}`, 'DELETE'),
    updateCompanyName: name => request('/company', 'PATCH', { name }, 'Cambios guardados'),
    updateMemberRole: (id, role) => request(`/members/${id}/role`, 'PATCH', { role }, 'Rol actualizado'),
    inviteMember: (email, role) => request('/invitations', 'POST', { email, role }, 'Invitación enviada'),
    revokeInvitation: id => request(`/invitations/${id}`, 'DELETE'),
    resendInvitation: id => request(`/invitations/${id}/resend`, 'POST'),
    toggleModule: (module, enabled) => request('/settings/modules', 'PATCH', { module, enabled }, enabled ? 'Módulo activado' : 'Módulo desactivado'),
    markCostAlert: id => request(`/cost-alerts/${encodeURIComponent(id)}/address`, 'POST', undefined, 'Alerta marcada como atendida'),
    // Background bookkeeping: a failure here must not interrupt reading the work.
    reviewWork: id => apiJson(`/api/works/${id}/review`, 'POST').then(refresh, () => undefined),
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
      await apiJson('/api/onboarding/company', 'POST', { name: companyName });
      await onCreated();
    } catch (cause) {
      setCreationError(toApiError(cause).message);
    } finally {
      setSaving(false);
    }
  };
  return <div className="min-h-screen grid place-items-center p-6"><div className="max-w-lg rounded-xl border bg-card p-6 text-center"><h1 className="text-xl font-semibold">Configura tu acceso</h1><p className="mt-2 text-muted-foreground">{error}</p><p className="mt-5 text-sm text-muted-foreground">Si te invitaron, abre el enlace enviado a tu correo. Si eres el primer dueño, crea una empresa nueva.</p><div className="mt-5 flex gap-2"><input className="h-10 flex-1 rounded-md border bg-background px-3 text-sm" value={companyName} onChange={event => setCompanyName(event.target.value)} placeholder="Nombre de la empresa" aria-label="Nombre de la empresa" /><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={!companyName.trim() || saving} onClick={() => void createCompany()}>{saving ? 'Creando…' : 'Crear empresa'}</button></div>{creationError && <p className="mt-3 text-sm text-destructive">{creationError}</p>}</div></div>;
}

function LoadFailed({ title, message, onRetry, retrying }: { title: string; message: string; onRetry: () => void; retrying: boolean }) {
  return <div className="min-h-screen grid place-items-center p-6"><div className="max-w-lg rounded-xl border bg-card p-6 text-center"><h1 className="text-xl font-semibold">{title}</h1><p className="mt-2 text-muted-foreground">{message}</p><button className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={retrying} onClick={onRetry}>{retrying ? 'Reintentando…' : 'Intentar de nuevo'}</button></div></div>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
