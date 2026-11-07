import { Link } from "wouter"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground">Página no encontrada.</p>
      <Link href="/dashboard" className="mt-4 text-sm font-medium text-primary hover:underline">Volver al portafolio</Link>
    </div>
  )
}
