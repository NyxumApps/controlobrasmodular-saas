import { useStore } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { cn, formatColones, formatPercent } from "@/lib/utils"
import { Link } from "wouter"
import { useState } from "react"
import { Search, Plus, MapPin, Calendar } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

export default function ObrasList() {
  const { state, role, actions } = useStore()
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // New Work form state
  const [newWork, setNewWork] = useState({
    name: "",
    client: "",
    location: "",
    budget: "",
    startDate: "",
    endDate: "",
  })

  const filteredWorks = state.works.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.location.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault()
    const work = {
      name: newWork.name,
      client: newWork.client,
      location: newWork.location,
      status: 'planificación' as const,
      progress: 0,
      budget: Number(newWork.budget),
      startDate: newWork.startDate,
      endDate: newWork.endDate,
      manager: state.settings.companyName // simple fallback
    }
    await actions.createWork(work)
    trackEvent("work_created", { module: "profitability", initial_status: work.status })
    setIsDialogOpen(false)
    setNewWork({ name: "", client: "", location: "", budget: "", startDate: "", endDate: "" })
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'en curso': return <Badge variant="success">En curso</Badge>
      case 'planificación': return <Badge variant="secondary">Planificación</Badge>
      case 'pausada': return <Badge variant="warning">Pausada</Badge>
      case 'completada': return <Badge variant="default">Completada</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Obras</h1>
          <p className="text-muted-foreground">Gestiona tus proyectos de construcción.</p>
        </div>
        
        {role !== 'site_manager' && <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Obra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Obra</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateWork} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proyecto</Label>
                <Input id="name" required value={newWork.name} onChange={e => setNewWork({...newWork, name: e.target.value})} placeholder="Ej. Condominio Las Vistas" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Input id="client" required value={newWork.client} onChange={e => setNewWork({...newWork, client: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" required value={newWork.location} onChange={e => setNewWork({...newWork, location: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Presupuesto Estimado (₡)</Label>
                <Input id="budget" type="number" required value={newWork.budget} onChange={e => setNewWork({...newWork, budget: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <Input id="startDate" type="date" required value={newWork.startDate} onChange={e => setNewWork({...newWork, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Fin Estimada</Label>
                  <Input id="endDate" type="date" required value={newWork.endDate} onChange={e => setNewWork({...newWork, endDate: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Crear Obra</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-9" 
          placeholder="Buscar obra o ubicación..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredWorks.map(work => {
          const items = state.budgetItems.filter(b => b.workId === work.id)
          const spent = items.reduce((sum, b) => sum + b.spent, 0)

          return (
            <Link key={work.id} href={`/obras/${work.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group">
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {work.name}
                    </h3>
                    {getStatusBadge(work.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{work.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>Inicio: {new Date(work.startDate).toLocaleDateString('es-CR')}</span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Avance</span>
                      <span className="font-mono">{formatPercent(work.progress)}</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all" style={{ width: `${work.progress}%` }} />
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Presupuesto</div>
                        <div className="font-mono font-medium">{formatColones(work.budget)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Ejecutado</div>
                        <div className={cn("font-mono font-medium", spent > work.budget && "text-destructive")}>
                          {formatColones(spent)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        {filteredWorks.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
            No se encontraron obras con ese criterio.
          </div>
        )}
      </div>
    </div>
  )
}
