import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface S1 { name: string; neighborhood: string }
interface S2 { description: string; size: string; guests: number }
interface S3 { checkin: string; checkout: string; wifi_network: string; wifi_password: string; rules: string }

const INPUT = 'w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors'

export default function OnboardingFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [s1, setS1] = useState<S1>({ name: '', neighborhood: '' })
  const [s2, setS2] = useState<S2>({ description: '', size: '', guests: 2 })
  const [s3, setS3] = useState<S3>({ checkin: '3:00 PM', checkout: '11:00 AM', wifi_network: '', wifi_password: '', rules: 'No parties · No smoking · No pets' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function finish() {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { data: apt, error: aptErr } = await supabase
        .from('apartments')
        .insert({
          name: s1.name,
          neighborhood: s1.neighborhood,
          description: s2.description,
          size: s2.size,
          guests: s2.guests,
          price_per_night: 0,
          created_by: user.id,
          brand_color: '#1c1c1a',
        })
        .select('id')
        .single()

      if (aptErr) throw aptErr

      const details: { apartment_id: string; category: string; content: string; is_private: boolean }[] = []

      if (s3.checkin) details.push({ apartment_id: apt.id, category: 'Check-in', content: `Check-in: ${s3.checkin}`, is_private: false })
      if (s3.checkout) details.push({ apartment_id: apt.id, category: 'Check-out', content: `Check-out: ${s3.checkout}`, is_private: false })
      if (s3.wifi_network) details.push({ apartment_id: apt.id, category: 'WiFi', content: `WiFi network: ${s3.wifi_network}`, is_private: true })
      if (s3.wifi_password) details.push({ apartment_id: apt.id, category: 'WiFi', content: `WiFi password: ${s3.wifi_password}`, is_private: true })

      const ruleItems = s3.rules.split('·').map(r => r.trim()).filter(Boolean)
      for (const rule of ruleItems) {
        details.push({ apartment_id: apt.id, category: 'House Rules', content: rule, is_private: false })
      }

      if (details.length > 0) await supabase.from('apartment_details').insert(details)

      navigate('/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1c1a] text-white p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-10">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= step ? 'bg-white' : 'bg-white/20'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Step 1 of 3</p>
              <h2 className="text-2xl font-bold">Your property</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Property name</label>
                <input
                  value={s1.name}
                  onChange={e => setS1(p => ({ ...p, name: e.target.value }))}
                  className={INPUT}
                  placeholder="Cosy Studio in Kallio"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Neighbourhood</label>
                <input
                  value={s1.neighborhood}
                  onChange={e => setS1(p => ({ ...p, neighborhood: e.target.value }))}
                  className={INPUT}
                  placeholder="e.g. Kallio, Helsinki"
                />
              </div>
            </div>
            <button
              onClick={() => s1.name && s1.neighborhood && setStep(2)}
              disabled={!s1.name || !s1.neighborhood}
              className="w-full bg-white text-[#1c1c1a] py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Step 2 of 3</p>
              <h2 className="text-2xl font-bold">Property details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={s2.description}
                  onChange={e => setS2(p => ({ ...p, description: e.target.value }))}
                  className={`${INPUT} resize-none`}
                  rows={4}
                  placeholder="A charming studio with natural light and a beautiful view…"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Size</label>
                  <input
                    value={s2.size}
                    onChange={e => setS2(p => ({ ...p, size: e.target.value }))}
                    className={INPUT}
                    placeholder="e.g. 35 m²"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Max guests</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={s2.guests}
                    onChange={e => setS2(p => ({ ...p, guests: Number(e.target.value) }))}
                    className={INPUT}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-white/20 py-2.5 rounded-lg font-semibold hover:bg-white/5 transition-colors">
                Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 bg-white text-[#1c1c1a] py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Step 3 of 3</p>
              <h2 className="text-2xl font-bold">Key details for guests</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Check-in time</label>
                  <input value={s3.checkin} onChange={e => setS3(p => ({ ...p, checkin: e.target.value }))} className={INPUT} placeholder="3:00 PM" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Check-out time</label>
                  <input value={s3.checkout} onChange={e => setS3(p => ({ ...p, checkout: e.target.value }))} className={INPUT} placeholder="11:00 AM" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">WiFi network name</label>
                <input value={s3.wifi_network} onChange={e => setS3(p => ({ ...p, wifi_network: e.target.value }))} className={INPUT} placeholder="HomeNetwork_5G" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">WiFi password</label>
                <input value={s3.wifi_password} onChange={e => setS3(p => ({ ...p, wifi_password: e.target.value }))} className={INPUT} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">House rules <span className="text-gray-500">(separate with ·)</span></label>
                <textarea
                  value={s3.rules}
                  onChange={e => setS3(p => ({ ...p, rules: e.target.value }))}
                  className={`${INPUT} resize-none`}
                  rows={3}
                  placeholder="No parties · No smoking · No pets"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-white/20 py-2.5 rounded-lg font-semibold hover:bg-white/5 transition-colors">
                Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 bg-white text-[#1c1c1a] py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {saving ? 'Setting up…' : 'Launch my property'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
