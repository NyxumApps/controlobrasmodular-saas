import { LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';

export function UserButton() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? '';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold uppercase text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Abrir menú de la cuenta">
          {email.charAt(0) || '?'}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()} className="gap-2"><LogOut className="h-4 w-4" />Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
