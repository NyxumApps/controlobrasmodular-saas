import { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

type Project = {
  name: string;
  location: string;
  status: "En obra" | "En revisión";
  progress: number;
  budget: string;
  due: string;
  accent: string;
};

const projects: Project[] = [
  {
    name: "Torre Arboleda",
    location: "Av. Insurgentes 1280 · CDMX",
    status: "En obra",
    progress: 68,
    budget: "$12.4 M",
    due: "18 oct 2024",
    accent: "#ef6a42",
  },
  {
    name: "Casa Loma Norte",
    location: "Lomas de Chapultepec · CDMX",
    status: "En obra",
    progress: 42,
    budget: "$4.8 M",
    due: "06 dic 2024",
    accent: "#2a8d80",
  },
  {
    name: "Centro Logístico 04",
    location: "Parque Industrial · Querétaro",
    status: "En revisión",
    progress: 91,
    budget: "$8.1 M",
    due: "22 sep 2024",
    accent: "#cf9950",
  },
];

const navItems = [
  { label: "Resumen", icon: LayoutDashboard },
  { label: "Mis obras", icon: Building2 },
  { label: "Incidencias", icon: CircleAlert, count: 4 },
  { label: "Subcontratistas", icon: UsersRound },
  { label: "Validación", icon: ShieldCheck },
];

export function ObraControlPolished() {
  const [activeNav, setActiveNav] = useState("Resumen");
  const [selectedProject, setSelectedProject] = useState<Project>(projects[0]);
  const [filter, setFilter] = useState<"Todas" | "En obra" | "En revisión">("Todas");
  const [showNotice, setShowNotice] = useState(true);
  const [activity, setActivity] = useState<"Actividad" | "Pendientes">("Actividad");
  const visibleProjects = filter === "Todas" ? projects : projects.filter((project) => project.status === filter);

  return (
    <main
      className="min-h-[100dvh] overflow-hidden text-[#18322e]"
      style={{
        background: "#f5f5f0",
        fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="flex min-h-[100dvh]">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[#dfe3db] bg-[#193c36] px-5 py-6 text-[#f4f1e8] md:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#ef6a42] text-[15px] font-extrabold tracking-[-0.08em]">oc</div>
            <div>
              <div className="text-[15px] font-extrabold tracking-[-0.04em]">obra<span className="text-[#f4aa79]">control</span></div>
              <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-[#a8c4ba]">espacio de trabajo</div>
            </div>
          </div>

          <div className="mt-12 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#89a99e]">Operación</div>
          <nav className="mt-3 space-y-1">
            {navItems.map(({ label, icon: Icon, count }) => (
              <button
                key={label}
                onClick={() => setActiveNav(label)}
                className={`group flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[12px] font-semibold transition-all ${
                  activeNav === label ? "bg-[#315a50] text-[#fff8ed]" : "text-[#b2cac0] hover:bg-[#274d44] hover:text-[#fff8ed]"
                }`}
              >
                <span className="flex items-center gap-3"><Icon size={16} strokeWidth={1.8} />{label}</span>
                {count && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 font-mono text-[10px] ${activeNav === label ? "bg-[#ef6a42] text-white" : "bg-[#3d6258] text-[#d7e3db]"}`}>{count}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-10 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#89a99e]">Administración</div>
          <button onClick={() => setActiveNav("Configuración")} className={`mt-3 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12px] font-semibold ${activeNav === "Configuración" ? "bg-[#315a50] text-white" : "text-[#b2cac0] hover:bg-[#274d44]"}`}><Settings2 size={16} strokeWidth={1.8} />Configuración</button>

          <div className="mt-auto rounded-[12px] border border-[#477064] bg-[#234b42] p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.17em] text-[#a8c4ba]">Plan actual</span>
              <span className="rounded bg-[#f1bd86] px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-[#6a402b]">Pro</span>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#d9e5dd]">12 de 20 obras activas</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#396257]"><div className="h-full w-[60%] rounded-full bg-[#ef6a42]" /></div>
            <button className="mt-3 text-[10px] font-bold text-[#f4aa79] hover:text-white">Ver detalles <ArrowUpRight className="ml-1 inline" size={11} /></button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[74px] items-center justify-between border-b border-[#dfe3db] bg-[#f8f8f4] px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#193c36] text-[12px] font-extrabold text-white md:hidden">oc</div>
              <div className="hidden items-center gap-2 text-[11px] text-[#73867e] sm:flex"><span>Workspace</span><span className="text-[#c2cbc4]">/</span><span className="font-semibold text-[#36554c]">Resumen general</span></div>
              <div className="relative md:hidden"><Search size={16} className="absolute left-3 top-2.5 text-[#82938c]" /><input aria-label="Buscar" placeholder="Buscar..." className="h-9 w-[150px] rounded-lg border border-[#dfe3db] bg-white pl-9 text-xs outline-none" /></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block"><Search size={15} className="absolute left-3 top-2.5 text-[#82938c]" /><input aria-label="Buscar en el workspace" placeholder="Buscar en tu workspace" className="h-9 w-[230px] rounded-lg border border-[#dfe3db] bg-white pl-9 text-[11px] outline-none transition focus:border-[#79a497]" /></div>
              <button onClick={() => setShowNotice(true)} aria-label="Notificaciones" className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#dfe3db] bg-white text-[#557269] hover:bg-[#edf1eb]"><Bell size={16} strokeWidth={1.8} />{showNotice && <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ef6a42]" />}</button>
              <div className="hidden h-7 w-px bg-[#dfe3db] sm:block" />
              <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[#edf1eb]"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#e6b58a] font-mono text-[10px] font-bold text-[#5c3828]">MG</div><span className="hidden text-[11px] font-bold sm:block">María G.</span><ChevronDown size={13} className="text-[#82938c]" /></button>
            </div>
          </header>

          <div className="mx-auto max-w-[1380px] px-5 py-7 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ef6a42]">Martes, 24 de septiembre</p><h1 className="mt-2 text-[27px] font-extrabold tracking-[-0.06em] text-[#18322e] sm:text-[32px]">Buenos días, María <span className="text-[#a1ada6]">/</span></h1><p className="mt-1 text-[12px] text-[#75867f]">Esto es lo que está pasando en tus obras.</p></div>
              <button className="flex items-center gap-2 rounded-lg bg-[#ef6a42] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_4px_12px_rgba(239,106,66,0.18)] transition-transform hover:-translate-y-0.5"><Plus size={15} />Nueva obra</button>
            </div>

            {showNotice && <div className="mt-7 flex items-center justify-between gap-4 rounded-[10px] border border-[#f1c7aa] bg-[#fff3ea] px-4 py-3 text-[11px] text-[#774734]"><div className="flex items-center gap-3"><div className="grid h-7 w-7 place-items-center rounded-full bg-[#f9d9c2] text-[#da643e]"><CircleAlert size={15} /></div><span><strong className="font-extrabold">4 incidencias requieren atención.</strong> La más antigua lleva 2 días sin asignar.</span></div><button onClick={() => setShowNotice(false)} aria-label="Cerrar aviso" className="text-[#a97561] hover:text-[#6c3c2b]"><X size={15} /></button></div>}

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Obras activas", value: "12", meta: "+2 este mes", icon: Building2, color: "#2a8d80" },
                { label: "Presupuesto ejecutado", value: "$18.7 M", meta: "de $31.4 M total", icon: WalletCards, color: "#ef6a42" },
                { label: "Incidencias abiertas", value: "07", meta: "↓ 3 vs. semana anterior", icon: CircleAlert, color: "#cf9950" },
                { label: "Avance promedio", value: "64.8%", meta: "+5.2% este mes", icon: ClipboardList, color: "#6f83a3" },
              ].map(({ label, value, meta, icon: Icon, color }) => <div key={label} className="rounded-[12px] border border-[#dfe3db] bg-[#fbfbf8] p-4 shadow-[0_2px_10px_rgba(36,62,53,0.025)]"><div className="flex items-start justify-between"><span className="text-[11px] font-semibold text-[#768881]">{label}</span><div className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${color}18`, color }}><Icon size={15} strokeWidth={1.8} /></div></div><div className="mt-4 flex items-baseline gap-2"><strong className="font-mono text-[23px] tracking-[-0.08em] text-[#18322e]">{value}</strong><span className="font-mono text-[9px] text-[#6d9a7f]">{meta}</span></div></div>)}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
              <div className="min-w-0">
                <div className="flex items-center justify-between"><div><h2 className="text-[16px] font-extrabold tracking-[-0.04em]">Tus obras</h2><p className="mt-1 text-[11px] text-[#82918a]">Seguimiento del portafolio activo</p></div><div className="flex items-center gap-1 rounded-lg border border-[#dfe3db] bg-white p-1">{(["Todas", "En obra", "En revisión"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold ${filter === item ? "bg-[#193c36] text-white" : "text-[#71827b] hover:bg-[#eff2ed]"}`}>{item}</button>)}</div></div>
                <div className="mt-4 overflow-hidden rounded-[12px] border border-[#dfe3db] bg-[#fbfbf8]">
                  {visibleProjects.map((project, index) => <button key={project.name} onClick={() => setSelectedProject(project)} className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#f1f3ee] ${index !== visibleProjects.length - 1 ? "border-b border-[#e7eae4]" : ""} ${selectedProject.name === project.name ? "bg-[#f6f5ed]" : ""}`}><div className="h-10 w-1 rounded-full" style={{ background: project.accent }} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="truncate text-[12px] font-extrabold">{project.name}</strong><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${project.status === "En obra" ? "bg-[#e2f0e9] text-[#3e7963]" : "bg-[#f5ead9] text-[#9a713f]"}`}>{project.status}</span></div><div className="mt-1 flex items-center gap-1 text-[10px] text-[#83938c]"><MapPin size={11} />{project.location}</div></div><div className="hidden w-[150px] sm:block"><div className="flex justify-between font-mono text-[9px] text-[#788981]"><span>Avance</span><strong className="text-[#36554c]">{project.progress}%</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e6e9e2]"><div className="h-full rounded-full" style={{ width: `${project.progress}%`, background: project.accent }} /></div></div><div className="hidden w-[88px] text-right md:block"><div className="font-mono text-[11px] font-bold">{project.budget}</div><div className="mt-1 text-[9px] text-[#84938d]">{project.due}</div></div><MoreHorizontal size={16} className="text-[#9ba8a1]" /></button>)}
                </div>
                <div className="mt-3 flex items-center justify-between px-1"><span className="text-[10px] text-[#84938d]">Mostrando {visibleProjects.length} de 12 obras</span><button className="flex items-center gap-1 text-[10px] font-extrabold text-[#ef6a42]">Ver todas <ArrowUpRight size={12} /></button></div>
              </div>

              <div className="rounded-[12px] border border-[#dfe3db] bg-[#fbfbf8] p-5">
                <div className="flex items-start justify-between"><div><h2 className="text-[16px] font-extrabold tracking-[-0.04em]">Actividad reciente</h2><p className="mt-1 text-[11px] text-[#82918a]">Actualizaciones de tu equipo</p></div><button onClick={() => setActivity(activity === "Actividad" ? "Pendientes" : "Actividad")} className="rounded-md border border-[#dfe3db] bg-white px-2 py-1 text-[9px] font-bold text-[#63766e]">{activity}</button></div>
                <div className="mt-5 space-y-5">
                  {(activity === "Actividad" ? [
                    { icon: FileText, color: "#6f83a3", title: "Contrato actualizado", by: "Carlos R. · Torre Arboleda", when: "Hace 12 min" },
                    { icon: CheckCircle2, color: "#2a8d80", title: "Validación completada", by: "Ana P. · Casa Loma Norte", when: "Hace 45 min" },
                    { icon: CircleAlert, color: "#ef6a42", title: "Nueva incidencia reportada", by: "Luis M. · Torre Arboleda", when: "Hace 2 h" },
                    { icon: CalendarDays, color: "#cf9950", title: "Hito reprogramado", by: "María G. · Centro Logístico 04", when: "Ayer" },
                  ] : [
                    { icon: Clock3, color: "#ef6a42", title: "Asignar responsable", by: "Incidencia #024 · Torre Arboleda", when: "Prioridad alta" },
                    { icon: FileText, color: "#6f83a3", title: "Revisar presupuesto", by: "Estimación #018 · Casa Loma Norte", when: "Vence mañana" },
                  ]).map(({ icon: Icon, color, title, by, when }) => <div key={title} className="flex items-start gap-3"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ color, background: `${color}18` }}><Icon size={14} strokeWidth={1.8} /></div><div className="min-w-0 flex-1"><div className="text-[11px] font-bold">{title}</div><div className="mt-0.5 truncate text-[10px] text-[#81918a]">{by}</div></div><span className="whitespace-nowrap font-mono text-[9px] text-[#a0aaa4]">{when}</span></div>)}
                </div>
                <button className="mt-6 w-full rounded-lg border border-[#dfe3db] py-2 text-[10px] font-extrabold text-[#536d63] hover:bg-[#f0f2ed]">Ver registro completo</button>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe3db] pt-4 text-[9px] text-[#92a099]"><span>Última sincronización: hoy, 09:42</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#5b9a79]" />Todos los sistemas operando correctamente</span><span className="font-mono tracking-wide">OBRACONTROL / 2024</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ObraControlPolished;