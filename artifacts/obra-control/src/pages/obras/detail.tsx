import { useStore, Expense } from "@/lib/store"
import { useRoute } from "wouter"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatColones, formatPercent, formatDate, cn } from "@/lib/utils"
import { ArrowLeft, Plus, AlertTriangle, FileText, ChevronRight } from "lucide-react"
import { Link } from "wouter"
import { useState } from "react"
import { useEffect, useRef } from "react"
import { trackEvent } from "@/lib/analytics"

export default function ObraDetail() {
  const [, params] = useRoute("/obras/:id")
  const { state, role, actions } = useStore()
  const work = state.works.find(w => w.id === params?.id)
  const reviewedWorkId = useRef<string | null>(null)
  
  const [expenseDialog, setExpenseDialog] = useState(false)
  const [newExpense, setNewExpense] = useState({
    itemId: "",
    description: "",
    amount: "",
    type: "material" as Expense['type'],
    vendor: ""
  })

  useEffect(() => {
    if (!work || reviewedWorkId.current === work.id) return
    reviewedWorkId.current = work.id
    void actions.reviewWork(work.id)
    trackEvent("work_reviewed", { module: "profitability", status: work.status })
  }, [work?.id])

  if (!work) {
    return <div className="p-8 text-center">Obra no encontrada</div>
  }

  const budgetItems = state.budgetItems.filter(b => b.workId === work.id)
  const expenses = state.expenses.filter(e => e.workId === work.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const totalBudgeted = budgetItems.reduce((acc, i) => acc + i.budgeted, 0)
  const totalSpent = budgetItems.reduce((acc, i) => acc + i.spent, 0)
  const totalCommitted = budgetItems.reduce((acc, i) => acc + i.committed, 0)
  const totalProjected = totalSpent + totalCommitted

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpense.itemId || !newExpense.amount) return

    const amountNum = Number(newExpense.amount)
    
    // Create expense
    const expense: Omit<Expense, 'id'> = {
      workId: work.id,
      itemId: newExpense.itemId,
      description: newExpense.description,
      amount: amountNum,
      type: newExpense.type,
      date: new Date().toISOString().slice(0, 10),
      vendor: newExpense.vendor
    }

    await actions.createExpense(expense)
    const selectedItem = budgetItems.find(item => item.id === newExpense.itemId)
    const projectedAfterExpense = selectedItem
      ? selectedItem.spent + selectedItem.committed + amountNum
      : 0
    trackEvent("expense_registered", {
      module: "profitability",
      expense_type: newExpense.type,
      creates_overrun: Boolean(selectedItem && projectedAfterExpense > selectedItem.budgeted),
    })

    setExpenseDialog(false)
    setNewExpense({ itemId: "", description: "", amount: "", type: "material", vendor: "" })
  }

  const handleCostAlert = async () => {
    const alertKey = `${work.id}:projected_overrun`
    if (state.addressedCostAlerts.includes(alertKey)) return

    await actions.markCostAlert(alertKey)
    trackEvent("cost_alert_addressed", {
      module: "profitability",
      alert_type: "projected_overrun",
    })
  }

  const overrunAlertKey = `${work.id}:projected_overrun`
  const isOverrunAddressed = state.addressedCostAlerts.includes(overrunAlertKey)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/obras"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{work.name}</h1>
            <Badge variant={work.status === 'en curso' ? 'success' : 'secondary'}>{work.status}</Badge>
          </div>
          <p className="text-muted-foreground">{work.location} • Cliente: {work.client}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avance Físico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{formatPercent(work.progress)}</span>
              <span className="text-xs text-muted-foreground">Meta: 100%</span>
            </div>
            <Progress value={work.progress} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatColones(totalBudgeted)}</div>
            <p className="text-xs text-muted-foreground">Aprobado total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Proyectado (Gastado + Compro.)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold font-mono", totalProjected > totalBudgeted ? "text-destructive" : "")}>
              {formatColones(totalProjected)}
            </div>
            {totalProjected > totalBudgeted && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Sobregiro de {formatColones(totalProjected - totalBudgeted)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleCostAlert}
                  disabled={isOverrunAddressed || role === 'site_manager'}
                >
                  {isOverrunAddressed ? "Alerta atendida" : "Marcar alerta atendida"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Budget Items */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Líneas de Presupuesto</h2>
            <Button size="sm" variant="outline">Importar CSV</Button>
          </div>
          
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Código</th>
                    <th className="px-4 py-3 font-medium">Actividad</th>
                    <th className="px-4 py-3 font-medium text-right">Presupuesto</th>
                    <th className="px-4 py-3 font-medium text-right">Gastado</th>
                    <th className="px-4 py-3 font-medium text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {budgetItems.map(item => {
                    const projected = item.spent + item.committed
                    const variance = item.budgeted - projected
                    const isOver = variance < 0
                    
                    return (
                      <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{item.code}</td>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatColones(item.budgeted)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatColones(item.spent)}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={isOver ? "destructive" : "outline"} className={isOver ? "" : "border-transparent"}>
                            {isOver ? "" : "+"}{formatColones(variance)}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                  {budgetItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No hay líneas de presupuesto registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Expenses / Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gastos Recientes</h2>
            <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-4 w-4"/> Gasto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Gasto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="item">Línea de Presupuesto</Label>
                    <select 
                      id="item"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newExpense.itemId}
                      onChange={e => setNewExpense({...newExpense, itemId: e.target.value})}
                    >
                      <option value="" disabled>Seleccione una línea</option>
                      {budgetItems.map(b => (
                        <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto (₡)</Label>
                    <Input id="amount" type="number" min="1" step="1" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Descripción</Label>
                    <Input id="desc" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Proveedor</Label>
                      <Input id="vendor" required value={newExpense.vendor} onChange={e => setNewExpense({...newExpense, vendor: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <select 
                        id="type"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={newExpense.type}
                        onChange={e => setNewExpense({...newExpense, type: e.target.value as any})}
                      >
                        <option value="material">Material</option>
                        <option value="mano_obra">Mano de Obra</option>
                        <option value="equipo">Equipo</option>
                        <option value="subcontrato">Subcontrato</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setExpenseDialog(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Gasto</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-3">
            {expenses.slice(0, 5).map(e => (
              <Card key={e.id} className="bg-transparent shadow-none border-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="mt-1 bg-muted rounded p-1.5 shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{e.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{e.vendor} • {formatDate(e.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-medium">{formatColones(e.amount)}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] py-0">{e.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {expenses.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                No hay gastos registrados.
              </div>
            )}
            {expenses.length > 5 && (
              <Button variant="ghost" className="w-full text-xs">
                Ver todos los gastos <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
