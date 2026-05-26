import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Loader from '../shared/Loader'

interface HostRow {
  id: string
  name: string | null
  brand_name: string | null
  contact_email: string | null
  city: string | null
  subscription_status: string | null
  trial_ends_at: string | null
  created_at: string
}

function statusPill(status: string | null) {
  const map: Record<string, string> = {
    trial: 'bg-[#dceef8] text-[#0c3d70]',
    active: 'bg-[#e4f0da] text-[#2a5c0a]',
    grace: 'bg-[#faeeda] text-[#7a4800]',
    expired: 'bg-[#fde4e4] text-[#8a1a1a]',
  }
  const s = status ?? 'trial'
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[s] ?? map.trial}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

export default function SuperAdmin() {
  const navigate = useNavigate()
  const [hosts, setHosts] = useState<HostRow[]>([])
  const [aptCounts, setAptCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== 'udy.bar.yosef@gmail.com') { setLoading(false); return }

      const [{ data: hostRows }, { data: apts }] = await Promise.all([
        supabase
          .from('hosts')
          .select('id, name, brand_name, contact_email, city, subscription_status, trial_ends_at, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('apartments').select('host_id'),
      ])

      const rows = hostRows ?? []
      const counts: Record<string, number> = {}
      for (const a of apts ?? []) {
        counts[a.host_id] = (counts[a.host_id] ?? 0) + 1
      }
      setHosts(rows)
      setAptCounts(counts)
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return <Loader />

  const totalHosts = hosts.length
  const paidActive = hosts.filter(h => h.subscription_status === 'active').length
  const onTrial = hosts.filter(h => !h.subscription_status || h.subscription_status === 'trial').length
  const mrr = paidActive * 19

  return (
    <div className="min-h-screen bg-[#f0ede6] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[18px] font-serif font-light text-[#1a1a1a]">Superadmin — Arrivly</h1>
            <span className="text-[10px] bg-[#fde4e4] text-[#8a1a1a] px-2 py-0.5 rounded-full font-medium">🔒 Locked</span>
          </div>
          <button
            onClick={signOut}
            className="bg-transparent border border-[#ddd8ce] text-[#444] px-3 py-1.5 rounded-[7px] text-xs hover:bg-white transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {[
            { label: 'Total hosts', value: totalHosts },
            { label: 'Paid active', value: paidActive },
            { label: 'On trial', value: onTrial },
            { label: 'MRR', value: `€${mrr}` },
          ].map(m => (
            <div key={m.label} className="bg-white border border-[#ddd8ce] rounded-[10px] p-3">
              <div className="text-[22px] font-serif font-light text-[#1a1a1a]">{m.value}</div>
              <div className="text-[10px] uppercase tracking-[.06em] text-[#999] mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Hosts list */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-[.06em] text-[#999] mb-2">All hosts</div>
          {hosts.length === 0 && (
            <div className="text-[12px] text-[#aaa] text-center py-8">No hosts yet.</div>
          )}
          {hosts.map(h => (
            <div key={h.id} className="bg-white border border-[#ddd8ce] rounded-[10px] p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[7px] bg-[#1a1a1a] flex items-center justify-center text-[11px] text-white font-semibold shrink-0">
                {(h.brand_name ?? h.name ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-[#1a1a1a] truncate">
                  {h.brand_name ?? h.name ?? '—'}
                </div>
                <div className="text-[10px] text-[#888] truncate">
                  {h.contact_email ?? '—'}{h.city ? ` · ${h.city}` : ''} · {aptCounts[h.id] ?? 0} {aptCounts[h.id] === 1 ? 'property' : 'properties'}
                </div>
              </div>
              {statusPill(h.subscription_status)}
              <button className="bg-transparent border border-[#ddd8ce] text-[#444] px-3 py-1 rounded-[6px] text-[10px] hover:bg-[#f0ede6] transition-colors shrink-0">
                Impersonate
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
