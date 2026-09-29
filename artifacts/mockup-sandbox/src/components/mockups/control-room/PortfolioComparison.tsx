import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Filter,
  HardHat,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";

type Project = {
  code: string;
  name: string;
  location: string;
  health: number;
  budget: number;
  spent: number;
  variance: string;
  timeline: string;
  schedule: number;
  owner: string;
  tone: "coral" | "sage" | "gold" | "slate";
  issue: string;
};

const projects: Project[] = [
  { code: "OB-042", name: "Torre Ladera", location: "Escazú · San José", health: 82, budget: 1240000, spent: 756300, variance: "+4.8%", timeline: "18 sem", schedule: 68, owner: "LM", tone: "coral", issue: "Acero pendiente de validar" },
  { code: "OB-038", name: "Casa Nómada", location: "Santa Ana · San José", health: 67, budget: 685000, spent: 391400, variance: "+9.2%", timeline: "11 sem", schedule: 41, owner: "CR", tone: "sage", issue: "Instalación eléctrica ajustada" },
  { code: "OB-031", name: "Centro Cívico Norte", location: "Heredia · Heredia", health: 91, budget: 2100000, spent: 1795500, variance: "-1.4%", timeline: "6 sem", schedule: 86, owner: "AM", tone: "gold", issue: "Acabados en cierre" },
  { code: "OB-027", name: "Patio del Este", location: "Curridabat · San José", health: 74, budget: 930000, spent: 512800, variance: "+2.1%", timeline: "14 sem", schedule: 55, owner: "JP", tone: "slate", issue: "Permiso municipal en revisión" },
];

const money = (n: number) => `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}k`;

