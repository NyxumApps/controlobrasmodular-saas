import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock3,
  Cloud,
  FileWarning,
  Gauge,
  MoreHorizontal,
  Search,
  ShieldAlert,
  Signal,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";

type Health = "Estable" | "Atención" | "Crítico";

const projects = [
  { code: "TA", name: "Torre Arboleda", place: "CDMX · Insurgentes 1280", progress: 68, health: "Estable" as Health, days: 18, risk: "Permisos", cost: "$12.4 M", color: "#ee7654", spark: [42, 48, 44, 58, 60, 64, 68] },
  { code: "CL", name: "Casa Loma Norte", place: "CDMX · Lomas de Chapultepec", progress: 42, health: "Atención" as Health, days: 63, risk: "Compras", cost: "$4.8 M", color: "#cf9950", spark: [60, 56, 52, 48, 45, 44, 42] },
  { code: "C4", name: "Centro Logístico 04", place: "Querétaro · Parque Industrial", progress: 91, health: "Crítico" as Health, days: -4, risk: "Retraso", cost: "$8.1 M", color: "#bd5f51", spark: [68, 72, 74, 80, 83, 88, 91] },
  { code: "PV", name: "Plaza Vértice", place: "Puebla · Angelópolis", progress: 27, health: "Estable" as Health, days: 112, risk: "Sin riesgos", cost: "$6.2 M", color: "#5a9a83", spark: [12, 16, 17, 20, 23, 25, 27] },
];

const healthStyles: Record<Health, { text: string; bg: string; dot: string }> = {
  Estable: { text: "#34755f", bg: "#e6f1e8", dot: "#4d9b77" },
  Atención: { text: "#a16a21", bg: "#f8edda", dot: "#d3983e" },
  Crítico: { text: "#b64e43", bg: "#fae3df", dot: "#d46357" },
};

