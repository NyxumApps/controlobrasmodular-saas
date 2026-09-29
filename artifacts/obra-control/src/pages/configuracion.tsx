import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useListAuditEvents } from "@workspace/api-client-react"
import { History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const actionLabels: Record<string, string> = {
  "payment.approved": "Aprobó un pago",
  "member.role_changed": "Cambió el rol de un miembro",
  "module.changed": "Cambió un módulo",
  "cost_alert.addressed": "Marcó una alerta de costo como atendida",
  "invitation.revoked": "Canceló una invitación",
  "invitation.resent": "Reenvió una invitación",
  "invitation.revocation_retry_failed": "No pudo confirmar una cancelación de invitación",
}

const roleLabels: Record<string, string> = {
  owner_manager: "Dueño / Gerente",
  office: "Oficina",
  site_manager: "Jefe de obra",
}

function eventDetail(action: string, details: Record<string, unknown>) {
  if (action === "payment.approved" && typeof details.amount === "number") {
    return `Monto aprobado: ${new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(details.amount)}`
  }
  if (action === "member.role_changed") {
    return `${roleLabels[String(details.fromRole)] ?? details.fromRole} → ${roleLabels[String(details.toRole)] ?? details.toRole}`
  }
  if (action === "module.changed") {
    const modules: Record<string, string> = { profitability: "Rentabilidad", communications: "Comunicaciones", subcontractors: "Subcontratistas" }
    return `${modules[String(details.module)] ?? details.module}: ${details.enabled ? "activado" : "desactivado"}`
  }
  if ((action === "invitation.revoked" || action === "invitation.resent") && typeof details.email === "string") {
    return `Invitación para ${details.email}`
  }
  if (action === "invitation.revocation_retry_failed" && typeof details.attempts === "number") {
    return `La invitación sigue cancelada en ObraControl después de ${details.attempts} intentos. El sistema continuará reintentando.`
  }
  return ""
}

export default function Configuracion() {
  const { state, role, actions } = useStore()
  const { toast } = useToast()
  const auditQuery = useListAuditEvents({ query: { queryKey: ["/audit-events"], enabled: role === "owner_manager", staleTime: 15_000 } })
  const [name, setName] = useState(state.settings.companyName)
  const [inviteEmail, setInviteEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState<'office' | 'site_manager'>('site_manager')
  const [invitationAction, setInvitationAction] = useState<string | null>(null)

  const manageInvitation = async (id: string, action: 'revoke' | 'resend') => {
    setInvitationAction(`${action}:${id}`)
    try {
      if (action === 'revoke') {
        await actions.revokeInvitation(id)
        toast({ title: "Invitación cancelada", description: "El enlace anterior ya no se puede utilizar." })
      } else {
        await actions.resendInvitation(id)
        toast({ title: "Invitación reenviada", description: "Se envió un enlace nuevo con vigencia de siete días." })
      }
    } catch (error) {
      toast({
        title: action === 'revoke' ? "No se pudo cancelar" : "No se pudo reenviar",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setInvitationAction(null)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Ajustes de empresa y simulación de roles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Empresa</CardTitle>
          <CardDescription>Información general visible en reportes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nombre de la Empresa</Label>
            <Input id="companyName" disabled={role !== 'owner_manager'} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <Button disabled={role !== 'owner_manager'} onClick={() => void actions.updateCompanyName(name)}>Guardar Cambios</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipo y permisos</CardTitle>
          <CardDescription>Asigna el nivel de acceso de cada miembro de la empresa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {role === 'owner_manager' && (
            <div className="grid gap-2 rounded-md border bg-muted/30 p-3 sm:grid-cols-[1fr_150px_auto]">
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="persona@empresa.com" aria-label="Correo del compañero" />
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={newMemberRole} onChange={e => setNewMemberRole(e.target.value as 'office' | 'site_manager')}>
                <option value="office">Oficina</option>
                <option value="site_manager">Jefe de obra</option>
              </select>
              <Button disabled={!inviteEmail.trim()} onClick={async () => { await actions.inviteMember(inviteEmail, newMemberRole); setInviteEmail("") }}>Invitar</Button>
            </div>
          )}
          {role === 'owner_manager' && state.invitations.length > 0 && (
            <div className="space-y-2 py-2">
              <p className="text-sm font-medium">Invitaciones</p>
              {state.invitations.map(invitation => (
                <div key={invitation.id} className="flex flex-col justify-between gap-3 rounded-md border border-dashed p-3 text-sm sm:flex-row sm:items-center">
                  <div><div className="font-medium">{invitation.email}</div><div className="text-xs text-muted-foreground">{invitation.role === 'office' ? 'Oficina' : 'Jefe de obra'} · vence {new Date(invitation.expiresAt).toLocaleDateString('es-MX')}</div></div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">{({ pending: 'Pendiente', accepted: 'Aceptada', revoked: 'Cancelada', expired: 'Vencida' } as const)[invitation.status]}</span>
                    {invitation.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={invitationAction !== null}
                        onClick={() => void manageInvitation(invitation.id, 'revoke')}
                      >
                        {invitationAction === `revoke:${invitation.id}` ? "Cancelando…" : "Cancelar"}
                      </Button>
                    )}
                    {(invitation.status === 'expired' || invitation.status === 'revoked') && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={invitationAction !== null}
                        onClick={() => void manageInvitation(invitation.id, 'resend')}
                      >
                        {invitationAction === `resend:${invitation.id}` ? "Reenviando…" : "Reenviar"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {state.members.map((member, index) => (
            <div key={member.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <div className="font-medium">Miembro {index + 1}</div>
                <div className="text-xs text-muted-foreground">{member.clerkUserId === state.members[0]?.clerkUserId ? "Cuenta principal" : "Cuenta del equipo"}</div>
              </div>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                disabled={role !== 'owner_manager'}
                value={member.role}
                onChange={e => void actions.updateMemberRole(member.id, e.target.value as 'owner_manager' | 'office' | 'site_manager')}
              >
                <option value="owner_manager">Dueño / Gerente</option>
                <option value="office">Oficina</option>
                <option value="site_manager">Jefe de obra</option>
              </select>
            </div>
          ))}
        </CardContent>
      </Card>

      {role === "owner_manager" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Actividad reciente</CardTitle>
            <CardDescription>Cambios financieros y de acceso registrados de forma permanente.</CardDescription>
          </CardHeader>
          <CardContent>
            {auditQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando actividad…</p>
            ) : auditQuery.isError ? (
              <p className="text-sm text-destructive">No se pudo cargar la actividad reciente.</p>
            ) : auditQuery.data?.length ? (
              <div className="divide-y">
                {auditQuery.data.map(event => {
                  const memberIndex = state.members.findIndex(member => member.clerkUserId === event.actorUserId)
                  const actor = event.actorUserId === "system"
                    ? "Sistema"
                    : memberIndex >= 0 ? `Miembro ${memberIndex + 1}` : "Miembro anterior"
                  const detail = eventDetail(event.action, event.details)
                  return (
                    <div key={event.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                        <p className="text-sm"><span className="font-medium">{actor}</span> {actionLabels[event.action] ?? event.action}</p>
                        <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.createdAt}>
                          {new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}
                        </time>
                      </div>
                      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay cambios críticos registrados.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed border-2 bg-muted/30">
        <CardHeader>
          <CardTitle>Rol asignado</CardTitle>
          <CardDescription>Los permisos se validan de forma segura en el servidor.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-6 p-4 bg-background rounded-md border text-sm text-muted-foreground">
            <strong>Perspectiva actual ({state.settings.role}):</strong> 
            {state.settings.role === 'Dueño' && " Interesado en rentabilidad global, flujo de caja y salud del portafolio. Vista macro."}
            {state.settings.role === 'Gerente' && " Interesado en desviaciones presupuestales por obra y aprobaciones críticas."}
            {state.settings.role === 'Oficina' && " Interesado en procesar pagos, registrar facturas precisas y conciliar bancos."}
            {state.settings.role === 'Jefe de obra' && " Interesado en avance físico diario, pedir materiales rápido y resolver incidencias de campo."}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
