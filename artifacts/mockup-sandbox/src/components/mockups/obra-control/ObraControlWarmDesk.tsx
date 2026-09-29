import { useState } from "react";
import {
  Activity, AlertCircle, ArrowUpRight, BarChart3, Bell, Building2, ChevronDown,
  CircleHelp, ClipboardCheck, Hammer, LayoutDashboard, Menu, MoreHorizontal,
  Settings, Users, X, CheckCircle2
} from "lucide-react";
import "./ObraControlWarmDesk.css";

type Work = { name: string; place: string; progress: number; spend: string; budget: string; status: string };

const works: Work[] = [
  { name: "Casa Ladera", place: "Escazú · San José", progress: 68, spend: "₡42.8M", budget: "₡61.2M", status: "En curso" },
  { name: "Taller Nube", place: "Santa Ana · San José", progress: 42, spend: "₡18.4M", budget: "₡39.7M", status: "En curso" },
  { name: "Patio Norte", place: "Cartago · Cartago", progress: 81, spend: "₡27.1M", budget: "₡31.6M", status: "En curso" },
];

const activity = [
  { icon: ClipboardCheck, title: "Contrato aprobado", detail: "Casa Ladera · hace 18 min", color: "var(--olive)" },
  { icon: AlertCircle, title: "Variación de costos", detail: "Taller Nube · hace 2 h", color: "var(--ochre)" },
  { icon: Users, title: "Nuevo subcontratista", detail: "Patio Norte · ayer", color: "var(--wine)" },
];

