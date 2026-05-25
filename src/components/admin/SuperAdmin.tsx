import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Loader from '../shared/Loader'
import { LogOut, Building2, Users, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HostRow {
  id: string
  name: string
  neighborhood: string
  created_at: string
  created_by: string
  booking_count?: number
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SuperAdmin() {
  const navigate = useNavigate()
  const [apartments, setApartments] = useState<HostRow[]>([])
  const [stats, setStats] = useState({ hosts: 0, properties: 0, bookings: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: apts }, { count: bookingCount }] = await Promise.all([
        supabase.from('apartments').select('id, name, neighborhood, created_at, created_by').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
      ])

      const rows = apts ?? []
      const uniqueHosts = new Set(rows.map(a => a.created_by)).size

      setApartments(rows)
      setStats({ hosts: uniqueHosts, properties: rows.length, bookings: bookingCount ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <Loader />

  return (
    <div className="min-h-screen bg-[#1c1c1a] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Arrivly Admin</h1>
            <p className="text-gray-400 text-sm mt-0.5">Platform overview</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 border border-white/20 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Hosts', value: stats.hosts },
            { icon: Building2, label: 'Properties', value: stats.properties },
            { icon: Calendar, label: 'Bookings', value: stats.bookings },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <Icon size={18} className="text-gray-400 mb-3" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Properties table */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">All properties</h2>
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Property</th>
                  <th className="text-left px-4 py-3 font-medium">Neighbourhood</th>
                  <th className="text-left px-4 py-3 font-medium">Host ID</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {apartments.map((apt, i) => (
                  <tr
                    key={apt.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i === apartments.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{apt.name}</td>
                    <td className="px-4 py-3 text-gray-400">{apt.neighborhood}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{apt.created_by?.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-gray-400">{fmt(apt.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
