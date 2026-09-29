import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  HardHat,
  Layers3,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Work = {
  name: string;
  site: string;
  code: string;
  progress: number;
  tone: "orange" | "blue" | "green";
  next: string;
};

const works: Work[] = [
  { name: "Torre Ladera", site: "Escazú · San José", code: "OB-042", progress: 68, tone: "orange", next: "Revisión de losa 03" },
  { name: "Casa Nómada", site: "Santa Ana · San José", code: "OB-038", progress: 41, tone: "blue", next: "Instalación eléctrica" },
  { name: "Centro Cívico Norte", site: "Heredia · Heredia", code: "OB-031", progress: 86, tone: "green", next: "Entrega de acabados" },
];

const alerts = [
  { id: 1, label: "Factura de acero pendiente de validar", work: "Torre Ladera", age: "hace 22 min", priority: "Alta", color: "orange" },
  { id: 2, label: "Fotografía de avance solicitada", work: "Casa Nómada", age: "hace 1 h", priority: "Media", color: "blue" },
  { id: 3, label: "Contrato de pintura por vencer", work: "Centro Cívico Norte", age: "hace 3 h", priority: "Media", color: "green" },
];

const activity = [
  { initials: "LM", name: "Lucía Méndez", action: "subió 4 fotografías", target: "Torre Ladera", time: "08:41", tone: "orange" },
  { initials: "CR", name: "Carlos Rojas", action: "marcó como resuelta", target: "Retraso de proveedor", time: "08:15", tone: "blue" },
  { initials: "AM", name: "Ana Morales", action: "aprobó el presupuesto", target: "Casa Nómada", time: "Ayer", tone: "green" },
];

