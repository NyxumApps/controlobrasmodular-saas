import { useStore, Incident } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, Search, MessageSquare, Image as ImageIcon } from "lucide-react"
import { trackEvent } from "@/lib/analytics"
import { FileAttachments } from "@/components/file-attachments"

export default function Incidencias() {
  const { state, actions } = useStore()
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("todas")
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  
  const [newIncident, setNewIncident] = useState({
    workId: "",
    title: "",
    description: "",
    priority: "media" as Incident['priority'],
    assignee: ""
  })

  const filteredIncidents = state.incidents.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === "todas" || i.status === filterStatus
    return matchesSearch && matchesStatus
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIncident.workId) return

    const incident: Omit<Incident, 'id' | 'status' | 'createdAt'> = {
      workId: newIncident.workId,
      title: newIncident.title,
      description: newIncident.description,
      priority: newIncident.priority,
      assignee: newIncident.assignee || 'Sin asignar',
    }
    const created = await actions.createIncident(incident)
    if (pendingPhoto) await actions.uploadAttachment(pendingPhoto, { incidentId: created.id })
    trackEvent("incident_created", { module: "communications", priority: incident.priority })
    
    setIsDialogOpen(false)
    setNewIncident({ workId: "", title: "", description: "", priority: "media", assignee: "" })
    setPendingPhoto(null)
  }

  const updateStatus = async (id: string, status: Incident['status']) => {
    const incidentBefore = state.incidents.find(i => i.id === id)
    if (!incidentBefore || incidentBefore.status === status) return
    await actions.changeIncidentStatus(id, status)
    trackEvent("incident_status_changed", {
      module: "communications",
      from_status: incidentBefore.status,
      to_status: status,
      priority: incidentBefore.priority,
    })
    if (status === "resuelto" && incidentBefore.status !== "resuelto") {
      trackEvent("incident_resolved", {
        module: "communications",
        priority: incidentBefore.priority,
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    if (priority === 'alta') return 'text-destructive border-destructive bg-destructive/10'
    if (priority === 'media') return 'text-orange-600 border-orange-600 bg-orange-600/10 dark:text-orange-400 dark:border-orange-400 dark:bg-orange-400/10'
    return 'text-emerald-600 border-emerald-600 bg-emerald-600/10'
  }

  if (!state.settings.modules.communications) {
    return <div className="p-8 text-center text-muted-foreground">Módulo de comunicaciones desactivado.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidencias de Campo</h1>
          <p className="text-muted-foreground">Reportes, retrasos y comunicaciones.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Reportar Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Incidencia</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workId">Obra</Label>
                <select 
                  id="workId" required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={newIncident.workId}
                  onChange={e => setNewIncident({...newIncident, workId: e.target.value})}
                >
                  <option value="" disabled>Seleccione obra</option>
                  {state.works.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título Corto</Label>
                <Input id="title" required value={newIncident.title} onChange={e => setNewIncident({...newIncident, title: e.target.value})} placeholder="Ej. Lluvia retrasa chorrea" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Detalle</Label>
                <Textarea id="desc" required value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <select 
                    id="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newIncident.priority}
                    onChange={e => setNewIncident({...newIncident, priority: e.target.value as any})}
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Asignar a</Label>
                  <Input id="assignee" value={newIncident.assignee} onChange={e => setNewIncident({...newIncident, assignee: e.target.value})} placeholder="Nombre" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="incident-photo">Fotografía (opcional)</Label>
                <Input id="incident-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setPendingPhoto(event.target.files?.[0] ?? null)} />
                <p className="text-xs text-muted-foreground">JPG, PNG o WEBP; máximo 10 MB.</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Reportar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Buscar incidencias..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-muted p-1 rounded-md shrink-0 w-full sm:w-auto overflow-x-auto">
          {["todas", "abierto", "en proceso", "resuelto"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-sm capitalize whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredIncidents.map(incident => {
          const work = state.works.find(w => w.id === incident.workId)
          return (
            <Card key={incident.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{work?.name}</span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true, locale: es })}</span>
                        </div>
                        <h3 className="text-lg font-semibold">{incident.title}</h3>
                      </div>
                      <Badge variant="outline" className={`capitalize ${getPriorityColor(incident.priority)}`}>
                        {incident.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-foreground/80">{incident.description}</p>
                    <FileAttachments incidentId={incident.id} compact />
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground">
                          {incident.assignee.substring(0,2).toUpperCase()}
                        </div>
                        {incident.assignee}
                      </div>
                      {state.attachments.some(file => file.incidentId === incident.id) && (
                        <div className="flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" /> {state.attachments.filter(file => file.incidentId === incident.id).length} archivo(s)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-5 sm:w-48 border-t sm:border-t-0 sm:border-l flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase">Estado actual</div>
                      <Badge variant={incident.status === 'resuelto' ? 'success' : incident.status === 'en proceso' ? 'default' : 'secondary'} className="capitalize w-fit">
                        {incident.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 w-full">
                      <div className="text-xs font-medium text-muted-foreground uppercase hidden sm:block">Acción</div>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={incident.status}
                        onChange={e => updateStatus(incident.id, e.target.value as Incident['status'])}
                      >
                        <option value="abierto">Marcar Abierto</option>
                        <option value="en proceso">En proceso</option>
                        <option value="resuelto">Resolver</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filteredIncidents.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-lg bg-card">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-medium">No hay incidencias</h3>
            <p className="text-sm text-muted-foreground">Prueba cambiando los filtros o reporta una nueva.</p>
          </div>
        )}
      </div>
    </div>
  )
}
