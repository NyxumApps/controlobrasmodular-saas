import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Clock3,
  Download,
  Filter,
  Gauge,
  LayoutDashboard,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

type Project = {
  name: string;
  location: string;
  budget: number;
  committed: number;
  forecast: number;
  baseline: number;
  due: string;
  delay: number;
  status: "En curso" | "Atención" | "Cerrado";
  accent: string;
};

const projects: Project[] = [
  { name: "Torre Arboleda", location: "CDMX · Insurgentes", budget: 12.4, committed: 9.1, forecast: 12.9, baseline: 12.4, due: "18 oct 2024", delay: 6, status: "Atención", accent: "#ef6a42" },
  { name: "Casa Loma Norte", location: "CDMX · Lomas", budget: 4.8, committed: 3.2, forecast: 4.6, baseline: 4.8, due: "06 dic 2024", delay: -2, status: "En curso", accent: "#2a8d80" },
  { name: "Centro Logístico 04", location: "Querétaro · Parque Industrial", budget: 8.1, committed: 7.7, forecast: 8.0, baseline: 8.1, due: "22 sep 2024", delay: 0, status: "Cerrado", accent: "#cf9950" },
  { name: "Residencial La Noria", location: "Puebla · Angelópolis", budget: 6.7, committed: 4.5, forecast: 7.1, baseline: 6.7, due: "30 nov 2024", delay: 11, status: "Atención", accent: "#6f83a3" },
];

const nav = ["Resumen", "Mis obras", "Comparativo", "Incidencias", "Validación"];