export function ObraControlCommandCenter() {
  const [active, setActive] = useState("Centro de mando");
  const [range, setRange] = useState("Esta semana");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState(true);
  const [selected, setSelected] = useState(projects[0]);
  const [showFilters, setShowFilters] = useState(false);
  const filtered = useMemo(() => projects.filter((p) => `${p.name} ${p.place}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const nav = [
    { label: "Centro de mando", icon: Gauge },
    { label: "Mis obras", icon: Building2 },
    { label: "Incidencias", icon: AlertTriangle, count: 7 },
    { label: "Equipo", icon: UsersRound },
    { label: "Validación", icon: ShieldAlert },
  ];

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f3f4ef] text-[#18332f]" style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <div className="flex min-h-[100dvh]">
        <aside className="hidden w-[236px] shrink-0 flex-col bg-[#193c36] px-4 py-5 text-[#f7f4eb] md:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#ee7654] text-[15px] font-extrabold tracking-[-0.08em]">oc</div>
            <div><div className="text-[15px] font-extrabold tracking-[-0.05em]">obra<span className="text-[#f2aa82]">control</span></div><div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-[#9bbeb1]">espacio de trabajo</div></div>
          </div>
          <div className="mt-11 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[#83a89b]">Operación</div>
          <nav className="mt-3 space-y-1">
            {nav.map(({ label, icon: Icon, count }) => <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center justify-between rounded-[9px] px-3 py-2.5 text-left text-[11px] font-semibold transition-all ${active === label ? "bg-[#315b50] text-[#fff9ee]" : "text-[#b4ccc2] hover:bg-[#284e45]"}`}><span className="flex items-center gap-3"><Icon size={15} strokeWidth={1.8} />{label}</span>{count && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 font-mono text-[10px] ${active === label ? "bg-[#ee7654] text-white" : "bg-[#40655b] text-[#dbe8e1]"}`}>{count}</span>}</button>)}
          </nav>
          <div className="mt-auto rounded-xl border border-[#41665b] bg-[#224940] p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold"><Signal size={13} className="text-[#78bc91]" /> Estado operativo</div>
            <div className="mt-2 flex items-end justify-between"><span className="text-[20px] font-extrabold tracking-[-0.06em]">94.8%</span><span className="font-mono text-[9px] text-[#9fc8b8]">+2.4%</span></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#386258]"><div className="h-full w-[95%] rounded-full bg-[#72b98d]" /></div>
            <p className="mt-2 text-[9px] leading-4 text-[#9fc1b5]">Señales actualizadas hace 4 min.</p>
          </div>
          <button className="mt-5 flex items-center gap-2 px-2 text-[10px] font-semibold text-[#a9c5ba]"><SlidersHorizontal size={14} /> Configuración</button>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[68px] items-center justify-between border-b border-[#dde3db] bg-[#fafaf6] px-5 sm:px-8">
            <div><div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#89968f]">Operación / Vista general</div><h1 className="mt-1 text-[19px] font-extrabold tracking-[-0.055em]">Centro de mando</h1></div>
            <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-lg border border-[#dfe4dc] bg-white px-3 py-2 sm:flex"><Search size={14} className="text-[#8c9b94]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar obra..." className="w-[140px] bg-transparent text-[10px] outline-none placeholder:text-[#a2aca6]" /></div><button className="relative rounded-lg border border-[#dfe4dc] bg-white p-2 text-[#667a72]"><Bell size={16} /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#ee7654]" /></button><div className="hidden h-8 w-8 place-items-center rounded-full bg-[#e3c9b2] text-[10px] font-extrabold text-[#704c3b] sm:grid">MR</div></div>
          </header>

          <div className="mx-auto max-w-[1300px] p-5 sm:p-8">
            {notice && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#ead5b1] bg-[#fff8e9] px-4 py-3 text-[10px] text-[#735b37]"><div className="flex items-center gap-2"><Cloud size={15} className="text-[#c58a3b]" /><span><strong className="font-extrabold">Sincronización completa.</strong> Todos los datos operativos están al día.</span></div><button onClick={() => setNotice(false)}><X size={14} /></button></div>}
            <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#87958e]">Jueves, 19 septiembre 2024</p><h2 className="mt-2 text-[27px] font-extrabold tracking-[-0.065em] sm:text-[31px]">Lo que necesita tu atención.</h2></div><div className="flex items-center gap-2"><button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-bold ${showFilters ? "border-[#315b50] bg-[#edf3ee] text-[#315b50]" : "border-[#dce2da] bg-white text-[#60756c]"}`}><SlidersHorizontal size={13} /> Filtros</button><button onClick={() => setRange(range === "Esta semana" ? "Este mes" : "Esta semana")} className="flex items-center gap-2 rounded-lg border border-[#dce2da] bg-white px-3 py-2 text-[10px] font-bold text-[#60756c]">{range}<ChevronDown size={13} /></button></div></div>

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Obras activas", value: "12", delta: "+2 este mes", icon: Building2, color: "#4d8874", trend: "up" },
                { label: "Salud promedio", value: "78.4", delta: "+4.6 pts", icon: Activity, color: "#bd7b3e", trend: "up" },
                { label: "Alertas abiertas", value: "07", delta: "3 prioritarias", icon: AlertTriangle, color: "#c55f51", trend: "down" },
                { label: "Hitos esta semana", value: "24", delta: "18 completados", icon: CalendarClock, color: "#687e9d", trend: "up" },
              ].map(({ label, value, delta, icon: Icon, color, trend }) => <div key={label} className="rounded-xl border border-[#dfe4dc] bg-[#fbfbf8] p-4"><div className="flex items-start justify-between"><div className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${color}16`, color }}><Icon size={15} /></div><span className="font-mono text-[9px] text-[#8b9992]">{trend === "up" ? <ArrowUpRight size={12} className="inline text-[#4d9875]" /> : <ArrowDownRight size={12} className="inline text-[#c55f51]" />} vs. anterior</span></div><div className="mt-4 text-[26px] font-extrabold tracking-[-0.07em]">{value}</div><div className="mt-0.5 text-[10px] font-bold text-[#657970]">{label}</div><div className="mt-2 font-mono text-[9px]" style={{ color }}>{delta}</div></div>)}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(290px,0.8fr)]">
              <div className="rounded-xl border border-[#dfe4dc] bg-[#fbfbf8] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-[15px] font-extrabold tracking-[-0.04em]">Salud de tus obras</h3><p className="mt-1 text-[10px] text-[#86958e]">Riesgo, avance y fecha comprometida</p></div><div className="flex items-center gap-3 font-mono text-[9px] text-[#8b9992]"><span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#4d9b77]" />Estable</span><span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#d3983e]" />Atención</span><span><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#d46357]" />Crítico</span></div></div>
                <div className="mt-5 overflow-x-auto"><div className="min-w-[610px]"><div className="grid grid-cols-[minmax(190px,1.5fr)_100px_125px_85px_24px] gap-3 border-b border-[#e5e8e2] px-2 pb-2 font-mono text-[8px] uppercase tracking-[0.13em] text-[#9ba59f]"><span>Proyecto</span><span>Salud</span><span>Avance</span><span>Compromiso</span><span /></div>{filtered.map((p) => { const hs = healthStyles[p.health]; return <button key={p.name} onClick={() => setSelected(p)} className={`grid w-full grid-cols-[minmax(190px,1.5fr)_100px_125px_85px_24px] items-center gap-3 rounded-lg border-b border-[#edf0eb] px-2 py-3 text-left transition-colors hover:bg-[#f1f4ef] ${selected.name === p.name ? "bg-[#f0f4ef]" : ""}`}><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg text-[10px] font-extrabold" style={{ color: p.color, background: `${p.color}18` }}>{p.code}</span><span><b className="block text-[11px] font-extrabold">{p.name}</b><small className="mt-0.5 block text-[9px] text-[#899791]">{p.place}</small></span></div><span className="flex items-center gap-1.5 text-[9px] font-bold" style={{ color: hs.text }}><i className="h-1.5 w-1.5 rounded-full" style={{ background: hs.dot }} />{p.health}</span><span><span className="mb-1 flex justify-between font-mono text-[9px] text-[#63766e]"><b>{p.progress}%</b><span>{p.risk}</span></span><span className="flex h-1 overflow-hidden rounded-full bg-[#e7ebe5]"><i className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.color }} /></span></span><span className={`font-mono text-[10px] font-bold ${p.days < 0 ? "text-[#c45d50]" : "text-[#657a70]"}`}>{p.days < 0 ? `${Math.abs(p.days)} días tarde` : `${p.days} días`}</span><MoreHorizontal size={14} className="text-[#9aa69f]" /></button> })}</div></div>
                <div className="mt-4 flex items-center justify-between"><span className="font-mono text-[9px] text-[#899790]">Mostrando {filtered.length} de 12 obras</span><button onClick={() => setQuery("")} className="text-[10px] font-extrabold text-[#ee7654]">Ver todas <ArrowUpRight size={12} className="inline" /></button></div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-[#dfe4dc] bg-[#fbfbf8] p-5"><div className="flex items-start justify-between"><div><h3 className="text-[15px] font-extrabold tracking-[-0.04em]">Señal de {selected.name}</h3><p className="mt-1 text-[10px] text-[#87968f]">Lectura de las últimas 7 semanas</p></div><div className="rounded-md px-2 py-1 text-[9px] font-bold" style={{ color: healthStyles[selected.health].text, background: healthStyles[selected.health].bg }}>{selected.health}</div></div><div className="mt-5 flex h-[76px] items-end gap-2 border-b border-[#e7ebe5] pb-2">{selected.spark.map((n, i) => <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${n * 0.78}px`, background: i === selected.spark.length - 1 ? selected.color : `${selected.color}55` }} />)}</div><div className="mt-3 flex justify-between font-mono text-[8px] text-[#9aa49e]"><span>AGO 08</span><span>AGO 22</span><span>SEP 05</span><span>SEP 19</span></div><div className="mt-5 grid grid-cols-2 gap-3"><div><div className="text-[9px] text-[#899790]">Avance físico</div><b className="text-[18px] tracking-[-0.05em]">{selected.progress}%</b></div><div><div className="text-[9px] text-[#899790]">Presupuesto</div><b className="text-[18px] tracking-[-0.05em]">{selected.cost}</b></div></div></div>
                <div className="rounded-xl border border-[#dfe4dc] bg-[#fbfbf8] p-5"><div className="flex items-center justify-between"><div><h3 className="text-[15px] font-extrabold tracking-[-0.04em]">Atención inmediata</h3><p className="mt-1 text-[10px] text-[#87968f]">Ordenado por impacto</p></div><span className="grid h-6 w-6 place-items-center rounded-full bg-[#fae3df] font-mono text-[9px] font-bold text-[#b64e43]">7</span></div><div className="mt-4 space-y-3">{[{ icon: FileWarning, t: "Contrato por vencer", s: "Centro Logístico 04 · hoy", c: "#c55f51" }, { icon: Clock3, t: "Hito fuera de fecha", s: "Casa Loma Norte · 2 días", c: "#c18a3e" }, { icon: CircleDashed, t: "Validación pendiente", s: "Torre Arboleda · 3 docs.", c: "#6883a0" }].map(({ icon: Icon, t, s, c }) => <button key={t} className="flex w-full items-center gap-3 text-left"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: `${c}17`, color: c }}><Icon size={14} /></span><span className="min-w-0 flex-1"><b className="block text-[10px] font-bold">{t}</b><small className="text-[9px] text-[#8a9992]">{s}</small></span><ArrowUpRight size={13} className="text-[#9ca8a2]" /></button>)}</div><button onClick={() => setActive("Incidencias")} className="mt-5 w-full rounded-lg border border-[#dfe4dc] py-2 text-[10px] font-extrabold text-[#536d63] hover:bg-[#f0f2ed]">Abrir bandeja de alertas</button></div>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe3db] pt-4 text-[9px] text-[#92a099]"><span>Última sincronización: hoy, 09:42</span><span className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-[#5b9a79]" /> 18 señales sin anomalías</span><span className="font-mono tracking-wide">OBRACONTROL / 2024</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ObraControlCommandCenter;