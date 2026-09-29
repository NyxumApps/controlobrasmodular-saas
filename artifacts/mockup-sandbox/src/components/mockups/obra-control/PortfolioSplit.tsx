import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  HardHat,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Users,
} from "lucide-react";

type Work = {
  name: string;
  place: string;
  progress: number;
  spend: string;
  budget: string;
  tone: string;
  status: "En curso" | "Riesgo";
};

const works: Work[] = [
  { name: "Torre Níspero", place: "Escazú · San José", progress: 68, spend: "₡184.6M", budget: "₡240M", tone: "orange", status: "En curso" },
  { name: "Centro Logístico Coyol", place: "Alajuela", progress: 42, spend: "₡96.2M", budget: "₡218M", tone: "teal", status: "Riesgo" },
  { name: "Casa Río Claro", place: "Santa Ana · San José", progress: 87, spend: "₡74.8M", budget: "₡86M", tone: "yellow", status: "En curso" },
];

const activity = [
  { icon: CircleDollarSign, title: "Factura aprobada", text: "Ferretería El Roble · ₡2.84M", time: "hace 18 min", color: "orange" },
  { icon: AlertTriangle, title: "Incidencia escalada", text: "Centro Logístico Coyol · Seguridad", time: "hace 1 h", color: "red" },
  { icon: Check, title: "Hito completado", text: "Torre Níspero · Estructura nivel 6", time: "ayer", color: "teal" },
];