export default function PortfolioComparison() {
  const [active, setActive] = useState(["OB-042", "OB-038"]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"health" | "budget" | "schedule">("health");
  const [showAdd, setShowAdd] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const visible = useMemo(() => projects
    .filter((project) => `${project.name} ${project.location} ${project.code}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b[sort] - a[sort]), [query, sort]);
  const compared = projects.filter((project) => active.includes(project.code));
  const totalBudget = compared.reduce((sum, project) => sum + project.budget, 0);
  const totalSpent = compared.reduce((sum, project) => sum + project.spent, 0);
  const avgHealth = compared.length ? Math.round(compared.reduce((sum, project) => sum + project.health, 0) / compared.length) : 0;

  const toggleProject = (code: string) => setActive((items) => items.includes(code) ? items.filter((item) => item !== code) : items.length < 3 ? [...items, code] : items);

  return (
    <div className="min-h-[100dvh] bg-[#f5f3ee] text-[#203331]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .mono { font-family: 'DM Mono', monospace; }
        .grain { position: fixed; inset: 0; pointer-events:none; opacity:.035; z-index:30; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E"); }
        @keyframes rise { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .rise { animation: rise .45s ease-out both; }
        .delay-1 { animation-delay:.07s } .delay-2 { animation-delay:.14s } .delay-3 { animation-delay:.21s }
      `}</style>
      <div className="grain" />
      <aside className={`fixed inset-y-0 left-0 z-20 w-[248px] border-r border-[#d9d8d1] bg-[#ebe9e2] p-5 transition-transform lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5"><div className="grid size-9 place-items-center rounded-[10px] bg-[#ef7548] text-white"><HardHat size={20} strokeWidth={2.5} /></div><div><div className="text-[14px] font-extrabold tracking-[-.03em]">ObraControl</div><div className="mono text-[9px] uppercase tracking-[.18em] text-[#77807b]">campo / control</div></div></div>
          <button className="text-[#596763] lg:hidden" onClick={() => setMobileNav(false)}><X size={18} /></button>
        </div>
        <div className="mt-11"><div className="mono mb-3 px-3 text-[10px] uppercase tracking-[.16em] text-[#858d88]">Espacio de trabajo</div><button className="flex w-full items-center justify-between rounded-xl bg-[#d9d9d1] px-3 py-2.5 text-left text-[12px] font-semibold"><span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-[#304744] text-[10px] text-white">MT</span>Maderas & Tierra</span><ChevronDown size={15} /></button></div>
        <nav className="mt-8 space-y-1">
          {([[BarChart3, "Comparar portafolio", true], [CircleAlert, "Incidencias", false], [WalletCards, "Presupuestos", false], [Clock3, "Cronograma", false]] as const).map(([Icon, label, selected]) => <button key={String(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold ${selected ? "bg-[#304744] text-[#f7f5ef]" : "text-[#66716c] hover:bg-[#deddd6]"}`}><Icon size={16} />{String(label)}{label === "Incidencias" && <span className="mono ml-auto rounded-full bg-[#ef7548] px-1.5 py-0.5 text-[9px] text-white">3</span>}</button>)}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 border-t border-[#d5d3cb] pt-4"><button className="flex w-full items-center gap-3 text-left"><div className="grid size-8 place-items-center rounded-full bg-[#b9d6cf] text-[11px] font-bold text-[#2e514a]">MC</div><div><div className="text-[11px] font-bold">María Cordero</div><div className="text-[10px] text-[#7b8580]">Administradora</div></div><MoreHorizontal size={16} className="ml-auto text-[#8c9691]" /></button></div>
      </aside>
      <main className="lg:pl-[248px]">
        <header className="flex h-[72px] items-center border-b border-[#dddbd4] bg-[#f5f3ee]/90 px-5 backdrop-blur md:px-9"><button className="mr-3 text-[#41534e] lg:hidden" onClick={() => setMobileNav(true)}><Menu size={21} /></button><div className="hidden items-center gap-2 text-[11px] text-[#7c8580] sm:flex"><span>Portafolio</span><span className="text-[#c3c0b9]">/</span><span className="font-bold text-[#344743]">Comparativa</span></div><div className="ml-auto flex items-center gap-3"><div className="relative hidden md:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929a94]" size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar una obra" className="h-9 w-[210px] rounded-lg border border-[#dddcd5] bg-[#faf9f6] pl-9 pr-3 text-[11px] outline-none focus:border-[#8daaa1]" /></div><button className="relative grid size-9 place-items-center rounded-lg border border-[#dddcd5] bg-[#faf9f6] text-[#62716b]"><Bell size={16} /><span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#ef7548]" /></button><button onClick={() => setShowAdd(true)} className="hidden items-center gap-2 rounded-lg bg-[#ef7548] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_2px_0_#bd5b37] sm:flex"><Plus size={15} /> Añadir a comparación</button></div></header>
        <div className="mx-auto max-w-[1360px] px-5 py-7 md:px-9 md:py-10">
          <section className="rise flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mono mb-2 text-[10px] uppercase tracking-[.16em] text-[#ef7548]">Lectura ejecutiva · 24 septiembre 2024</div><h1 className="text-[29px] font-extrabold tracking-[-.055em] md:text-[36px]">Dónde poner el foco.</h1><p className="mt-2 max-w-[580px] text-[12px] leading-5 text-[#78837d]">Compara salud, dinero y tiempo en una sola mirada. Las decisiones difíciles quedan visibles antes de entrar a cada obra.</p></div><div className="flex items-center gap-2 rounded-lg border border-[#dcdbd4] bg-[#efeee9] px-3 py-2 text-[10px] font-bold text-[#5d736c]"><Sparkles size={14} className="text-[#ef7548]" />{compared.length} obras en foco</div></section>
          <section className="mt-8 grid gap-4 md:grid-cols-[1.25fr_1fr_1fr]">
            <div className="rise delay-1 rounded-2xl bg-[#304744] p-5 text-[#f9f7f1] shadow-[0_7px_0_#c8c8c0] md:p-6"><div className="mono text-[10px] uppercase tracking-[.14em] text-[#a7c5bd]">Lectura del conjunto</div><div className="mt-5 flex items-end justify-between"><div><div className="mono text-[38px] leading-none">{avgHealth}<span className="text-[16px] text-[#a7c5bd]">/100</span></div><div className="mt-2 text-[10px] text-[#a7c5bd]">salud operativa media</div></div><div className="text-right"><div className="text-[10px] text-[#a7c5bd]">Exposición restante</div><div className="mt-1 text-[17px] font-extrabold">{money(totalBudget - totalSpent)}</div></div></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#506963]"><div className="h-full rounded-full bg-[#e9c27c]" style={{ width: `${avgHealth}%` }} /></div></div>
            <div className="rise delay-2 rounded-2xl border border-[#dddcd5] bg-[#fbfaf7] p-5 md:p-6"><div className="flex items-center justify-between"><div className="mono text-[10px] uppercase tracking-[.14em] text-[#8d9690]">Presupuesto combinado</div><WalletCards size={17} className="text-[#ef7548]" /></div><div className="mt-5 text-[30px] font-extrabold tracking-[-.05em]">{money(totalBudget)}</div><div className="mt-1 flex items-center gap-2 text-[11px] text-[#7c8781]"><ArrowUpRight size={13} className="text-[#d7643a]" />{money(totalSpent)} comprometido</div></div>
            <div className="rise delay-3 rounded-2xl border border-[#dddcd5] bg-[#fbfaf7] p-5 md:p-6"><div className="flex items-center justify-between"><div className="mono text-[10px] uppercase tracking-[.14em] text-[#8d9690]">Tradeoff detectado</div><CircleAlert size={17} className="text-[#ef7548]" /></div><div className="mt-5 text-[20px] font-extrabold tracking-[-.04em]">Costo vs. certeza</div><div className="mt-2 text-[11px] leading-5 text-[#7c8781]">Casa Nómada protege margen si se resuelve su ajuste eléctrico esta semana.</div></div>
          </section>
          <section className="mt-9"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-[15px] font-extrabold tracking-[-.025em]">Comparativa lado a lado</h2><p className="mt-1 text-[11px] text-[#89928d]">Hasta tres obras para una decisión con contexto.</p></div><div className="flex items-center gap-2"><div className="flex rounded-lg border border-[#dcdbd4] bg-[#efeee9] p-1">{(["health", "budget", "schedule"] as const).map((item) => <button key={item} onClick={() => setSort(item)} className={`rounded-md px-2.5 py-1.5 text-[9px] font-bold ${sort === item ? "bg-[#fffefa] text-[#344943] shadow-sm" : "text-[#8b948e]"}`}>{item === "health" ? "Salud" : item === "budget" ? "Presupuesto" : "Avance"}</button>)}</div><button className="grid size-8 place-items-center rounded-lg border border-[#dddcd5] text-[#687871]"><Filter size={14} /></button></div></div>
            <div className="grid gap-4 lg:grid-cols-3">{compared.map((project, index) => <ProjectCard key={project.code} project={project} index={index} onRemove={() => toggleProject(project.code)} />)}{compared.length === 0 && <div className="rounded-2xl border border-dashed border-[#c9cdc5] bg-[#faf9f6] p-10 text-center text-[11px] text-[#85918a] lg:col-span-3">Selecciona una obra para comenzar la comparación.</div>}</div></section>
          <section className="mt-9"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-extrabold tracking-[-.025em]">Todas las obras</h2><p className="mt-1 text-[11px] text-[#89928d]">Selecciona para sumar o quitar del análisis.</p></div><button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-[10px] font-bold text-[#5d736c]"><SlidersHorizontal size={14} /> Gestionar selección</button></div><div className="overflow-hidden rounded-2xl border border-[#dddcd5] bg-[#fbfaf7]">{visible.map((project) => <button key={project.code} onClick={() => toggleProject(project.code)} className="flex w-full items-center gap-3 border-b border-[#e5e3dd] p-4 text-left last:border-0 hover:bg-[#f5f8f4]"><span className={`grid size-6 place-items-center rounded-md border ${active.includes(project.code) ? "border-[#5b8d84] bg-[#5b8d84] text-white" : "border-[#d5d9d2] text-transparent"}`}><Check size={13} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold">{project.name}</span><span className="text-[10px] text-[#909892]">{project.location} · {project.code}</span></span><span className="hidden w-[110px] text-right text-[10px] text-[#7b8780] sm:block">Salud <b className="text-[#334942]">{project.health}</b></span><span className="mono w-[70px] text-right text-[10px] text-[#586a64]">{money(project.budget)}</span><span className={`hidden rounded-md px-2 py-1 text-[9px] font-bold sm:block ${project.variance.startsWith("+") ? "bg-[#fff0e9] text-[#d7643a]" : "bg-[#eaf1ee] text-[#588278]"}`}>{project.variance}</span><ArrowDownRight size={14} className="text-[#a2aaa4]" /></button>)}</div></section>
        </div>
      </main>
      <button onClick={() => setShowAdd(true)} className="fixed bottom-5 right-5 z-10 grid size-12 place-items-center rounded-full bg-[#ef7548] text-white shadow-lg sm:hidden"><Plus size={20} /></button>
      {showAdd && <div className="fixed inset-0 z-40 grid place-items-center bg-[#203330]/30 p-5 backdrop-blur-[2px]" onClick={() => setShowAdd(false)}><div onClick={(e) => e.stopPropagation()} className="w-full max-w-[430px] rounded-2xl bg-[#fbfaf7] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="mono text-[10px] uppercase tracking-[.15em] text-[#ef7548]">Gestionar foco</div><h2 className="mt-2 text-[20px] font-extrabold tracking-[-.04em]">Añadir obras</h2></div><button onClick={() => setShowAdd(false)} className="text-[#8a958f]"><X size={18} /></button></div><div className="mt-5 space-y-2">{projects.map((project) => <button key={project.code} onClick={() => toggleProject(project.code)} className="flex w-full items-center gap-3 rounded-xl border border-[#e2e2db] p-3 text-left hover:bg-[#f2f6f2]"><span className={`grid size-6 place-items-center rounded-md ${active.includes(project.code) ? "bg-[#5b8d84] text-white" : "border border-[#d5d9d2] text-transparent"}`}><Check size={13} /></span><span className="flex-1"><span className="block text-[11px] font-bold">{project.name}</span><span className="text-[10px] text-[#909892]">{project.code} · salud {project.health}</span></span></button>)}</div><button onClick={() => setShowAdd(false)} className="mt-6 w-full rounded-lg bg-[#304744] py-2.5 text-[11px] font-bold text-white">Listo</button></div></div>}
    </div>
  );
}

function ProjectCard({ project, index, onRemove }: { project: Project; index: number; onRemove: () => void }) {
  const palette = { coral: ["#ef7548", "#fff0e9", "#d7643a"], sage: ["#5b8d84", "#eaf1ee", "#588278"], gold: ["#b49b59", "#f5efd9", "#8a7134"], slate: ["#718a95", "#eaf0f1", "#5f7780"] }[project.tone];
  return <article className={`rise rounded-2xl border border-[#dddcd5] bg-[#fbfaf7] p-5 ${index === 0 ? "delay-1" : index === 1 ? "delay-2" : "delay-3"}`}><div className="flex items-start justify-between"><div><div className="mono text-[9px] tracking-[.08em] text-[#9ba39e]">{project.code}</div><h3 className="mt-2 text-[15px] font-extrabold tracking-[-.03em]">{project.name}</h3><div className="mt-1 text-[10px] text-[#8a948e]">{project.location}</div></div><button onClick={onRemove} className="text-[#a0a8a2] hover:text-[#ef7548]"><X size={15} /></button></div><div className="mt-5 flex items-end justify-between"><div><div className="mono text-[30px] leading-none" style={{ color: palette[0] }}>{project.health}<span className="text-[13px] text-[#9ca59f]">/100</span></div><div className="mt-1 text-[10px] text-[#89938d]">salud de obra</div></div><div className="text-right"><div className="text-[10px] text-[#89938d]">avance</div><div className="mono mt-1 text-[15px] font-medium">{project.schedule}%</div></div></div><div className="mt-4 h-1.5 rounded-full bg-[#e5e5df]"><div className="h-full rounded-full" style={{ width: `${project.health}%`, background: palette[0] }} /></div><div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e8e6df] pt-4"><div><div className="mono text-[9px] uppercase text-[#a0a8a2]">Gastado</div><div className="mt-1 text-[13px] font-bold">{money(project.spent)}</div></div><div><div className="mono text-[9px] uppercase text-[#a0a8a2]">Restante</div><div className="mt-1 text-[13px] font-bold">{money(project.budget - project.spent)}</div></div></div><div className="mt-4 flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: palette[1] }}><span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: palette[2] }}><CircleAlert size={12} />{project.issue}</span><span className="mono text-[9px]" style={{ color: palette[2] }}>{project.timeline}</span></div></article>;
}