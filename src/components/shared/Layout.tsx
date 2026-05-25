import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Calendar, QrCode, Palette, CreditCard, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/property', label: 'Property', icon: Building2 },
  { to: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
  { to: '/dashboard/qr', label: 'QR Code', icon: QrCode },
  { to: '/dashboard/branding', label: 'Branding', icon: Palette },
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
]

export default function Layout() {
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#1c1c1a] text-white">
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/10 py-6 px-3">
        <div className="px-3 mb-8">
          <span className="text-xl font-bold tracking-tight">Arrivly</span>
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
