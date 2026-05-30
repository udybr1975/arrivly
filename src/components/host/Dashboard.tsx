import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ARRIVLY_CONFIG } from '../../config'
import Loader from '../shared/Loader'

interface Apartment {
  id: string
  name: string
  neighborhood: string | null
  is_visible: boolean | null
  created_at: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [list, setList] = useState<Apartment[]>([])
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [bookingTotal, setBookingTotal] = useState(0)
  const [completenessByApt, setCompletenessByApt] = useState<Map<string, Set<string>>>(new Map())
  const [bookingCountByApt, setBookingCountByApt] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: hostData } = await supabase
        .from('hosts').select('trial_ends_at').eq('id', user.id).maybeSingle()

      const { data: apts } = await supabase
        .from('apartments')
        .select('id, name, neighborhood, is_visible, created_at')
        .eq('host_id', user.id)
        .order('created_at')

      const aList = apts ?? []
      if (aList.length === 0) { setLoading(false); navigate('/onboarding'); return }

      setTrialEndsAt(hostData?.trial_ends_at ?? null)
      setList(aList)

      const aptIds = aList.map(a => a.id)
      const [{ data: dets }, { data: bk }] = await Promise.all([
        supabase.from('apartment_details').select('apartment_id, category').in('apartment_id', aptIds),
        supabase.from('bookings').select('apartment_id').in('apartment_id', aptIds),
      ])

      const cbMap = new Map<string, Set<string>>()
      for (const d of dets ?? []) {
        if (!cbMap.has(d.apartment_id)) cbMap.set(d.apartment_id, new Set())
        cbMap.get(d.apartment_id)!.add(d.category)
      }
      setCompletenessByApt(cbMap)

      const bkMap = new Map<string, number>()
      for (const b of bk ?? []) {
        bkMap.set(b.apartment_id, (bkMap.get(b.apartment_id) ?? 0) + 1)
      }
      setBookingCountByApt(bkMap)
      setBookingTotal(bk?.length ?? 0)

      setLoading(false)
    }
    load()
  }, [navigate])

  if (loading) return <Loader />

  const trialRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : ARRIVLY_CONFIG.trialDays

  const check = (ok: boolean) => ok
    ? <span className="text-[#2a5c0a]">✓</span>
    : <span className="text-[#ccc]">–</span>

  return (
    <div className="max-w-2xl">
      <h1 className="text-[17px] font-serif font-light text-[#1a1a1a] mb-4">Overview</h1>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Properties', value: String(list.length) },
          { label: 'Bookings', value: String(bookingTotal) },
          { label: 'QR scans', value: '—' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-[#ddd8ce] rounded-[10px] p-3">
            <div className="text-[22px] font-serif font-light text-[#1a1a1a]">{m.value}</div>
            <div className="text-[10px] uppercase tracking-[.06em] text-[#999] mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Property cards — one per apartment */}
      {list.map(apt => {
        const cats = completenessByApt.get(apt.id) ?? new Set<string>()
        const aptBookings = bookingCountByApt.get(apt.id) ?? 0
        return (
          <div key={apt.id} className="bg-white border border-[#ddd8ce] rounded-[10px] p-4 mb-3">
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="text-[13px] font-semibold text-[#1a1a1a]">{apt.name}</div>
                {apt.neighborhood && (
                  <div className="text-[11px] text-[#888] mt-0.5">{apt.neighborhood}</div>
                )}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                apt.is_visible
                  ? 'bg-[#e4f0da] text-[#2a5c0a]'
                  : 'bg-[#f0ede6] text-[#888]'
              }`}>
                {apt.is_visible ? 'Active' : 'Draft'}
              </span>
            </div>

            {/* Completeness row */}
            <div className="flex items-center gap-2 text-[11px] text-[#666] mt-3 mb-2 flex-wrap">
              <span>WiFi {check(cats.has('WiFi'))}</span>
              <span className="text-[#ddd]">·</span>
              <span>House rules {check(cats.has('House Rules'))}</span>
              <span className="text-[#ddd]">·</span>
              <span>City guide {check(false)}</span>
              <span className="text-[#ddd]">·</span>
              <span>Check-in {check(cats.has('Check-in'))}</span>
            </div>

            {/* Booking count */}
            <div className="text-[11px] text-[#aaa] mb-3">
              {aptBookings} booking{aptBookings === 1 ? '' : 's'}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Link
                to="/dashboard/qr"
                className="bg-[#1a1a1a] text-white px-3 py-1.5 rounded-[7px] text-xs font-semibold hover:opacity-80 transition-opacity"
              >
                📲 QR code
              </Link>
              <a
                href={`/guest?apt=${apt.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent border border-[#ddd8ce] text-[#444] px-3 py-1.5 rounded-[7px] text-xs hover:bg-[#f0ede6] transition-colors"
              >
                👁 Preview guest page
              </a>
              <Link
                to={`/dashboard/property/${apt.id}`}
                className="bg-transparent border border-[#ddd8ce] text-[#444] px-3 py-1.5 rounded-[7px] text-xs hover:bg-[#f0ede6] transition-colors"
              >
                ✏️ Edit property
              </Link>
            </div>
          </div>
        )
      })}

      {/* Add property (dashed) */}
      <div className="border border-dashed border-[#ccc] rounded-[10px] p-4 mb-3 flex items-center justify-center cursor-pointer hover:bg-white/60 transition-colors">
        <span className="text-[12px] text-[#aaa]">+ Add another property · coming soon</span>
      </div>

      {/* Coming soon */}
      <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4">
        <div className="text-[11px] font-semibold text-[#1a1a1a] mb-0.5">Guest reviews · coming soon</div>
        <div className="text-[11px] text-[#888] leading-relaxed">Collect UGC screenshots from guests and display them on your guest page.</div>
      </div>

      {trialRemaining > 0 && (
        <p className="text-[10px] text-[#aaa] mt-3">
          Trial ends in {trialRemaining} {trialRemaining === 1 ? 'day' : 'days'} ·{' '}
          <Link to="/dashboard/billing" className="underline hover:text-[#666]">Upgrade</Link>
        </p>
      )}
    </div>
  )
}
