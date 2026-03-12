import { Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-brand-background">
      <aside className="fixed left-0 top-0 z-40 h-full w-56 border-r border-brand-muted/30 bg-white/80">
        <div className="p-4">
          <p className="font-display font-semibold text-brand-primary">Admin</p>
          <nav className="mt-4 space-y-1 text-sm text-brand-foreground/80">
            <p className="text-brand-foreground/50">Dashboard, menu, orders — Phase 7+</p>
          </nav>
        </div>
      </aside>
      <main className="pl-56">
        <Outlet />
      </main>
    </div>
  )
}
