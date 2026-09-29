import { useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  HardHat,
  ImagePlus,
  MapPin,
  Menu,
  MoreHorizontal,
  Navigation,
  RefreshCw,
  TriangleAlert,
  WifiOff,
  X,
} from "lucide-react";

type Task = { id: number; title: string; detail: string; done: boolean; tag: string };

const initialTasks: Task[] = [
  { id: 1, title: "Revisar acero de losa", detail: "Nivel 03 · Eje B–F", done: false, tag: "08:30" },
  { id: 2, title: "Registrar avance de instalaciones", detail: "Fotos requeridas · 4 puntos", done: false, tag: "10:00" },
  { id: 3, title: "Validar entrega de concreto", detail: "Guía 00481 · Proveedor Cemex", done: true, tag: "Completada" },
  { id: 4, title: "Cerrar perímetro norte", detail: "Seguridad · Checklist 12B", done: false, tag: "14:00" },
];

export default function FieldCrewCheckIn() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [tab, setTab] = useState<"today" | "incidents">("today");
  const [showIncident, setShowIncident] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentPhoto, setIncidentPhoto] = useState<string | null>(null);
  const [queued, setQueued] = useState(2);
  const [toast, setToast] = useState("");

  const toggleTask = (id: number) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
    setToast("Tarea guardada en el dispositivo");
    window.setTimeout(() => setToast(""), 2200);
  };

  const submitIncident = () => {
    if (!incidentTitle.trim() && !incidentPhoto) return;
    setQueued((value) => value + 1);
    setShowIncident(false);
    setIncidentTitle("");
    setIncidentPhoto(null);
    setToast("Incidencia en cola · se enviará al recuperar señal");
    window.setTimeout(() => setToast(""), 2800);
  };

  return (
    <div className="min-h-[100dvh] bg-[#f1f0e9] text-[#263532]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        .fc-mono { font-family: 'DM Mono', monospace; }
        @keyframes fc-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .fc-rise { animation: fc-rise .38s ease-out both; }
        .fc-delay-1 { animation-delay: .06s } .fc-delay-2 { animation-delay: .12s }
        .fc-grid { background-image: linear-gradient(#d8d9d1 1px, transparent 1px), linear-gradient(90deg, #d8d9d1 1px, transparent 1px); background-size: 20px 20px; }
      `}</style>
      <div className="mx-auto min-h-[100dvh] max-w-[520px] bg-[#f8f7f2] shadow-[0_0_50px_rgba(37,53,49,.08)]">
        <header className="sticky top-0 z-20 border-b border-[#deded6] bg-[#f8f7f2]/95 px-5 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <button className="grid size-9 place-items-center rounded-xl border border-[#d8d9d2] bg-[#f2f1eb] text-[#546762]"><Menu size={18} /></button>
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-[9px] bg-[#ef7548] text-white"><HardHat size={17} strokeWidth={2.5} /></div>
              <div><div className="text-[12px] font-extrabold tracking-[-.03em]">ObraControl</div><div className="fc-mono text-[8px] uppercase tracking-[.16em] text-[#84908a]">modo campo</div></div>
            </div>
            <button className="relative grid size-9 place-items-center rounded-xl border border-[#d8d9d2] bg-[#f2f1eb] text-[#546762]"><MoreHorizontal size={18} /></button>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#e8eee9] px-3 py-2.5">
            <div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-[#304744] text-[9px] font-bold text-white">TL</span><div><div className="text-[10px] font-bold">Torre Ladera</div><div className="fc-mono text-[8px] text-[#71817a]">OB-042 · Escazú</div></div></div>
            <ChevronRight size={15} className="text-[#789088]" />
          </div>
        </header>

        <main className="px-5 pb-28 pt-5">
          <section className="fc-rise rounded-2xl bg-[#304744] p-5 text-[#f8f7f2] shadow-[0_6px_0_#c9ccc3]">
            <div className="flex items-start justify-between">
              <div><div className="fc-mono text-[9px] uppercase tracking-[.16em] text-[#a9c7be]">Mi jornada · martes 24 sep</div><h1 className="mt-2 text-[23px] font-extrabold tracking-[-.055em]">{checkedIn ? "Ya estás en obra." : "Listo para entrar."}</h1><p className="mt-1 text-[10px] text-[#bed0ca]">{checkedIn ? "Tu equipo sabe que llegaste. Buen trabajo." : "Registra tu llegada para activar tus tareas del día."}</p></div>
              <div className={`grid size-10 place-items-center rounded-full ${checkedIn ? "bg-[#9cc6b6] text-[#274940]" : "bg-[#47635c] text-[#c9ddd6]"}`}><MapPin size={19} /></div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[#536c65] pt-4">
              <div className="flex items-center gap-2 text-[9px] text-[#b8cbc5]"><Navigation size={13} /> GPS activo · precisión 8 m</div>
              <button onClick={() => setCheckedIn((value) => !value)} className={`rounded-lg px-3.5 py-2 text-[10px] font-extrabold transition-transform active:scale-95 ${checkedIn ? "bg-[#52746a] text-[#d7e6e0]" : "bg-[#ef7548] text-white shadow-[0_2px_0_#b95837]"}`}>{checkedIn ? "Registrar salida" : "Registrar entrada"}</button>
            </div>
          </section>

          <div className="fc-rise fc-delay-1 mt-5 flex items-center justify-between rounded-xl border border-[#e0dfd8] bg-[#fffefa] px-3.5 py-3">
            <div className="flex items-center gap-2.5"><div className="grid size-7 place-items-center rounded-lg bg-[#f4e5bf] text-[#97752e]"><WifiOff size={14} /></div><div><div className="text-[10px] font-bold">Trabajando sin conexión</div><div className="text-[9px] text-[#8a948e]">{queued} elementos esperan sincronizarse</div></div></div>
            <button onClick={() => setQueued(0)} className="flex items-center gap-1 text-[9px] font-bold text-[#5b8077]"><RefreshCw size={12} /> Sincronizar</button>
          </div>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#e9e8e1] p-1">
            <button onClick={() => setTab("today")} className={`rounded-lg py-2.5 text-[10px] font-extrabold ${tab === "today" ? "bg-[#fffefa] text-[#304744] shadow-sm" : "text-[#89938d]"}`}>Tareas de hoy <span className="fc-mono ml-1 text-[9px]">3</span></button>
            <button onClick={() => setTab("incidents")} className={`rounded-lg py-2.5 text-[10px] font-extrabold ${tab === "incidents" ? "bg-[#fffefa] text-[#304744] shadow-sm" : "text-[#89938d]"}`}>Incidencias <span className="fc-mono ml-1 text-[9px]">2</span></button>
          </div>

          {tab === "today" ? <section className="fc-rise fc-delay-2 mt-6">
            <div className="mb-3 flex items-end justify-between"><div><h2 className="text-[15px] font-extrabold tracking-[-.03em]">Tu ruta de trabajo</h2><p className="mt-1 text-[10px] text-[#8a958f]">{tasks.filter((task) => task.done).length} de {tasks.length} completadas · se guarda automáticamente</p></div><div className="fc-mono text-[13px] text-[#ef7548]">{Math.round(tasks.filter((task) => task.done).length / tasks.length * 100)}%</div></div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#e0e2db]"><div className="h-full rounded-full bg-[#ef7548] transition-all" style={{ width: `${tasks.filter((task) => task.done).length / tasks.length * 100}%` }} /></div>
            <div className="space-y-2">{tasks.map((task) => <button key={task.id} onClick={() => toggleTask(task.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[.99] ${task.done ? "border-[#dfe5df] bg-[#f2f6f1]" : "border-[#deded7] bg-[#fffefa]"}`}>
              <span className={`grid size-7 shrink-0 place-items-center rounded-lg border ${task.done ? "border-[#7eaa9d] bg-[#7eaa9d] text-white" : "border-[#c9d0c9] text-transparent"}`}><Check size={15} strokeWidth={3} /></span>
              <span className="min-w-0 flex-1"><span className={`block text-[11px] font-bold ${task.done ? "text-[#779087] line-through" : "text-[#344640]"}`}>{task.title}</span><span className="mt-1 block text-[9px] text-[#919b95]">{task.detail}</span></span>
              <span className={`fc-mono shrink-0 text-[9px] ${task.done ? "text-[#8ca49c]" : "text-[#ef7548]"}`}>{task.tag}</span>
            </button>)}</div>
          </section> : <section className="fc-rise mt-6">
            <div className="rounded-2xl border border-[#deded7] bg-[#fffefa] p-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-[#fff0e9] text-[#d7673f]"><TriangleAlert size={17} /></div><div><div className="text-[11px] font-extrabold">2 incidencias en cola</div><div className="mt-1 text-[9px] text-[#8b958f]">Se enviarán cuando vuelva la señal.</div></div></div><button onClick={() => setShowIncident(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef7548] py-3 text-[10px] font-extrabold text-white"><Camera size={15} /> Capturar nueva incidencia</button></div>
          </section>}
        </main>

        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[520px] -translate-x-1/2 items-center justify-around border-t border-[#deded6] bg-[#f8f7f2]/95 px-4 py-3 backdrop-blur">
          <button onClick={() => setTab("today")} className={`flex flex-col items-center gap-1 text-[8px] font-bold ${tab === "today" ? "text-[#304744]" : "text-[#9ba29d]"}`}><ClipboardIcon active={tab === "today"} /><span>Mi día</span></button>
          <button onClick={() => setShowIncident(true)} className="grid size-12 -translate-y-3 place-items-center rounded-2xl bg-[#ef7548] text-white shadow-[0_5px_0_#c25e3b]"><Camera size={21} /></button>
          <button onClick={() => setTab("incidents")} className={`flex flex-col items-center gap-1 text-[8px] font-bold ${tab === "incidents" ? "text-[#304744]" : "text-[#9ba29d]"}`}><TriangleAlert size={17} /><span>Incidencias</span></button>
        </nav>

        {showIncident && <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#203330]/35 p-3 backdrop-blur-sm sm:items-center"><div className="w-full max-w-[500px] rounded-[24px] bg-[#fffefa] p-5 shadow-2xl"><div className="flex items-start justify-between"><div><div className="fc-mono text-[9px] uppercase tracking-[.15em] text-[#ef7548]">Captura rápida</div><h2 className="mt-1 text-[19px] font-extrabold tracking-[-.05em]">¿Qué pasó en obra?</h2></div><button onClick={() => setShowIncident(false)} className="text-[#87918b]"><X size={19} /></button></div>
          <label className="mt-5 block text-[10px] font-bold text-[#5b6a64]">Foto de evidencia <span className="font-normal text-[#a0a8a3]">· recomendado</span><div className="fc-grid relative mt-2 flex h-[145px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#bdc8c0] bg-[#f1f3ed]">{incidentPhoto ? <img src={incidentPhoto} alt="Evidencia seleccionada" className="h-full w-full object-cover" /> : <><input aria-label="Seleccionar foto" type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) setIncidentPhoto(URL.createObjectURL(file)); }} className="absolute inset-0 cursor-pointer opacity-0" /><div className="pointer-events-none text-center"><div className="mx-auto grid size-10 place-items-center rounded-xl bg-[#fffefa] text-[#ef7548] shadow-sm"><ImagePlus size={19} /></div><div className="mt-2 text-[10px] font-bold text-[#64736c]">Toca para abrir cámara</div><div className="mt-1 text-[9px] text-[#9ba49f]">Se guardará en el dispositivo</div></div></>}</div></label>
          <label className="mt-4 block text-[10px] font-bold text-[#5b6a64]">Nota breve<input value={incidentTitle} onChange={(event) => setIncidentTitle(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d8dbd4] bg-[#f8f7f2] px-3 text-[11px] outline-none focus:border-[#7ea59b]" placeholder="Ej. Fisura junto a la columna C4" /></label>
          <button onClick={submitIncident} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#304744] py-3.5 text-[11px] font-extrabold text-white"><Cloud size={15} /> Guardar sin conexión</button>
        </div></div>}
        {toast && <div className="fixed bottom-[82px] left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#304744] px-4 py-2.5 text-[10px] font-bold text-white shadow-xl"><CheckCircle2 size={14} className="text-[#9fc8b8]" />{toast}</div>}
      </div>
    </div>
  );
}

function ClipboardIcon({ active }: { active: boolean }) {
  return <div className={`grid size-[17px] place-items-center rounded-[5px] border-2 ${active ? "border-[#304744] bg-[#304744]" : "border-[#9ba29d]"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#a9c7be]" : "bg-[#9ba29d]"}`} /></div>;
}