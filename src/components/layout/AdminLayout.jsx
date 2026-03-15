import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Megaphone, BarChart3, Clock, Wallet, UserCircle, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/availability', label: 'Availability', icon: Clock },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/payouts', label: 'Payouts', icon: Wallet },
  { to: '/admin/account', label: 'Account', icon: UserCircle },
]

const linkClass = ({ isActive }) =>
  cn(
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-primary/10 text-brand-primary'
      : 'text-brand-foreground/80 hover:bg-brand-muted/20 hover:text-brand-foreground'
  )

export function AdminLayout() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-background">
      <aside className="fixed left-0 top-0 z-40 h-full w-56 border-r border-brand-muted/30 bg-white/80">
        <div className="flex h-full flex-col p-4">
          <p className="font-display font-semibold text-brand-primary">Admin</p>
          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-foreground/80 hover:bg-brand-muted/20 hover:text-brand-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="pl-56">
        <Outlet />
      </main>
    </div>
  )
}
