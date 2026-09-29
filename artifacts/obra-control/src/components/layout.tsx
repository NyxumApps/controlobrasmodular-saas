import { Link, useLocation } from "wouter"
import { LayoutDashboard, HardHat, AlertTriangle, Users, Settings, Puzzle, Menu, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { UserButton } from "@/components/user-button"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { state } = useStore()
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const modules = state.settings.modules

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
    { label: "Obras", href: "/obras", icon: HardHat },
    ...(modules.communications ? [{ label: "Incidencias", href: "/incidencias", icon: AlertTriangle }] : []),
    ...(modules.subcontractors ? [{ label: "Subcontratistas", href: "/subcontratistas", icon: Users }] : []),
    { label: "Módulos", href: "/modulos", icon: Puzzle },
    { label: "Configuración", href: "/configuracion", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile Header & Nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b bg-card z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <HardHat className="h-6 w-6" />
          ObraControl
        </div>
        <div className="flex items-center gap-2">
          <UserButton />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-background z-30 flex flex-col p-4 gap-2">
          {navItems.map(item => {
            const active = item.exact ? location === item.href : location.startsWith(item.href) && (item.href !== "/" || location === "/")
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )} onClick={() => setMobileOpen(false)}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-90">
            <HardHat className="h-6 w-6" />
            ObraControl
          </Link>
        </div>
        <div className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(item => {
            const active = item.exact ? location === item.href : location.startsWith(item.href) && (item.href !== "/" || location === "/")
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t text-sm flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate">{state.settings.companyName}</div>
            <div className="text-muted-foreground truncate">{state.settings.role}</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 pt-16 lg:pt-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
