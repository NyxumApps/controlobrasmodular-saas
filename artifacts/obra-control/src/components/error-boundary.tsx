import React from 'react';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey?: any },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; resetKey?: any }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(error, info.componentStack);
  }

  componentDidUpdate(prevProps: { resetKey?: any }) {
    if (prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[60vh] place-items-center p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-xl font-bold mb-2">Algo salió mal en esta pantalla</h2>
            <p className="text-sm text-muted-foreground">Tu información está segura. Puedes intentar de nuevo o volver al inicio.</p>
            <div className="mt-5 flex justify-center gap-2">
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => this.setState({ hasError: false, error: null })}>Intentar de nuevo</button>
              <button className="rounded-md border px-4 py-2 text-sm font-medium" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>Ir al inicio</button>
            </div>
            {import.meta.env.DEV && <p className="mt-4 text-xs font-mono text-destructive">{this.state.error?.message}</p>}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
