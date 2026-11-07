import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatColones, formatPercent } from "@/lib/utils"
import { Users, FileCheck, CheckCircle2 } from "lucide-react"
import { trackEvent } from "@/lib/analytics"
import { FileAttachments } from "@/components/file-attachments"

export default function Subcontratistas() {
  const { state, role, actions } = useStore()
  
  if (!state.settings.modules.subcontractors) {
    return <div className="p-8 text-center text-muted-foreground">Módulo de subcontratistas desactivado.</div>
  }

  const approvePayment = async (contractId: string) => {
    const contract = state.contracts.find(c => c.id === contractId)
    if (!contract || contract.pendingPayment <= 0) return
    await actions.approvePayment(contractId, contract.pendingPayment)
    trackEvent("payment_approved", {
      module: "subcontractors",
      has_evidence: contract.evidenceCount > 0,
      progress_band: contract.progress >= 75 ? "high" : contract.progress >= 25 ? "medium" : "low",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subcontratistas</h1>
        <p className="text-muted-foreground">Gestión de contratos, avances y pagos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">Contratos Activos</h2>
          {state.contracts.map(contract => {
            const sub = state.subcontractors.find(s => s.id === contract.subcontractorId)
            const work = state.works.find(w => w.id === contract.workId)
            
            return (
              <Card key={contract.id}>
                <CardHeader className="pb-3 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{sub?.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{work?.name} • {sub?.specialty}</p>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      Contrato: {formatColones(contract.amount)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm font-medium">Alcance: <span className="font-normal text-muted-foreground">{contract.scope}</span></p>
                  
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Avance Físico</div>
                      <div className="font-bold">{formatPercent(contract.progress)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Pagado</div>
                      <div className="font-bold font-mono">{formatColones(contract.approvedPaid)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Pendiente</div>
                      <div className="font-bold font-mono text-orange-600 dark:text-orange-400">{formatColones(contract.pendingPayment)}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileCheck className="h-4 w-4" />
                      {contract.evidenceCount} evidencias subidas
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <FileAttachments contractId={contract.id} />
                    {contract.pendingPayment > 0 ? (
                       <Button disabled={role === 'site_manager'} onClick={() => approvePayment(contract.id)} size="sm" className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Aprobar Pago
                      </Button>
                    ) : (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Al día
                      </Badge>
                    )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Directorio</h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {state.subcontractors.map(sub => (
                <div key={sub.id} className="p-4 flex items-start gap-3">
                  <div className="bg-secondary p-2 rounded-full mt-0.5">
                    <Users className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{sub.name}</h4>
                    <p className="text-xs text-muted-foreground mb-1">{sub.specialty}</p>
                    <div className="text-xs space-y-0.5 text-foreground/80">
                      <p>{sub.phone}</p>
                      <p>{sub.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
