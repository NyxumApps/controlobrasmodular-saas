import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
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
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.PROD ? '/api/__clerk' : undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
function stripBase(path: string): string { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path; }
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
const clerkAppearance = {
  theme: shadcn, cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: '#0f766e', colorForeground: '#16332d', colorMutedForeground: '#53716a', colorDanger: '#b91c1c', colorBackground: '#ffffff', colorInput: '#f8fafc', colorInputForeground: '#16332d', colorNeutral: '#cbd5e1', fontFamily: 'Inter, sans-serif', borderRadius: '0.75rem' },
  elements: { rootBox: 'w-full flex justify-center', cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl', card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none', headerTitle: 'text-slate-900', headerSubtitle: 'text-slate-600', socialButtonsBlockButtonText: 'text-slate-800', formFieldLabel: 'text-slate-800', footerActionLink: 'text-teal-700', footerActionText: 'text-slate-600', dividerText: 'text-slate-500', identityPreviewEditButton: 'text-teal-700', formFieldSuccessText: 'text-emerald-700', alertText: 'text-slate-800', logoBox: 'p-2', logoImage: 'h-10', socialButtonsBlockButton: 'border-slate-300', formButtonPrimary: 'bg-teal-700 hover:bg-teal-800', formFieldInput: 'border-slate-300', footerAction: 'bg-slate-50', dividerLine: 'bg-slate-200', alert: 'bg-amber-50', otpCodeFieldInput: 'border-slate-300', formFieldRow: 'gap-2', main: 'p-6' },
};

function Landing() {
  const [, setLocation] = useLocation();
  return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8"><section className="max-w-xl"><img src={`${basePath}/logo.svg`} className="h-16 mb-8" /><p className="text-teal-300 font-semibold">CONTROL DE OBRA</p><h1 className="text-5xl font-bold mt-3">La información de su obra, compartida y segura.</h1><p className="text-slate-300 mt-6 text-lg">Coordine presupuestos, incidencias y contratos desde un solo lugar.</p><div className="flex gap-3 mt-8"><button className="bg-teal-500 px-5 py-3 rounded-lg" onClick={() => setLocation('/sign-up')}>Crear cuenta</button><button className="border border-slate-500 px-5 py-3 rounded-lg" onClick={() => setLocation('/sign-in')}>Iniciar sesión</button></div></section></main>;
}
function HomeRedirect() { return <><Show when="signed-in"><Redirect to="/dashboard" /></Show><Show when="signed-out"><Landing /></Show></>; }
function SignInPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>; }
function SignUpPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>; }
function InvitationPage({ params }: { params: { token: string } }) {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("Validando tu invitación…");
  useEffect(() => {
    if (!isLoaded || !user) return;
    void fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token }),
    }).then(async response => {
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'No se pudo aceptar la invitación');
      queryClient.clear();
      setLocation(invitationSuccessPath);
    }).catch(error => setMessage(error instanceof Error ? error.message : 'No se pudo aceptar la invitación'));
  }, [isLoaded, user, params.token, setLocation]);
  const returnUrl = invitationReturnUrl(window.location.origin, basePath, params.token, window.location.search);
  const signInUrl = invitationSignInPath(basePath, params.token, window.location.search);
  return <><Show when="signed-out"><div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4"><SignUp routing="path" path={`${basePath}/invite/${params.token}`} signInUrl={signInUrl} forceRedirectUrl={returnUrl} /></div></Show><Show when="signed-in"><div className="min-h-screen grid place-items-center p-6 text-center text-muted-foreground">{message}</div></Show></>;
}
function InvitationSignInPage({ params }: { params: { token: string } }) {
  const returnUrl = invitationReturnUrl(window.location.origin, basePath, params.token, window.location.search);
  const signUpUrl = invitationPath(basePath, params.token, window.location.search);
  return <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4"><SignIn routing="path" path={`${basePath}/invite/${params.token}/sign-in`} signUpUrl={signUpUrl} forceRedirectUrl={returnUrl} /></div>;
}
function ClerkCacheInvalidator() { const { addListener } = useClerk(); const previous = useRef<string | null | undefined>(undefined); useEffect(() => addListener(({ user }) => { const id = user?.id ?? null; if (previous.current !== undefined && previous.current !== id) queryClient.clear(); previous.current = id; }), [addListener]); return null; }

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
  return (
    <WouterRouter base={basePath}>
      <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Bienvenido de nuevo', subtitle: 'Ingresa para continuar a ObraControl' } }, signUp: { start: { title: 'Crea tu cuenta', subtitle: 'Comienza a coordinar tus obras' } } }} routerPush={(to) => window.history.pushState({}, '', to)} routerReplace={(to) => window.history.replaceState({}, '', to)}>
        <QueryClientProvider client={queryClient}><ClerkCacheInvalidator /><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>
      </ClerkProvider>
    </WouterRouter>
  );
}

export default App;