export function ObraControlPortfolio() {
  const [activeNav, setActiveNav] = useState("Comparativo");
  const [period, setPeriod] = useState<"Presupuesto" | "Calendario">("Presupuesto");
  const [status, setStatus] = useState<"Todas" | Project["status"]>("Todas");
  const [showFilters, setShowFilters] = useState(false);
  const visible = useMemo(() => status === "Todas" ? projects : projects.filter((p) => p.status === status), [status]);

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f5f5f0] text-[#18322e]" style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <div className="flex min-h-[100dvh]">
        <aside className="hidden w-[238px] shrink-0 flex-col bg-[#193c36] px-5 py-6 text-[#f4f1e8] md:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#ef6a42] text-[15px] font-extrabold tracking-[-0.08em]">oc</div>
            <div><div className="text-[15px] font-extrabold tracking-[-0.04em]">obra<span className="text-[#f4aa79]">control</span></div><div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-[#a8c4ba]">espacio de trabajo</div></div>
          </div>
          <div className="mt-12 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#89a99e]">Operación</div>
          <nav className="mt-3 space-y-1">{nav.map((item) => <button key={item} onClick={() => setActiveNav(item)} className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[12px] font-semibold ${activeNav === item ? "bg-[#315a50] text-[#fff8ed]" : "text-[#b2cac0] hover:bg-[#274d44]"}`}><span className="flex items-center gap-3">{item === "Comparativo" ? <Gauge size={16} /> : item === "Mis obras" ? <Building2 size={16} /> : item === "Incidencias" ? <CircleAlert size={16} /> : item === "Validación" ? <SlidersHorizontal size={16} /> : <LayoutDashboard size={16} />}{item}</span>{item === "Incidencias" && <span className="rounded-full bg-[#ef6a42] px-1.5 py-0.5 font-mono text-[10px] text-white">4</span>}</button>)}</nav>
          <div className="mt-auto rounded-[12px] border border-[#477064] bg-[#234b42] p-3.5"><div className="flex justify-between"><span className="font-mono text-[9px] uppercase tracking-[.17em] text-[#a8c4ba]">Portafolio</span><span className="rounded bg-[#f1bd86] px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-[#6a402b]">Pro</span></div><p className="mt-2 text-[11px] leading-4 text-[#d9e5dd]">12 obras activas · 31.4 M MXN</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-[#396257]"><div className="h-full w-[72%] rounded-full bg-[#ef6a42]" /></div><button className="mt-3 text-[10px] font-bold text-[#f4aa79]">Administrar vista <ArrowUpRight className="ml-1 inline" size={11} /></button></div>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="flex h-[74px] items-center justify-between border-b border-[#dfe3db] bg-[#f8f8f4] px-5 sm:px-8">
            <div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#193c36] text-[12px] font-extrabold text-white md:hidden">oc</div><div className="hidden items-center gap-2 text-[11px] text-[#73867e] sm:flex"><span>Workspace</span><span className="text-[#c2cbc4]">/</span><span className="font-semibold text-[#36554c]">Comparativo de portafolio</span></div><div className="relative md:hidden"><Search size={15} className="absolute left-3 top-2.5 text-[#82938c]"/><input aria-label="Buscar" placeholder="Buscar..." className="h-9 w-[140px] rounded-lg border border-[#dfe3db] bg-white pl-9 text-xs outline-none"/></div></div>
            <div className="flex items-center gap-3"><div className="relative hidden md:block"><Search size={15} className="absolute left-3 top-2.5 text-[#82938c]"/><input aria-label="Buscar en portafolio" placeholder="Buscar en tu workspace" className="h-9 w-[225px] rounded-lg border border-[#dfe3db] bg-white pl-9 text-[11px] outline-none"/></div><button aria-label="Notificaciones" className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#dfe3db] bg-white text-[#557269]"><Bell size={16}/><span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ef6a42]"/></button><div className="hidden h-7 w-px bg-[#dfe3db] sm:block"/><button className="flex items-center gap-2 rounded-lg p-1.5"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#e6b58a] font-mono text-[10px] font-bold text-[#5c3828]">MG</div><span className="hidden text-[11px] font-bold sm:block">María G.</span><ChevronDown size={13} className="text-[#82938c]"/></button></div>
          </header>
          <div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#ef6a42]">Lectura ejecutiva · 24 sep 2024</p><h1 className="mt-2 text-[27px] font-extrabold tracking-[-.06em] sm:text-[32px]">Comparativo de portafolio <span className="text-[#a1ada6]">/</span></h1><p className="mt-1 text-[12px] text-[#75867f]">Dónde se está moviendo el presupuesto y qué fechas necesitan una decisión.</p></div><div className="flex gap-2"><button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 rounded-lg border border-[#dfe3db] bg-[#fbfbf8] px-3 py-2.5 text-[11px] font-bold text-[#536d63]"><Filter size={14}/>{showFilters ? "Ocultar filtros" : "Filtros"}{showFilters && <span className="h-1.5 w-1.5 rounded-full bg-[#ef6a42]"/>}</button><button className="flex items-center gap-2 rounded-lg bg-[#ef6a42] px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_4px_12px_rgba(239,106,66,.18)]"><Download size={14}/>Exportar vista</button></div></div>
            {showFilters && <div className="mt-5 flex flex-wrap items-center gap-2 rounded-[10px] border border-[#e5e7df] bg-[#fbfbf8] p-3"><span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-[#83938c]">Estado</span>{(["Todas","En curso","Atención","Cerrado"] as const).map((item) => <button key={item} onClick={() => setStatus(item)} className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${status === item ? "bg-[#193c36] text-white" : "bg-[#f0f2ed] text-[#71827b]"}`}>{item}</button>)}</div>}
            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label:"Presupuesto total", value:"$31.4 M", meta:"12 obras activas", icon:WalletCards, color:"#ef6a42" },{ label:"Proyección final", value:"$32.6 M", meta:"+$1.2 M vs. base", icon:ArrowUpRight, color:"#cf9950" },{ label:"Desviación media", value:"+3.8%", meta:"↓ 1.4 pts este mes", icon:Gauge, color:"#2a8d80" },{ label:"Días comprometidos", value:"+15", meta:"en 4 obras", icon:Clock3, color:"#6f83a3" }].map(({label,value,meta,icon:Icon,color})=><div key={label} className="rounded-[12px] border border-[#dfe3db] bg-[#fbfbf8] p-4 shadow-[0_2px_10px_rgba(36,62,53,.025)]"><div className="flex items-start justify-between"><span className="text-[11px] font-semibold text-[#768881]">{label}</span><div className="grid h-7 w-7 place-items-center rounded-lg" style={{background:`${color}18`,color}}><Icon size={15}/></div></div><div className="mt-4 flex items-baseline gap-2"><strong className="font-mono text-[23px] tracking-[-.08em]">{value}</strong><span className="font-mono text-[9px] text-[#6d9a7f]">{meta}</span></div></div>)}</div>
            <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="min-w-0"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-[16px] font-extrabold tracking-[-.04em]">Obras frente a su línea base</h2><p className="mt-1 text-[11px] text-[#82918a]">Comparación de presupuesto aprobado, comprometido y proyección.</p></div><div className="flex rounded-lg border border-[#dfe3db] bg-white p-1">{(["Presupuesto","Calendario"] as const).map((item)=><button key={item} onClick={()=>setPeriod(item)} className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${period===item?"bg-[#193c36] text-white":"text-[#71827b]"}`}>{item}</button>)}</div></div>
                <div className="mt-4 overflow-hidden rounded-[12px] border border-[#dfe3db] bg-[#fbfbf8]">{visible.map((p,index)=><div key={p.name} className={`p-4 ${index<visible.length-1?"border-b border-[#e7eae4]":""}`}><div className="flex items-start gap-3"><div className="mt-1 h-9 w-1 rounded-full" style={{background:p.accent}}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-[12px] font-extrabold">{p.name}</strong><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${p.status==="Atención"?"bg-[#fff0e7] text-[#c75d3e]":p.status==="Cerrado"?"bg-[#f5ead9] text-[#9a713f]":"bg-[#e2f0e9] text-[#3e7963]"}`}>{p.status}</span></div><div className="mt-1 text-[10px] text-[#83938c]">{p.location}</div>{period==="Presupuesto" ? <div className="mt-3"><div className="relative h-2 rounded-full bg-[#e8ebe5]"><div className="absolute h-2 rounded-full bg-[#cbd6cd]" style={{width:`${(p.committed/p.budget)*100}%`}}/><div className="absolute top-[-3px] h-3.5 w-0.5 bg-[#ef6a42]" style={{left:`${Math.min(100,(p.forecast/p.budget)*100)}%`}}/></div><div className="mt-2 flex justify-between font-mono text-[9px] text-[#82918a]"><span>Comprometido <b className="text-[#36554c]">${p.committed.toFixed(1)} M</b></span><span>Proyección <b className={p.forecast>p.budget?"text-[#c75d3e]":"text-[#3e7963]"}>${p.forecast.toFixed(1)} M</b></span><span>Base ${p.budget.toFixed(1)} M</span></div></div> : <div className="mt-3 flex items-center gap-3"><div className="h-2 flex-1 rounded-full bg-[#e8ebe5]"><div className="h-2 rounded-full" style={{width:`${Math.max(25,100-p.delay*3)}%`,background:p.accent}}/></div><span className={`font-mono text-[10px] font-bold ${p.delay>0?"text-[#c75d3e]":"text-[#3e7963]"}`}>{p.delay>0?"+":""}{p.delay} días</span><span className="font-mono text-[9px] text-[#82918a]">{p.due}</span></div>}</div><MoreHorizontal size={16} className="text-[#9ba8a1]"/></div></div>)}</div><div className="mt-3 flex justify-between px-1 text-[10px] text-[#84938d]"><span>Mostrando {visible.length} de 12 obras</span><button className="font-extrabold text-[#ef6a42]">Abrir comparativo completo <ArrowUpRight size={12} className="inline"/></button></div></div>
              <div className="rounded-[12px] border border-[#dfe3db] bg-[#fbfbf8] p-5"><div className="flex items-start justify-between"><div><h2 className="text-[16px] font-extrabold tracking-[-.04em]">Señales para decidir</h2><p className="mt-1 text-[11px] text-[#82918a]">Las variaciones que más pesan hoy.</p></div><span className="rounded-md bg-[#fff0e7] px-2 py-1 font-mono text-[9px] font-bold text-[#c75d3e]">4 alertas</span></div><div className="mt-5 space-y-4"><div className="flex gap-3 border-b border-[#e7eae4] pb-4"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff0e7] text-[#ef6a42]"><ArrowUpRight size={15}/></div><div><div className="text-[11px] font-extrabold">Torre Arboleda supera la base</div><p className="mt-1 text-[10px] leading-4 text-[#81918a]">La proyección está $0.5 M arriba. Revisar acero y subcontrato.</p></div></div><div className="flex gap-3 border-b border-[#e7eae4] pb-4"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f5ead9] text-[#cf9950]"><CalendarDays size={15}/></div><div><div className="text-[11px] font-extrabold">4 hitos se mueven este mes</div><p className="mt-1 text-[10px] leading-4 text-[#81918a]">La mayor desviación está en Residencial La Noria.</p></div></div><div className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e2f0e9] text-[#2a8d80]"><ArrowDownRight size={15}/></div><div><div className="text-[11px] font-extrabold">Ahorro confirmado en 3 obras</div><p className="mt-1 text-[10px] leading-4 text-[#81918a]">Casa Loma Norte mantiene $0.2 M de margen favorable.</p></div></div></div><button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-[#dfe3db] py-2 text-[10px] font-extrabold text-[#536d63]"><CalendarDays size={13}/>Ver calendario de decisiones</button></div>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe3db] pt-4 text-[9px] text-[#92a099]"><span>Datos actualizados hoy, 09:42 · MXN</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#5b9a79]"/>Todas las obras sincronizadas</span><span className="font-mono tracking-wide">OBRACONTROL / PORTAFOLIO</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ObraControlPortfolio;