export default function ControlRoom() {
  const [activeWork, setActiveWork] = useState(works[0].code);
  const [queue, setQueue] = useState(alerts);
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [view, setView] = useState<"today" | "week">("today");
  const [mobileNav, setMobileNav] = useState(false);

  const selected = works.find((work) => work.code === activeWork) ?? works[0];
  const visibleAlerts = useMemo(
    () => queue.filter((item) => `${item.label} ${item.work}`.toLowerCase().includes(query.toLowerCase())),
    [queue, query],
  );

  const completeAlert = (id: number) => setQueue((items) => items.filter((item) => item.id !== id));

  return (
    <div className="min-h-[100dvh] bg-[#f5f3ee] text-[#1d2827]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .mono { font-family: 'DM Mono', monospace; }
        .grain { position: fixed; inset: 0; pointer-events:none; opacity:.035; z-index:20; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E"); }
        @keyframes rise { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .rise { animation: rise .45s ease-out both; }
        .delay-1 { animation-delay:.06s } .delay-2 { animation-delay:.12s } .delay-3 { animation-delay:.18s }
      `}</style>
      <div className="grain" />
      <aside className={`fixed inset-y-0 left-0 z-30 w-[248px] border-r border-[#d9d8d1] bg-[#ebe9e2] p-5 transition-transform lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-[10px] bg-[#ef7548] text-white"><HardHat size={20} strokeWidth={2.5} /></div>
            <div><div className="text-[14px] font-extrabold tracking-[-.03em]">ObraControl</div><div className="mono text-[9px] uppercase tracking-[.18em] text-[#77807b]">campo / control</div></div>
          </div>
          <button className="lg:hidden text-[#596763]" onClick={() => setMobileNav(false)}><X size={18} /></button>
        </div>
        <div className="mt-11">
          <div className="mono mb-3 px-3 text-[10px] uppercase tracking-[.16em] text-[#858d88]">Espacio de trabajo</div>
          <button className="flex w-full items-center justify-between rounded-xl bg-[#d9d9d1] px-3 py-2.5 text-left text-[12px] font-semibold">
            <span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-[#304744] text-[10px] text-white">MT</span> Maderas & Tierra</span><ChevronDown size={15} />
          </button>
        </div>
        <nav className="mt-8 space-y-1">
          {([
            [Activity, "Vista de hoy", true],
            [Layers3, "Obras", false],
            [CircleAlert, "Incidencias", false],
            [Users, "Equipo", false],
            [ClipboardCheck, "Validación", false],
          ] as [LucideIcon, string, boolean][]).map(([Icon, label, active]) => (
            <button key={String(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold ${active ? "bg-[#304744] text-[#f7f5ef]" : "text-[#66716c] hover:bg-[#deddd6]"}`}>
              <Icon size={16} /> {String(label)}
              {label === "Incidencias" && <span className="mono ml-auto rounded-full bg-[#ef7548] px-1.5 py-0.5 text-[9px] text-white">3</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 border-t border-[#d5d3cb] pt-4">
          <button className="flex w-full items-center gap-3 text-left">
            <div className="grid size-8 place-items-center rounded-full bg-[#b9d6cf] text-[11px] font-bold text-[#2e514a]">MC</div>
            <div className="min-w-0"><div className="truncate text-[11px] font-bold">María Cordero</div><div className="truncate text-[10px] text-[#7b8580]">Administradora</div></div>
            <MoreHorizontal size={16} className="ml-auto text-[#8c9691]" />
          </button>
        </div>
      </aside>

      <main className="lg:pl-[248px]">
        <header className="flex h-[72px] items-center justify-between border-b border-[#dddbd4] bg-[#f5f3ee]/90 px-5 backdrop-blur md:px-9">
          <button className="mr-3 text-[#41534e] lg:hidden" onClick={() => setMobileNav(true)}><Menu size={21} /></button>
          <div className="hidden items-center gap-2 text-[11px] text-[#7c8580] sm:flex"><span>Operación</span><span className="text-[#c3c0b9]">/</span><span className="font-bold text-[#344743]">Vista de hoy</span></div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden md:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929a94]" size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en la operación" className="h-9 w-[220px] rounded-lg border border-[#dddcd5] bg-[#faf9f6] pl-9 pr-3 text-[11px] outline-none placeholder:text-[#9ca39f] focus:border-[#8daaa1]" /></div>
            <button className="relative grid size-9 place-items-center rounded-lg border border-[#dddcd5] bg-[#faf9f6] text-[#62716b]"><Bell size={16} /><span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#ef7548]" /></button>
            <button onClick={() => setShowNew(true)} className="hidden items-center gap-2 rounded-lg bg-[#ef7548] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_2px_0_#bd5b37] transition-transform hover:-translate-y-px sm:flex"><Plus size={15} /> Nueva incidencia</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1320px] px-5 py-7 md:px-9 md:py-10">
          <section className="rise flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><div className="mono mb-2 text-[10px] font-medium uppercase tracking-[.16em] text-[#ef7548]">Martes · 24 septiembre 2024</div><h1 className="text-[29px] font-extrabold tracking-[-.055em] text-[#233330] md:text-[36px]">Qué necesita atención.</h1><p className="mt-2 max-w-[500px] text-[12px] leading-5 text-[#78837d]">Una vista operativa para avanzar lo importante antes de que se vuelva urgente.</p></div>
            <div className="flex rounded-lg border border-[#dcdbd4] bg-[#efeee9] p-1"><button onClick={() => setView("today")} className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${view === "today" ? "bg-[#fffefa] text-[#344943] shadow-sm" : "text-[#8b948e]"}`}>Hoy</button><button onClick={() => setView("week")} className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${view === "week" ? "bg-[#fffefa] text-[#344943] shadow-sm" : "text-[#8b948e]"}`}>Esta semana</button></div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-[1.6fr_1fr_1fr]">
            <div className="rise delay-1 rounded-2xl bg-[#304744] p-5 text-[#f9f7f1] shadow-[0_7px_0_#c8c8c0] md:p-6">
              <div className="flex items-start justify-between"><div><div className="mono text-[10px] uppercase tracking-[.14em] text-[#a7c5bd]">En foco ahora</div><h2 className="mt-3 text-[21px] font-extrabold tracking-[-.04em]">{selected.name}</h2><p className="mt-1 text-[11px] text-[#b8cac4]">{selected.site} <span className="mx-1 text-[#718d85]">·</span> {selected.code}</p></div><button className="rounded-lg border border-[#5e7770] p-2 text-[#c1d2cd] hover:bg-[#405a55]"><SquareArrowOutUpRight size={15} /></button></div>
              <div className="mt-8 flex items-end justify-between"><div><div className="mono text-[36px] leading-none">{selected.progress}<span className="text-[16px] text-[#a7c5bd]">%</span></div><div className="mt-2 text-[10px] text-[#a7c5bd]">avance general</div></div><div className="text-right"><div className="text-[10px] text-[#a7c5bd]">Próximo hito</div><div className="mt-1 text-[12px] font-bold">{selected.next}</div></div></div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#506963]"><div className="h-full rounded-full bg-[#e9c27c]" style={{ width: `${selected.progress}%` }} /></div>
            </div>
            <div className="rise delay-2 rounded-2xl border border-[#dddcd5] bg-[#fbfaf7] p-5 md:p-6"><div className="flex items-center justify-between"><div className="mono text-[10px] uppercase tracking-[.14em] text-[#8d9690]">Tareas abiertas</div><ClipboardCheck size={17} className="text-[#ef7548]" /></div><div className="mt-5 text-[34px] font-extrabold tracking-[-.05em]">12</div><div className="mt-1 text-[11px] text-[#7c8781]">4 vencen hoy</div><div className="mt-5 flex gap-1"><span className="h-1.5 flex-[4] rounded-full bg-[#ef7548]" /><span className="h-1.5 flex-[8] rounded-full bg-[#d9ddd8]" /></div></div>
            <div className="rise delay-3 rounded-2xl border border-[#dddcd5] bg-[#fbfaf7] p-5 md:p-6"><div className="flex items-center justify-between"><div className="mono text-[10px] uppercase tracking-[.14em] text-[#8d9690]">Equipo en campo</div><Users size={17} className="text-[#5b8d84]" /></div><div className="mt-5 text-[34px] font-extrabold tracking-[-.05em]">18<span className="text-[17px] text-[#98a09b]">/21</span></div><div className="mt-1 text-[11px] text-[#7c8781]">personas activas hoy</div><div className="mt-5 flex -space-x-1.5"><span className="grid size-6 place-items-center rounded-full border-2 border-[#fbfaf7] bg-[#e6aa89] text-[8px] font-bold">LM</span><span className="grid size-6 place-items-center rounded-full border-2 border-[#fbfaf7] bg-[#abc8c0] text-[8px] font-bold">CR</span><span className="grid size-6 place-items-center rounded-full border-2 border-[#fbfaf7] bg-[#e2c278] text-[8px] font-bold">AM</span><span className="grid size-6 place-items-center rounded-full border-2 border-[#fbfaf7] bg-[#d9d9d1] text-[8px] font-bold">+15</span></div></div>
          </section>

          <section className="mt-9 grid gap-7 xl:grid-cols-[1.25fr_.75fr]">
            <div className="rise delay-2"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-extrabold tracking-[-.025em]">Cola de atención</h2><p className="mt-1 text-[11px] text-[#89928d]">{visibleAlerts.length} asuntos requieren una decisión</p></div><button className="flex items-center gap-1.5 text-[10px] font-bold text-[#5d736c]"><SlidersHorizontal size={14} /> Filtrar</button></div>
              <div className="overflow-hidden rounded-2xl border border-[#dddcd5] bg-[#fbfaf7]">{visibleAlerts.map((item, index) => <div key={item.id} className={`flex items-center gap-3 p-4 ${index !== visibleAlerts.length - 1 ? "border-b border-[#e5e3dd]" : ""}`}><button onClick={() => completeAlert(item.id)} className="grid size-7 shrink-0 place-items-center rounded-lg border border-[#d9dcd6] text-[#a1aaa4] transition-colors hover:border-[#5b8d84] hover:bg-[#e9f1ee] hover:text-[#4e7e75]"><Check size={14} /></button><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-bold text-[#354540]">{item.label}</div><div className="mt-1 flex items-center gap-2 text-[10px] text-[#909892]"><span>{item.work}</span><span className="text-[#c3c6c1]">·</span><span>{item.age}</span></div></div><span className={`hidden rounded-md px-2 py-1 text-[9px] font-bold sm:block ${item.color === "orange" ? "bg-[#fff0e9] text-[#d7643a]" : "bg-[#eaf1ee] text-[#588278]"}`}>{item.priority}</span><button className="text-[#a0a8a2]"><MoreHorizontal size={16} /></button></div>)}{visibleAlerts.length === 0 && <div className="p-8 text-center text-[11px] text-[#8a958f]">Todo está bajo control por ahora.</div>}</div>
            </div>
            <div className="rise delay-3"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-extrabold tracking-[-.025em]">Actividad reciente</h2><p className="mt-1 text-[11px] text-[#89928d]">Lo último que cambió en tus obras</p></div><button className="text-[#8b9690]"><ArrowUpRight size={16} /></button></div><div className="space-y-1 rounded-2xl border border-[#dddcd5] bg-[#fbfaf7] p-4">{activity.map((item) => <div key={item.name} className="flex items-center gap-3 py-2"><div className={`grid size-8 shrink-0 place-items-center rounded-full text-[9px] font-bold ${item.tone === "orange" ? "bg-[#f4d4c5] text-[#9e563b]" : item.tone === "blue" ? "bg-[#cce0df] text-[#4a7775]" : "bg-[#e5d4a9] text-[#7f6930]"}`}>{item.initials}</div><div className="min-w-0 flex-1 text-[10px] leading-4"><span className="font-bold">{item.name}</span> <span className="text-[#87918b]">{item.action}</span><div className="truncate text-[#5d6f68]">{item.target}</div></div><span className="mono text-[9px] text-[#a0a8a3]">{item.time}</span></div>)}</div></div>
          </section>

          <section className="mt-9"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-extrabold tracking-[-.025em]">Tus obras</h2><p className="mt-1 text-[11px] text-[#89928d]">Selecciona una para cambiar el foco de trabajo</p></div><button className="text-[10px] font-bold text-[#5d736c]">Ver todas <ArrowUpRight className="ml-1 inline" size={13} /></button></div><div className="grid gap-3 md:grid-cols-3">{works.map((work) => <button key={work.code} onClick={() => setActiveWork(work.code)} className={`group rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${activeWork === work.code ? "border-[#7ea59b] bg-[#f6fbf8] shadow-[0_3px_0_#b9d0c9]" : "border-[#dddcd5] bg-[#fbfaf7]"}`}><div className="flex items-center justify-between"><span className="mono text-[9px] tracking-[.08em] text-[#9ba39e]">{work.code}</span><span className={`size-2 rounded-full ${work.tone === "orange" ? "bg-[#ef7548]" : work.tone === "blue" ? "bg-[#70a5a0]" : "bg-[#b6a15f]"}`} /></div><div className="mt-3 text-[12px] font-bold">{work.name}</div><div className="mt-1 text-[10px] text-[#8a948e]">{work.site}</div><div className="mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 rounded-full bg-[#e5e5df]"><div className="h-full rounded-full bg-[#5b8d84]" style={{ width: `${work.progress}%` }} /></div><span className="mono text-[10px] text-[#586a64]">{work.progress}%</span></div></button>)}</div></section>
        </div>
      </main>

      {showNew && <div className="fixed inset-0 z-40 grid place-items-center bg-[#203330]/30 p-5 backdrop-blur-[2px]" onClick={() => setShowNew(false)}><div onClick={(e) => e.stopPropagation()} className="w-full max-w-[430px] rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="mono text-[10px] uppercase tracking-[.15em] text-[#ef7548]">Nueva acción</div><h2 className="mt-2 text-[20px] font-extrabold tracking-[-.04em]">Reportar incidencia</h2></div><button onClick={() => setShowNew(false)} className="text-[#8a958f]"><X size={18} /></button></div><label className="mt-6 block text-[10px] font-bold text-[#596963]">Título breve<input className="mt-2 h-10 w-full rounded-lg border border-[#dadbd5] bg-[#fffefa] px-3 text-[11px] outline-none focus:border-[#7ea59b]" placeholder="¿Qué está bloqueando el avance?" /></label><label className="mt-4 block text-[10px] font-bold text-[#596963]">Obra<select className="mt-2 h-10 w-full rounded-lg border border-[#dadbd5] bg-[#fffefa] px-3 text-[11px] outline-none"><option>Torre Ladera</option><option>Casa Nómada</option><option>Centro Cívico Norte</option></select></label><div className="mt-6 flex justify-end gap-2"><button onClick={() => setShowNew(false)} className="rounded-lg px-4 py-2.5 text-[11px] font-bold text-[#748079]">Cancelar</button><button onClick={() => setShowNew(false)} className="rounded-lg bg-[#ef7548] px-4 py-2.5 text-[11px] font-bold text-white">Crear incidencia</button></div></div></div>}
      <button onClick={() => setShowNew(true)} className="fixed bottom-5 right-5 z-10 grid size-12 place-items-center rounded-full bg-[#ef7548] text-white shadow-lg sm:hidden"><Plus size={20} /></button>
    </div>
  );
}