export default function ObraControlWarmDesk() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Portafolio");
  const [showAll, setShowAll] = useState(false);
  const nav = [
    { label: "Portafolio", icon: LayoutDashboard },
    { label: "Obras", icon: Hammer },
    { label: "Incidencias", icon: AlertCircle, count: "3" },
    { label: "Subcontratistas", icon: Users },
    { label: "Módulos", icon: BarChart3 },
  ];

  return (
    <div className="warm-desk relative min-h-[100dvh] overflow-hidden">
      <div className="grain" />
      <div className="relative flex min-h-[100dvh]">
        <aside className={`${mobileOpen ? "flex" : "hidden"} lg:flex fixed lg:static inset-y-0 left-0 z-30 w-[248px] shrink-0 flex-col border-r border-[#ded2c4] bg-[#f1e8da]`}>
          <div className="flex h-[92px] items-center border-b border-[#ded2c4] px-7">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--wine)] text-[#f8eee1]"><Building2 size={19} /></span>
              <div>
                <div className="brand-mark text-[22px] leading-none tracking-[-.04em]">ObraControl</div>
                <div className="mt-1 text-[9px] font-bold uppercase tracking-[.22em] text-[var(--muted)]">Mesa de obra</div>
              </div>
            </div>
            <button className="ml-auto lg:hidden text-[var(--muted)]" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)}><X size={20} /></button>
          </div>
          <div className="px-5 pt-8">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.19em] text-[var(--muted)]">Espacio de trabajo</p>
            <nav className="space-y-1">
              {nav.map(({ label, icon: Icon, count }) => {
                const active = activeNav === label;
                return <button key={label} onClick={() => { setActiveNav(label); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold ${active ? "bg-[var(--wine)] text-[#fff7ec] shadow-[0_5px_16px_rgba(127,48,47,.16)]" : "text-[#695e55] hover:bg-[#e8dccd]"}`}>
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span className="flex-1">{label}</span>{count && <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-[#a6534d]" : "bg-[#e1c9b4] text-[var(--wine)]"}`}>{count}</span>}
                </button>;
              })}
            </nav>
          </div>
          <div className="mt-auto border-t border-[#ded2c4] p-5">
            <button onClick={() => setActiveNav("Configuración")} className="mb-5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-[#695e55] hover:bg-[#e8dccd]"><Settings size={17} />Configuración</button>
            <div className="flex items-center gap-3 rounded-xl bg-[#e9ddce] p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--olive)] text-xs font-bold text-[#f8f1e6]">LM</div>
              <div className="min-w-0"><div className="truncate text-[12px] font-bold">Lucía Méndez</div><div className="truncate text-[10px] text-[var(--muted)]">Dirección · Lumen</div></div>
              <ChevronDown size={14} className="ml-auto text-[var(--muted)]" />
            </div>
          </div>
        </aside>

        <main className="scroll-area min-w-0 flex-1 overflow-y-auto">
          <header className="flex h-[92px] items-center justify-between border-b border-[#ded2c4] px-5 md:px-10">
            <button className="mr-4 text-[var(--muted)] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menú"><Menu size={22} /></button>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">Martes, 8 de octubre de 2024</p><h1 className="mt-1 truncate text-[25px] font-normal tracking-[-.03em] md:text-[29px]">Buenos días, Lucía.</h1></div>
            <div className="flex items-center gap-3">
              <button className="grid h-10 w-10 place-items-center rounded-full border border-[#ded2c4] text-[var(--muted)] hover:bg-[#eadfd2]" aria-label="Notificaciones"><Bell size={17} /></button>
              <button onClick={() => setActiveNav("Perfil")} className="hidden items-center gap-2 border-l border-[#ded2c4] pl-4 sm:flex"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#c9b99e] text-[11px] font-bold text-[#493f37]">LM</span><span className="text-[12px] font-semibold">Lucía Méndez</span></button>
            </div>
          </header>

          <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 md:py-11">
            <section className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[var(--wine)]">Vista general</p><h2 className="text-[37px] leading-[1.05] tracking-[-.045em] md:text-[45px]">El pulso de tus obras</h2><p className="mt-3 max-w-[500px] text-[13px] leading-relaxed text-[var(--muted)]">Todo lo importante, al alcance de una mirada. Tres equipos avanzan hoy.</p></div>
              <button onClick={() => setActiveNav("Obras")} className="flex w-fit items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-[12px] font-bold text-[#f8f1e6] hover:bg-[var(--wine)]">Ver todas las obras <ArrowUpRight size={15} /></button>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Obras activas", value: "03", sub: "de 07 en portafolio", icon: Hammer, tone: "var(--wine)" },
                { label: "Presupuesto ejecutado", value: "₡88.3M", sub: "de ₡132.5M asignados", icon: BarChart3, tone: "var(--olive)" },
                { label: "Atención esta semana", value: "03", sub: "incidencias abiertas", icon: Activity, tone: "var(--ochre)" },
              ].map(({ label, value, sub, icon: Icon, tone }) => <div key={label} className="relative overflow-hidden rounded-2xl border border-[#ded2c4] bg-[#f9f4ec] p-5 md:p-6"><div className="mb-7 flex items-start justify-between"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">{label}</span><span style={{ color: tone }}><Icon size={19} strokeWidth={1.7} /></span></div><div className="text-[30px] font-semibold tracking-[-.04em]">{value}</div><div className="mt-1 text-[11px] text-[var(--muted)]">{sub}</div><div className="absolute bottom-0 left-0 h-[3px] w-full" style={{ background: tone }} /></div>)}
            </section>

            <section className="mt-8 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
              <div className="rounded-2xl border border-[#ded2c4] bg-[#f9f4ec]">
                <div className="flex items-center justify-between border-b border-[#ded2c4] px-5 py-5 md:px-6"><div><h3 className="text-[21px] tracking-[-.025em]">Obras en curso</h3><p className="mt-1 text-[11px] text-[var(--muted)]">Avance y control presupuestal</p></div><button onClick={() => setShowAll(!showAll)} className="text-[11px] font-bold text-[var(--wine)] hover:opacity-70">{showAll ? "Ver menos" : "Ver resumen"}</button></div>
                <div className="divide-y divide-[#e5dacd] px-5 md:px-6">{(showAll ? works : works.slice(0, 2)).map(work => <button key={work.name} onClick={() => setActiveNav(work.name)} className="group block w-full py-5 text-left"><div className="mb-2 flex items-center justify-between"><span className="text-[14px] font-bold group-hover:text-[var(--wine)]">{work.name}</span><span className="font-mono text-[12px] text-[var(--muted)]">{work.progress}%</span></div><div className="mb-2 h-2 overflow-hidden rounded-full bg-[#e7dccf]"><div className="h-full rounded-full bg-[var(--olive)]" style={{ width: `${work.progress}%` }} /></div><div className="flex justify-between text-[11px] text-[var(--muted)]"><span>{work.place}</span><span><b className="font-semibold text-[var(--ink)]">{work.spend}</b> / {work.budget}</span></div></button>)}</div>
              </div>
              <div className="rounded-2xl border border-[#ded2c4] bg-[#f9f4ec]">
                <div className="border-b border-[#ded2c4] px-5 py-5 md:px-6"><h3 className="text-[21px] tracking-[-.025em]">Movimiento reciente</h3><p className="mt-1 text-[11px] text-[var(--muted)]">Lo último que pasó en tu equipo</p></div>
                <div className="space-y-1 px-5 py-4 md:px-6">{activity.map(({ icon: Icon, title, detail, color }) => <div key={title} className="flex items-start gap-3 rounded-xl px-2 py-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eee3d6]" style={{ color }}><Icon size={15} /></span><div><p className="text-[12px] font-bold">{title}</p><p className="mt-1 text-[11px] text-[var(--muted)]">{detail}</p></div><MoreHorizontal size={15} className="ml-auto mt-1 text-[#b6a99b]" /></div>)}</div>
                <button onClick={() => setActiveNav("Actividad")} className="mx-5 mb-5 flex items-center gap-2 text-[11px] font-bold text-[var(--wine)] md:mx-6">Abrir registro completo <ArrowUpRight size={14} /></button>
              </div>
            </section>

            <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#e8dfce] px-5 py-5 md:flex-row md:items-center md:px-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--olive)] text-[#f8f1e6]"><CheckCircle2 size={17} /></span><div><p className="text-[12px] font-bold">Tu semana va tomando forma</p><p className="mt-1 text-[11px] text-[var(--muted)]">14 usuarios activos · 3 alertas atendidas</p></div></div><button onClick={() => setActiveNav("Métricas")} className="flex items-center gap-2 pl-12 text-[11px] font-bold text-[var(--wine)] md:pl-0">Ver métricas de validación <ArrowUpRight size={14} /></button></section>
          </div>
        </main>
      </div>
    </div>
  );
}