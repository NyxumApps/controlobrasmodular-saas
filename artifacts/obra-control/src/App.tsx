import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, Show, useAuth } from '@/lib/auth';
import { apiJson, toApiError } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { SignInCard, SignUpCard } from '@/components/auth-card';
import { ConnectionBanner } from '@/components/connection-banner';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Redirect,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { StoreProvider } from '@/lib/store';
import { invitationPath, invitationReturnUrl, invitationSignInPath, invitationSuccessPath } from '@/lib/invitation-routing';
import { AppLayout } from '@/components/layout';

import Dashboard from '@/pages/dashboard';
import ObrasList from '@/pages/obras/index';
import ObraDetail from '@/pages/obras/detail';
import Incidencias from '@/pages/incidencias';
import Subcontratistas from '@/pages/subcontratistas';
import Validacion from '@/pages/validacion';
import Modulos from '@/pages/modulos';
import Configuracion from '@/pages/configuracion';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
function stripBase(path: string): string { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path; }
const clearSharedData = () => queryClient.clear();

function Landing() {
  const [, setLocation] = useLocation();
  return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8"><section className="max-w-xl"><img src={`${basePath}/logo.svg`} alt="ObraControl" className="h-16 mb-8" /><p className="text-teal-300 font-semibold">CONTROL DE OBRA</p><h1 className="text-5xl font-bold mt-3">La información de su obra, compartida y segura.</h1><p className="text-slate-300 mt-6 text-lg">Coordine presupuestos, incidencias y contratos desde un solo lugar.</p><div className="flex gap-3 mt-8"><button className="bg-teal-500 px-5 py-3 rounded-lg" onClick={() => setLocation('/sign-up')}>Crear cuenta</button><button className="border border-slate-500 px-5 py-3 rounded-lg" onClick={() => setLocation('/sign-in')}>Iniciar sesión</button></div></section></main>;
}
function HomeRedirect() { return <><Show when="signed-in"><Redirect to="/dashboard" /></Show><Show when="signed-out"><Landing /></Show></>; }
function SignInPage() {
  const { user, recovering } = useAuth();
  if (user && !recovering) return <Redirect to="/dashboard" />;
  return <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4"><SignInCard signUpUrl="/sign-up" /></div>;
}
function SignUpPage() {
  const { user } = useAuth();
  if (user) return <Redirect to="/dashboard" />;
  return <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4"><SignUpCard signInUrl="/sign-in" /></div>;
}
function InvitationPage({ params }: { params: { token: string } }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("Validando tu invitación…");
  useEffect(() => {
    if (loading || !user) return;
    void apiJson('/api/invitations/accept', 'POST', { token: params.token }).then(() => {
      queryClient.clear();
      setLocation(invitationSuccessPath);
    }).catch(error => setMessage(toApiError(error).message));
  }, [loading, user, params.token, setLocation]);
  const returnUrl = invitationReturnUrl(window.location.origin, basePath, params.token, window.location.search);
  const signInUrl = invitationSignInPath('', params.token, window.location.search);
  return <><Show when="signed-out"><div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4"><SignUpCard signInUrl={signInUrl} redirectUrl={returnUrl} /></div></Show><Show when="signed-in"><div className="min-h-screen grid place-items-center p-6 text-center text-muted-foreground">{message}</div></Show></>;
}
function InvitationSignInPage({ params }: { params: { token: string } }) {
  const { user } = useAuth();
  const signUpUrl = invitationPath('', params.token, window.location.search);
  if (user) return <Redirect to={invitationPath('', params.token, window.location.search)} />;
  return <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4"><SignInCard signUpUrl={signUpUrl} /></div>;
}
function SetupNotice() {
  return <main className="min-h-screen grid place-items-center bg-slate-100 p-6"><div className="max-w-lg rounded-2xl bg-white p-6 text-center shadow-xl"><h1 className="text-xl font-bold text-slate-900">Falta configurar el entorno</h1><p className="mt-2 text-sm text-slate-600">Define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> en el archivo <code>.env</code> y reinicia la aplicación.</p></div></main>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/invite/:token/sign-in/*?" component={InvitationSignInPage} />
        <Route path="/invite/:token/*?" component={InvitationPage} />
        <Route><Show when="signed-in"><StoreProvider><AppLayout>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/obras" component={ObrasList} />
          <Route path="/obras/:id" component={ObraDetail} />
          <Route path="/incidencias" component={Incidencias} />
          <Route path="/subcontratistas" component={Subcontratistas} />
          <Route path="/validacion" component={Validacion} />
          <Route path="/modulos" component={Modulos} />
          <Route path="/configuracion" component={Configuracion} />
          <Route component={NotFound} />
        </Switch>
        </AppLayout></StoreProvider></Show><Show when="signed-out"><Redirect to="/" /></Show></Route>
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  if (!supabaseConfigured) return <SetupNotice />;
  return (
    <WouterRouter base={basePath}>
      <AuthProvider onUserChange={clearSharedData}>
        <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /><ConnectionBanner /></TooltipProvider></QueryClientProvider>
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
