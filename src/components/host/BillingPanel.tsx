import { useEffect, useState } from 'react'
import { CreditCard, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ARRIVLY_CONFIG } from '../../config'
import Loader from '../shared/Loader'

interface Apartment {
  id: string
  name: string
  created_at: string
}

export default function BillingPanel() {
  const [apt, setApt] = useState<Apartment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('apartments')
        .select('id, name, created_at')
        .eq('created_by', user.id)
        .order('created_at')
        .limit(1)
        .maybeSingle()
      setApt(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Loader />

  const daysUsed = apt ? Math.floor((Date.now() - new Date(apt.created_at).getTime()) / 86_400_000) : 0
  const trialRemaining = Math.max(0, ARRIVLY_CONFIG.trialDays - daysUsed)
  const trialActive = trialRemaining > 0
  const trialPct = Math.min(100, (daysUsed / ARRIVLY_CONFIG.trialDays) * 100)

  const features = [
    'Personalised guest page',
    'AI neighbourhood guide',
    'QR code generation',
    'Custom branding',
    'Booking management',
    'iCal sync',
  ]

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">Billing</h1>

      {/* Trial status */}
      {trialActive ? (
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Free trial</p>
              <p className="text-sm text-gray-400 mt-0.5">{trialRemaining} of {ARRIVLY_CONFIG.trialDays} days remaining</p>
            </div>
            <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded-full">Active</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${trialPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Your trial includes all features. Add a payment method before day {ARRIVLY_CONFIG.trialDays} to avoid interruption.
          </p>
        </div>
      ) : (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-6">
          <p className="font-semibold text-amber-200">Trial ended</p>
          <p className="text-sm text-amber-300/70 mt-1">Add a payment method to continue using Arrivly.</p>
        </div>
      )}

      {/* Plan */}
      <div className="border border-white/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-lg">Arrivly Basic</p>
            <p className="text-gray-400 text-sm mt-0.5">1 property</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{ARRIVLY_CONFIG.currencySymbol}{ARRIVLY_CONFIG.pricePerPropertyMonthly}</p>
            <p className="text-xs text-gray-400">per month</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          {features.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
              <Check size={14} className="text-green-400 shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 bg-white text-[#1c1c1a] py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          onClick={() => alert('Stripe integration coming soon')}
        >
          <CreditCard size={16} />
          {trialActive ? 'Add payment method' : 'Subscribe now'}
        </button>
      </div>
    </div>
  )
}
