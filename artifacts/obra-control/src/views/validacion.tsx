import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Target, Zap, ShieldCheck } from "lucide-react"
import { useGetAnalyticsSummary } from "@workspace/api-client-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Validacion() {
  const { state } = useStore()
  const [pilotKey, setPilotKey] = useState("")
  const [submittedKey, setSubmittedKey] = useState("")
  const [keyAttempt, setKeyAttempt] = useState(0)
  const { data: aggregateMetrics, isError: analyticsAccessDenied } = useGetAnalyticsSummary({
    query: {
      queryKey: ["analytics-summary", keyAttempt],
      enabled: submittedKey.length > 0,
      staleTime: 30_000,
    },
    request: {
      headers: { "x-pilot-analytics-key": submittedKey },
    },
  })
  const metrics = aggregateMetrics ?? state.metrics
  const returningVisitors = aggregateMetrics?.returningVisitors ?? 0
  const weeklyVisitors = aggregateMetrics?.weeklyVisitors ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Validación MVP</h1>
        <p className="text-muted-foreground">Métricas de adopción y aprendizaje del producto.</p>
      </div>

      {!aggregateMetrics && (
        <Card>
          <CardContent className="p-4">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault()
                setSubmittedKey(pilotKey)
                setKeyAttempt((attempt) => attempt + 1)
              }}
            >
              <div className="flex-1 space-y-1">
                <label htmlFor="pilot-key" className="text-sm font-medium">
                  Acceso de administrador del piloto
                </label>
                <Input
                  id="pilot-key"
                  type="password"
                  autoComplete="off"
                  value={pilotKey}
                  onChange={(event) => setPilotKey(event.target.value)}
                  placeholder="Clave privada de analítica"
                />
              </div>
              <Button type="submit" disabled={!pilotKey}>
                Ver métricas agregadas
              </Button>
              {analyticsAccessDenied && (
                <p className="text-sm text-destructive">La clave no es válida.</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regreso semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {returningVisitors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              de {weeklyVisitors} visitantes de la semana
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground border-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Uso de obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.worksReviewed}</div>
            <p className="text-xs mt-1 opacity-80">{metrics.worksCreated} creadas · revisiones acumuladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertas Atendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.costAlertsActedOn}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.expensesRegistered} gastos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Incidencias Resueltas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.incidencesResolved}</div>
            <p className="text-xs text-muted-foreground mt-1">de {metrics.incidencesCreated} creadas en el piloto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagos Aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.paymentApprovals}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.evidenceUploads} evidencias seleccionadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Preferencia de módulos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.moduleChanges}</div>
            <p className="text-xs text-muted-foreground mt-1">activaciones o desactivaciones</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retención semanal por módulo</CardTitle>
          <CardDescription>
            Visitantes de esta semana que también usaron el mismo módulo la semana anterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {([
            ["profitability", "Rentabilidad y control"],
            ["communications", "Comunicaciones"],
            ["subcontractors", "Subcontratistas"],
          ] as const).map(([key, label]) => {
            const retention = aggregateMetrics?.byModule[key]
            return (
              <div key={key} className="rounded-lg border p-4">
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-2 text-2xl font-bold">{retention?.retentionRate ?? 0}%</p>
                <p className="text-xs text-muted-foreground">
                  {retention?.returningVisitors ?? 0} regresaron · {retention?.currentWeeklyVisitors ?? 0} activos esta semana
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Cómo leer el piloto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium">Recurrencia semanal</p>
                <Badge variant="warning">Retención</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Comparar usuarios que revisan obras en semanas consecutivas y qué módulos usan antes de volver.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium">Prevención de pérdidas</p>
                <Badge variant="warning">Valor</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Medir cuántos gastos generan sobregiro y cuántas alertas terminan en una acción del gerente.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium">Disposición de pago por módulo</p>
                <Badge variant="warning">Demanda</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Cruzar activaciones con uso posterior: incidencias resueltas, evidencias seleccionadas y pagos aprobados.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Medición segura
            </CardTitle>
            <CardDescription>Qué registramos y qué queda fuera de analítica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-bold text-muted-foreground">1.</span>
                <span>Eventos de resultado: creación, revisión, resolución, aprobación y cambios de módulo.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-muted-foreground">2.</span>
                <span>Solo dimensiones cerradas, fecha del evento y sesión anónima para medir recurrencia.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-muted-foreground">3.</span>
                <span>Nunca nombres, teléfonos, proveedores, ubicaciones, descripciones ni otros textos libres.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