export function PortfolioSplit() {
  const [view, setView] = useState<"overview" | "works">("overview");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const visibleWorks = works.filter((work) => work.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="obra-shell">
      <style>{`
        .obra-shell { --ink:#252a2a; --sub:#687271; --line:#d9ded9; --paper:#f7f8f4; --panel:#fffefb; --orange:#e85e32; --teal:#1a8e82; min-height:100vh; background:var(--paper); color:var(--ink); font-family:Plus Jakarta Sans, ui-sans-serif, sans-serif; display:flex; }
        .obra-sidebar { width:220px; background:#242b2b; color:#ecf0e9; padding:24px 16px; display:flex; flex-direction:column; flex-shrink:0; }
        .obra-logo { display:flex; align-items:center; gap:9px; font-size:18px; letter-spacing:-.04em; font-weight:800; padding:0 10px 30px; }
        .obra-logo-mark { width:28px; height:28px; display:grid; place-items:center; background:var(--orange); color:#fff; border-radius:7px; }
        .obra-nav { display:grid; gap:5px; }
        .obra-nav button { border:0; background:transparent; color:#aeb8b1; text-align:left; padding:11px 12px; border-radius:7px; display:flex; align-items:center; gap:11px; font:600 12px inherit; cursor:pointer; }
        .obra-nav button:hover,.obra-nav button.active { background:#374141; color:#fff; }
        .obra-sidebar-foot { margin-top:auto; border-top:1px solid #3c4644; padding:18px 10px 0; color:#aeb8b1; font-size:10px; line-height:1.5; }
        .obra-sidebar-foot strong { display:block; color:#f4f6ee; font-size:11px; margin-bottom:3px; }
        .obra-main { flex:1; min-width:0; padding:28px 38px 42px; max-width:1480px; }
        .obra-top { display:flex; justify-content:space-between; align-items:flex-start; gap:18px; margin-bottom:28px; }
        .obra-eyebrow { color:var(--orange); text-transform:uppercase; letter-spacing:.14em; font-size:10px; font-weight:800; margin:0 0 9px; }
        .obra-title { font-size:30px; letter-spacing:-.055em; line-height:1.05; margin:0; font-weight:800; }
        .obra-sub { margin:9px 0 0; color:var(--sub); font-size:12px; }
        .obra-actions { display:flex; gap:9px; align-items:center; }
        .obra-btn { border:1px solid var(--line); background:var(--panel); color:var(--ink); padding:10px 13px; border-radius:6px; font:700 11px inherit; display:flex; align-items:center; gap:7px; cursor:pointer; }
        .obra-btn:hover { border-color:#9ca8a2; transform:translateY(-1px); }
        .obra-btn.primary { background:var(--orange); border-color:var(--orange); color:white; }
        .obra-layout { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr); gap:18px; align-items:start; }
        .obra-panel { background:var(--panel); border:1px solid var(--line); border-radius:10px; }
        .obra-budget { padding:24px; min-height:274px; position:relative; overflow:hidden; }
        .obra-budget:after { content:""; position:absolute; width:210px; height:210px; border:1px solid #e8c9b8; border-radius:50%; right:-74px; bottom:-105px; box-shadow:0 0 0 24px #fbf1eb,0 0 0 25px #eddbd1,0 0 0 49px #fff7f1,0 0 0 50px #eddbd1; opacity:.8; }
        .obra-panel-label { display:flex; justify-content:space-between; align-items:center; color:var(--sub); text-transform:uppercase; font-size:10px; letter-spacing:.1em; font-weight:800; }
        .obra-kpi { margin-top:25px; display:flex; align-items:flex-end; gap:12px; }
        .obra-kpi strong { font:800 45px/1 Space Mono, monospace; letter-spacing:-.09em; }
        .obra-kpi span { color:var(--teal); font-weight:800; font-size:11px; margin-bottom:6px; }
        .obra-budget-meta { display:flex; gap:30px; margin-top:20px; position:relative; z-index:1; }
        .obra-budget-meta b { display:block; font:700 15px Space Mono,monospace; margin-top:4px; }
        .obra-budget-meta small { color:var(--sub); font-size:10px; }
        .obra-meter { margin-top:26px; max-width:65%; position:relative; z-index:1; }
        .obra-meter-track { height:8px; border-radius:20px; background:#ece7df; overflow:hidden; }
        .obra-meter-fill { width:72%; height:100%; background:var(--orange); border-radius:20px; }
        .obra-meter-caption { display:flex; justify-content:space-between; font-size:10px; color:var(--sub); margin-top:7px; }
        .obra-alert { padding:20px; background:#fff6e9; border-color:#eed8b1; min-height:274px; }
        .obra-alert-head { display:flex; gap:11px; align-items:flex-start; }
        .obra-alert-icon { background:#f0c26c; color:#654619; padding:8px; border-radius:7px; }
        .obra-alert h3 { margin:1px 0 4px; font-size:14px; letter-spacing:-.02em; }
        .obra-alert p { color:#776648; font-size:11px; line-height:1.55; margin:0; }
        .obra-alert-count { font:800 45px Space Mono,monospace; margin:27px 0 2px; letter-spacing:-.1em; }
        .obra-alert-link { border:0; background:transparent; padding:0; color:#a65a21; font:800 11px inherit; cursor:pointer; display:flex; align-items:center; gap:4px; }
        .obra-section { margin-top:25px; }
        .obra-section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .obra-section-head h2 { font-size:15px; letter-spacing:-.03em; margin:0; }
        .obra-section-head button { border:0; background:transparent; color:var(--orange); font:800 10px inherit; cursor:pointer; }
        .obra-works { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .obra-work { padding:17px; transition:transform .2s ease,border-color .2s ease; cursor:pointer; }
        .obra-work:hover { transform:translateY(-2px); border-color:#b5beb8; }
        .obra-work-top { display:flex; justify-content:space-between; gap:8px; }
        .obra-work h3 { font-size:13px; margin:0 0 5px; letter-spacing:-.025em; }
        .obra-work p { font-size:10px; color:var(--sub); margin:0; }
        .obra-status { font-size:9px; padding:4px 6px; border-radius:4px; font-weight:800; background:#e4f2eb; color:#28715e; white-space:nowrap; }
        .obra-status.risk { background:#fbe7db; color:#a5482b; }
        .obra-progress { margin-top:22px; }
        .obra-progress-row { display:flex; justify-content:space-between; font:700 10px Space Mono,monospace; margin-bottom:7px; }
        .obra-progress-track { height:5px; background:#e9eeea; border-radius:4px; overflow:hidden; }
        .obra-progress-fill { height:100%; border-radius:4px; background:var(--teal); }
        .obra-work:nth-child(1) .obra-progress-fill { background:var(--orange); }
        .obra-work:nth-child(3) .obra-progress-fill { background:#d39d22; }
        .obra-work-foot { display:flex; justify-content:space-between; margin-top:13px; color:var(--sub); font-size:10px; }
        .obra-bottom { display:grid; grid-template-columns:1.3fr .7fr; gap:18px; margin-top:25px; }
        .obra-activity { padding:18px 20px; }
        .obra-activity-list { display:grid; gap:15px; margin-top:17px; }
        .obra-activity-item { display:flex; align-items:center; gap:11px; }
        .obra-activity-icon { width:30px; height:30px; display:grid; place-items:center; border-radius:7px; background:#fff0e9; color:var(--orange); flex-shrink:0; }
        .obra-activity-icon.red { background:#fce9e4; color:#bf523b; }.obra-activity-icon.teal { background:#e4f2ed; color:var(--teal); }
        .obra-activity-item strong { display:block; font-size:11px; }.obra-activity-item span { display:block; color:var(--sub); font-size:10px; margin-top:3px; }
        .obra-time { margin-left:auto; color:#9aa49f; font-size:9px; white-space:nowrap; }
        .obra-pulse { padding:20px; background:#1f7771; color:#eff9f4; border-color:#1f7771; position:relative; overflow:hidden; }
        .obra-pulse:before { content:""; position:absolute; right:-30px; top:20px; width:150px; height:150px; border:1px solid #63b3a4; border-radius:50%; opacity:.45; box-shadow:0 0 0 19px #318b82,0 0 0 20px #63b3a4,0 0 0 42px #2a827a; }
        .obra-pulse h2 { font-size:14px; margin:0; position:relative; }.obra-pulse p { color:#bfe2d9; font-size:10px; line-height:1.5; max-width:190px; position:relative; margin:8px 0 21px; }
        .obra-pulse-stat { font:800 28px Space Mono,monospace; position:relative; }.obra-pulse-label { text-transform:uppercase; font-size:9px; letter-spacing:.1em; color:#bfe2d9; position:relative; }
        .obra-toast { position:fixed; right:22px; bottom:22px; background:#252b2b; color:#fff; padding:12px 15px; border-radius:7px; font-size:11px; box-shadow:0 8px 25px #25302d26; }
        @media (max-width:900px) { .obra-sidebar { width:68px; padding:20px 9px; }.obra-logo { padding:0 10px 30px; }.obra-logo span,.obra-nav button span,.obra-sidebar-foot { display:none; }.obra-nav button { justify-content:center; }.obra-main { padding:24px 20px 36px; }.obra-layout,.obra-bottom { grid-template-columns:1fr; }.obra-works { grid-template-columns:1fr; } }
        @media (max-width:580px) { .obra-shell { display:block; }.obra-sidebar { display:none; }.obra-main { padding:22px 14px 30px; }.obra-top { display:block; }.obra-actions { margin-top:18px; }.obra-btn { flex:1; justify-content:center; }.obra-kpi strong { font-size:36px; }.obra-meter { max-width:90%; }.obra-budget-meta { gap:18px; } }
      `}</style>
      <aside className="obra-sidebar">
        <div className="obra-logo"><span className="obra-logo-mark"><HardHat size={16} /></span><span>ObraControl</span></div>
        <nav className="obra-nav">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><LayoutDashboard size={15} /><span>Portafolio</span></button>
          <button className={view === "works" ? "active" : ""} onClick={() => setView("works")}><HardHat size={15} /><span>Obras</span></button>
          <button onClick={() => setNotice("Incidencias abiertas: 4")}><AlertTriangle size={15} /><span>Incidencias</span></button>
          <button onClick={() => setNotice("12 personas en el equipo")}><Users size={15} /><span>Equipo</span></button>
        </nav>
        <div className="obra-sidebar-foot"><strong>Constructora Litoral</strong>Cuenta de administración<br />Actualizado hace 4 min</div>
      </aside>
      <main className="obra-main">
        <header className="obra-top">
          <div><p className="obra-eyebrow">Martes, 18 de junio · 09:42</p><h1 className="obra-title">Buenos días, Valeria.</h1><p className="obra-sub">Una lectura rápida de lo que está moviéndose en tus obras.</p></div>
          <div className="obra-actions"><button className="obra-btn" onClick={() => setNotice("Selector de periodo listo")}><CalendarDays size={14} /> Este mes</button><button className="obra-btn primary" onClick={() => setNotice("Nueva obra: formulario abierto")}><Plus size={14} /> Nueva obra</button></div>
        </header>
        {view === "overview" ? <><div className="obra-layout">
          <section className="obra-panel obra-budget"><div className="obra-panel-label"><span>Presupuesto en ejecución</span><MoreHorizontal size={16} /></div><div className="obra-kpi"><strong>₡355.6M</strong><span>↗ 8.4%</span></div><div className="obra-budget-meta"><div><small>Comprometido</small><b>₡71.2M</b></div><div><small>Disponible</small><b>₡138.4M</b></div><div><small>Obras activas</small><b>03</b></div></div><div className="obra-meter"><div className="obra-meter-track"><div className="obra-meter-fill" /></div><div className="obra-meter-caption"><span>Ejecutado · 72%</span><span>₡493.9M total</span></div></div></section>
          <section className="obra-panel obra-alert"><div className="obra-alert-head"><span className="obra-alert-icon"><AlertTriangle size={17} /></span><div><h3>Atención requerida</h3><p>Hay movimientos que necesitan una decisión antes del viernes.</p></div></div><div className="obra-alert-count">04</div><button className="obra-alert-link" onClick={() => setNotice("Mostrando las 4 alertas prioritarias")}>Ver alertas prioritarias <ChevronRight size={13} /></button></section>
        </div>
        <section className="obra-section"><div className="obra-section-head"><h2>Obras en curso</h2><button onClick={() => setView("works")}>Ver todas <ArrowUpRight size={12} style={{ verticalAlign:"-2px" }} /></button></div><div className="obra-works">{visibleWorks.map((work) => <article className="obra-panel obra-work" key={work.name} onClick={() => setNotice(`${work.name}: detalle abierto`)}><div className="obra-work-top"><div><h3>{work.name}</h3><p>{work.place}</p></div><span className={`obra-status ${work.status === "Riesgo" ? "risk" : ""}`}>{work.status}</span></div><div className="obra-progress"><div className="obra-progress-row"><span>Avance</span><span>{work.progress}%</span></div><div className="obra-progress-track"><div className="obra-progress-fill" style={{ width:`${work.progress}%` }} /></div></div><div className="obra-work-foot"><span>{work.spend} ejecutado</span><span>{work.budget}</span></div></article>)}</div></section>
        <div className="obra-bottom"><section className="obra-panel obra-activity"><div className="obra-section-head" style={{ marginBottom:0 }}><h2>Actividad reciente</h2><button onClick={() => setNotice("Historial completo abierto")}>Ver historial <ArrowUpRight size={12} style={{ verticalAlign:"-2px" }} /></button></div><div className="obra-activity-list">{activity.map(({ icon:Icon, title, text, time, color }) => <div className="obra-activity-item" key={title}><span className={`obra-activity-icon ${color}`}><Icon size={14} /></span><div><strong>{title}</strong><span>{text}</span></div><span className="obra-time">{time}</span></div>)}</div></section><section className="obra-panel obra-pulse"><h2>Ritmo de la operación</h2><p>Tu equipo cerró más pendientes que la semana anterior.</p><div className="obra-pulse-stat">+16.8%</div><div className="obra-pulse-label">alertas resueltas</div></section></div></> : <section className="obra-panel" style={{ padding:24 }}><div className="obra-section-head"><div><p className="obra-eyebrow">Directorio operativo</p><h2 style={{ fontSize:20, margin:0 }}>Todas las obras</h2></div><div className="obra-actions"><div style={{ display:"flex", alignItems:"center", gap:7, border:"1px solid var(--line)", background:"var(--panel)", padding:"9px 11px", borderRadius:6 }}><Search size={14} color="#687271" /><input aria-label="Buscar obra" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar obra" style={{ border:0, outline:0, background:"transparent", font:"600 11px inherit", width:110 }} /></div><button className="obra-btn" onClick={() => setNotice("Filtros abiertos")}><Settings2 size={14} /> Filtrar</button></div></div><div className="obra-works">{visibleWorks.map((work) => <article className="obra-panel obra-work" key={work.name}><div className="obra-work-top"><div><h3>{work.name}</h3><p>{work.place}</p></div><span className={`obra-status ${work.status === "Riesgo" ? "risk" : ""}`}>{work.status}</span></div><div className="obra-progress"><div className="obra-progress-row"><span>Avance</span><span>{work.progress}%</span></div><div className="obra-progress-track"><div className="obra-progress-fill" style={{ width:`${work.progress}%` }} /></div></div><div className="obra-work-foot"><span>{work.spend} ejecutado</span><span>{work.budget}</span></div></article>)}</div></section>}
        {notice && <div className="obra-toast" role="status" onClick={() => setNotice("")}>{notice} · <u>cerrar</u></div>}
      </main>
    </div>
  );
}

export default PortfolioSplit;