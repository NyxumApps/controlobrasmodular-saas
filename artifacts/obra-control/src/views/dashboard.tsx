import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatColones, formatPercent } from "@/lib/utils"
import { Link } from "wouter"
import { AlertCircle, TrendingUp, TrendingDown, Hammer, Activity, CheckCircle2 } from "lucide-react"

export default function Dashboard() {
  const { state } = useStore()
  
  const activeWorks = state.works.filter(w => w.status === 'en curso')
  const totalBudget = activeWorks.reduce((sum, w) => sum + w.budget, 0)
  
  // Calculate total spent based on actual expenses to show "real" data vs budget
  const totalSpent = state.expenses.reduce((sum, e) => sum + e.amount, 0)

  // Find line items that are over budget
  const overBudgetItems = state.budgetItems.filter(b => (b.spent + b.committed) > b.budgeted)

  const activeIncidents = state.incidents.filter(i => i.status !== 'resuelto')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portafolio</h1>
        <p className="text-muted-foreground">Resumen general de proyectos en ejecución.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obras Activas</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorks.length}</div>
            <p className="text-xs text-muted-foreground">
              De {state.works.length} obras totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Ejecutado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatColones(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              De {formatColones(totalBudget)} presupuestado en obras activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Costo</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overBudgetItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Líneas superando lo presupuestado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidencias Abiertas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIncidents.length}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Obras en Curso</CardTitle>
            <CardDescription>Avance y control presupuestal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeWorks.map(work => {
              const items = state.budgetItems.filter(b => b.workId === work.id)
              const spent = items.reduce((sum, b) => sum + b.spent, 0)
              const statusColor = (spent > work.budget) ? 'text-destructive' : 'text-emerald-600'
              
              return (
                <Link key={work.id} href={`/obras/${work.id}`} className="block group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium group-hover:text-primary transition-colors">{work.name}</span>
                    <span className="text-sm font-mono">{formatPercent(work.progress)}</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mb-1">
                    <div className="bg-primary h-full transition-all" style={{ width: `${work.progress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{work.location}</span>
                    <span className={statusColor}>
                      {formatColones(spent)} / {formatColones(work.budget)}
                    </span>
                  </div>
                </Link>
              )
            })}
            {activeWorks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay obras activas en este momento.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos movimientos en el portafolio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* MVP Fake Activity Feed based on recent data */}
            {state.expenses.slice(0, 3).map(e => {
              const work = state.works.find(w => w.id === e.workId)
              return (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-accent p-1.5">
                    <TrendingDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      Gasto registrado en {work?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatColones(e.amount)} - {e.vendor}
                    </p>
                  </div>
                </div>
              )
            })}
            {state.incidents.slice(0, 2).map(i => {
              const work = state.works.find(w => w.id === i.workId)
              return (
                <div key={i.id} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-orange-100 p-1.5 dark:bg-orange-900/30">
                    <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      Nueva incidencia: {i.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {work?.name} - {i.priority}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
      
      {/* MVP Validation Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Validación MVP: Semana 3</p>
              <p className="text-xs text-muted-foreground">14 usuarios activos esta semana. Has actuado sobre 3 alertas de costo.</p>
            </div>
          </div>
          <Link href="/validacion" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">
            Ver Métricas de Validación
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
