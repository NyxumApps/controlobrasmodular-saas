import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { signIn, signUp } from "@workspace/auth/client";

const inputClass = "h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-[#16332d] outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-60";
const primaryClass = "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60";
const linkClass = "font-medium text-teal-700 hover:underline";

function Card({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex w-full justify-center" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="w-[440px] max-w-full overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="p-6">
          <div className="p-2"><img src="/logo.svg" alt="ObraControl" className="mx-auto h-10" /></div>
          <h1 className="mt-2 text-center text-xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-center text-sm text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="bg-slate-50 px-6 py-4 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-800"><span>{label}</span>{children}</label>;
}

function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={tone === "error" ? "rounded-xl bg-amber-50 px-3 py-2 text-sm text-slate-800" : "rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800"}>
      {children}
    </p>
  );
}

function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return <button type="submit" className={primaryClass} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{children}</button>;
}

export function SignInCard({ signUpUrl, redirectUrl }: { signUpUrl: string; redirectUrl?: string }) {
  const [mode, setMode] = useState<"sign-in" | "forgot">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError("No pudimos iniciar sesión. Revisa tu correo y contraseña e inténtalo de nuevo.");
        return;
      }
      window.location.assign(redirectUrl ?? "/dashboard");
    } catch {
      setError("No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "forgot") {
    return (
      <Card title="Recupera tu acceso" subtitle="La recuperación por correo no está disponible en esta instalación" footer={<button type="button" className={linkClass} onClick={() => { setMode("sign-in"); setError(""); }}>Volver a iniciar sesión</button>}>
        <Notice tone="success">No hay un servicio de correo conectado para enviar enlaces de restablecimiento. Solicita ayuda al administrador de tu empresa.</Notice>
      </Card>
    );
  }

  return (
    <Card title="Bienvenido de nuevo" subtitle="Ingresa para continuar a ObraControl" footer={<>¿No tienes cuenta? <Link href={signUpUrl} className={linkClass}>Crear cuenta</Link></>}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Correo electrónico"><input className={inputClass} type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></Field>
        <Field label="Contraseña"><input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></Field>
        <div className="text-right text-sm"><button type="button" className={linkClass} onClick={() => setMode("forgot")}>¿Olvidaste tu contraseña?</button></div>
        {error && <Notice tone="error">{error}</Notice>}
        <Submit busy={busy}>Continuar</Submit>
      </form>
    </Card>
  );
}

export function SignUpCard({ signInUrl, redirectUrl }: { signInUrl: string; redirectUrl?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await signUp.email({ name: name.trim(), email: email.trim(), password });
      if (result.error) {
        setError("No pudimos crear la cuenta. Revisa los datos e inténtalo de nuevo.");
        return;
      }
      window.location.assign(redirectUrl ?? "/dashboard");
    } catch {
      setError("No pudimos crear la cuenta. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const footer = <>¿Ya tienes cuenta? <Link href={signInUrl} className={linkClass}>Iniciar sesión</Link></>;
  return (
    <Card title="Crea tu cuenta" subtitle="Comienza a coordinar tus obras" footer={footer}>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Nombre completo"><input className={inputClass} type="text" autoComplete="name" required maxLength={120} value={name} onChange={event => setName(event.target.value)} disabled={busy} /></Field>
        <Field label="Correo electrónico"><input className={inputClass} type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></Field>
        <Field label="Contraseña"><input className={inputClass} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></Field>
        <p className="text-xs text-slate-500">Mínimo 8 caracteres.</p>
        {error && <Notice tone="error">{error}</Notice>}
        <Submit busy={busy}>Continuar</Submit>
      </form>
    </Card>
  );
}
