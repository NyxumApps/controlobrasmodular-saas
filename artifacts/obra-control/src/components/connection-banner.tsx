import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Quiet notice while the device is offline; it disappears by itself when the connection returns. */
export function ConnectionBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-foreground px-4 py-2 text-sm text-background">
      <WifiOff className="h-4 w-4" />
      Sin conexión. Puedes seguir consultando; los cambios se guardarán cuando vuelva el internet e intentes de nuevo.
    </div>
  );
}
