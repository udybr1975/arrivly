import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ARRIVLY_CONFIG } from '../../config'
import { useToast } from '../shared/Toast'
import Loader from '../shared/Loader'

interface Apartment {
  id: string
  name: string
  brand_color: string
}

export default function BrandingPanel() {
  const { toast } = useToast()
  const [apt, setApt] = useState<Apartment | null>(null)
  const [selectedColor, setSelectedColor] = useState('#1c1c1a')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('apartments')
        .select('id, name, brand_color')
        .eq('created_by', user.id)
        .order('created_at')
        .limit(1)
        .maybeSingle()
      if (data) {
        setApt(data)
        setSelectedColor(data.brand_color ?? '#1c1c1a')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    if (!apt) return
    setSaving(true)
    const { error } = await supabase
      .from('apartments')
      .update({ brand_color: selectedColor })
      .eq('id', apt.id)
    if (error) toast(error.message, 'error')
    else { setApt(p => p ? { ...p, brand_color: selectedColor } : p); toast('Branding saved', 'success') }
    setSaving(false)
  }

  if (loading) return <Loader />

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">Branding</h1>

      {/* Colour presets */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Brand colour</h2>
        <div className="grid grid-cols-3 gap-3">
          {ARRIVLY_CONFIG.colourPresets.map(preset => (
            <button
              key={preset.hex}
              onClick={() => setSelectedColor(preset.hex)}
              className={`flex items-center gap-3 rounded-xl p-3 border-2 transition-colors text-left ${
                selectedColor === preset.hex ? 'border-white' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg shrink-0"
                style={{ backgroundColor: preset.hex }}
              />
              <span className="text-sm">{preset.name}</span>
              {selectedColor === preset.hex && (
                <Check size={14} className="ml-auto text-white" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Preview */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Preview</h2>
        <div
          className="rounded-2xl p-6 space-y-2"
          style={{ backgroundColor: selectedColor }}
        >
          <p className="text-white font-bold text-lg">{apt?.name ?? 'Your Property'}</p>
          <p className="text-white/70 text-sm">Guest welcome page</p>
          <div className="mt-4 bg-white/10 rounded-lg px-4 py-2">
            <p className="text-white/60 text-xs">Powered by Arrivly</p>
          </div>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving || selectedColor === apt?.brand_color}
        className="bg-white text-[#1c1c1a] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save branding'}
      </button>
    </div>
  )
}
