import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, MessageSquare, Users, ShieldAlert } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

export default function Modulos() {
  const { state, role, actions } = useStore()

  const toggleModule = async (module: keyof typeof state.settings.modules) => {
    const enabled = !state.settings.modules[module]
    await actions.toggleModule(module, enabled)
    trackEvent("module_toggled", { module, enabled })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Módulos</h1>
        <p className="text-muted-foreground">Activa o desactiva funcionalidades según las necesidades de tu empresa.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary text-primary-foreground rounded-md">
                <Building2 className="h-5 w-5" />
              </div>
              <CardTitle>Rentabilidad y Control</CardTitle>
            </div>
            <CardDescription className="pt-2">
              Gestión de presupuesto, líneas de costo, avance físico y proyección.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="default" className="pointer-events-none">Módulo Core</Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4" /> No se puede desactivar
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={state.settings.modules.communications ? "border-primary/30" : "opacity-75"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${state.settings.modules.communications ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <MessageSquare className="h-5 w-5" />
                </div>
                <CardTitle>Comunicaciones (Incidencias)</CardTitle>
              </div>
              <Switch 
                disabled={role === 'site_manager'}
                checked={state.settings.modules.communications} 
                onCheckedChange={() => toggleModule('communications')} 
              />
            </div>
            <CardDescription className="pt-2">
              Registro de eventos, bitácora de campo, alertas y asignación de tareas rápidas.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className={state.settings.modules.subcontractors ? "border-primary/30" : "opacity-75"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${state.settings.modules.subcontractors ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Users className="h-5 w-5" />
                </div>
                <CardTitle>Subcontratistas</CardTitle>
              </div>
              <Switch 
                disabled={role === 'site_manager'}
                checked={state.settings.modules.subcontractors} 
                onCheckedChange={() => toggleModule('subcontractors')} 
              />
            </div>
            <CardDescription className="pt-2">
              Gestión de contratos, avances de terceros, aprobación de estimaciones y pagos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
