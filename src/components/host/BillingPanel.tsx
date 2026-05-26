import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ARRIVLY_CONFIG } from '../../config'
import Loader from '../shared/Loader'

interface HostData {
  trial_ends_at: string | null
  subscription_status: string | null
}

export default function BillingPanel() {
  const [host, setHost] = useState<HostData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('hosts')
        .select('trial_ends_at, subscription_status')
        .eq('id', user.id)
        .maybeSingle()
      setHost(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Loader />

  const trialEndsAt = host?.trial_ends_at ?? null
  const status = host?.subscription_status ?? 'trial'
  const trialRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0
  const trialUsed = trialEndsAt
    ? Math.max(0, ARRIVLY_CONFIG.trialDays - trialRemaining)
    : ARRIVLY_CONFIG.trialDays
  const trialPct = Math.min(100, (trialUsed / ARRIVLY_CONFIG.trialDays) * 100)
  const trialEndDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const LABEL = 'block text-[10px] uppercase tracking-[.06em] text-[#999] mb-[3px]'

  return (
    <div className="max-w-lg">
      <h1 className="text-[17px] font-serif font-light text-[#1a1a1a] mb-4">Billing</h1>

      {/* Trial / subscription card */}
      {status === 'trial' && (
        <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[13px] font-semibold text-[#1a1a1a]">Free trial — 1 property</div>
            <span className="text-[10px] bg-[#e4f0da] text-[#2a5c0a] px-2 py-0.5 rounded-full font-medium">Active</span>
          </div>
          <div className="text-[11px] text-[#888] mb-3">
            {trialRemaining > 0
              ? `${trialRemaining} of ${ARRIVLY_CONFIG.trialDays} days remaining`
              : 'Trial period complete'}
            {trialEndDate && ` · ends ${trialEndDate}`}
          </div>
          <div className="h-1 bg-[#ede9e2] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[#1a1a1a] rounded-full transition-all"
              style={{ width: `${trialPct}%` }}
            />
          </div>
          <button
            className="w-full bg-[#1a1a1a] text-white py-2.5 rounded-[8px] text-xs font-semibold hover:opacity-80 transition-opacity"
            onClick={() => alert('Stripe integration coming soon')}
          >
            Add card — continue for {ARRIVLY_CONFIG.currencySymbol}{ARRIVLY_CONFIG.pricePerPropertyMonthly}/month
          </button>
        </div>
      )}

      {status === 'active' && (
        <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[13px] font-semibold text-[#1a1a1a]">Arrivly Basic — 1 property</div>
            <span className="text-[10px] bg-[#e4f0da] text-[#2a5c0a] px-2 py-0.5 rounded-full font-medium">Active</span>
          </div>
          <div className="text-[11px] text-[#888] mb-3">
            {ARRIVLY_CONFIG.currencySymbol}{ARRIVLY_CONFIG.pricePerPropertyMonthly}/month · renews automatically
          </div>
          <button
            className="w-full bg-transparent border border-[#ddd8ce] text-[#444] py-2.5 rounded-[8px] text-xs hover:bg-[#f0ede6] transition-colors"
            onClick={() => alert('Billing portal coming soon')}
          >
            Manage subscription
          </button>
        </div>
      )}

      {(status === 'grace' || status === 'expired' || (!status && trialRemaining === 0)) && (
        <div className="bg-[#fde4e4] border border-[#f5c6c6] rounded-[10px] p-4 mb-4">
          <div className="text-[13px] font-semibold text-[#8a1a1a] mb-1">
            {status === 'grace' ? 'Payment failed — grace period' : 'Subscription inactive'}
          </div>
          <div className="text-[11px] text-[#8a1a1a]/70 mb-3">Add a payment method to restore access.</div>
          <button
            className="w-full bg-[#1a1a1a] text-white py-2.5 rounded-[8px] text-xs font-semibold hover:opacity-80 transition-opacity"
            onClick={() => alert('Stripe integration coming soon')}
          >
            Add card — {ARRIVLY_CONFIG.currencySymbol}{ARRIVLY_CONFIG.pricePerPropertyMonthly}/month
          </button>
        </div>
      )}

      {/* What happens */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="bg-[#e4f0da] rounded-[10px] p-3.5">
          <div className="text-[11px] font-semibold text-[#2a5c0a] mb-1.5">When you subscribe</div>
          {['Guest page stays live', 'QR code works forever', 'AI guide refreshes monthly', 'Booking sync active'].map(f => (
            <div key={f} className="text-[11px] text-[#2a5c0a] leading-[1.7]">✓ {f}</div>
          ))}
        </div>
        <div className="bg-[#fde4e4] rounded-[10px] p-3.5">
          <div className="text-[11px] font-semibold text-[#8a1a1a] mb-1.5">If you don't subscribe</div>
          {['Guest page goes offline', 'QR code returns 404', 'All data is preserved', 'Reactivate any time'].map(f => (
            <div key={f} className="text-[11px] text-[#8a1a1a] leading-[1.7]">· {f}</div>
          ))}
        </div>
      </div>

      {/* Plan states reference */}
      <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4">
        <label className={LABEL}>Subscription states</label>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {[
            { key: 'trial', label: 'Trial', pill: 'bg-[#dceef8] text-[#0c3d70]' },
            { key: 'active', label: 'Active', pill: 'bg-[#e4f0da] text-[#2a5c0a]' },
            { key: 'grace', label: 'Grace period', pill: 'bg-[#faeeda] text-[#7a4800]' },
            { key: 'expired', label: 'Expired', pill: 'bg-[#fde4e4] text-[#8a1a1a]' },
          ].map(s => (
            <div key={s.key} className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.pill}`}>{s.label}</span>
              <span className={`text-[10px] text-[#888] ${status === s.key ? 'font-semibold text-[#1a1a1a]' : ''}`}>
                {status === s.key ? '← current' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
