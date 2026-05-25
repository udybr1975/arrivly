import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Lock, Globe, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../shared/Toast'
import Loader from '../shared/Loader'

interface Apartment {
  id: string
  name: string
  neighborhood: string
  description: string
  size: string
  guests: number
  airbnb_ical_url: string
}

interface Detail {
  id: string
  apartment_id: string
  category: string
  content: string
  is_private: boolean
}

const CATEGORIES = ['Check-in', 'Check-out', 'WiFi', 'House Rules', 'Amenities', 'Parking', 'Emergency', 'Local tips', 'Other']
const INPUT = 'w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors text-sm'

export default function PropertySetup() {
  const { toast } = useToast()
  const [apt, setApt] = useState<Apartment | null>(null)
  const [details, setDetails] = useState<Detail[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newDetail, setNewDetail] = useState({ category: 'House Rules', content: '', is_private: false })

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: aptData } = await supabase
      .from('apartments')
      .select('id, name, neighborhood, description, size, guests, airbnb_ical_url')
      .eq('created_by', user.id)
      .order('created_at')
      .limit(1)
      .maybeSingle()

    if (!aptData) { setLoading(false); return }

    const { data: detsData } = await supabase
      .from('apartment_details')
      .select('*')
      .eq('apartment_id', aptData.id)
      .order('category')

    setApt(aptData)
    setDetails(detsData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveApartment() {
    if (!apt) return
    setSaving(true)
    const { error } = await supabase
      .from('apartments')
      .update({
        name: apt.name,
        neighborhood: apt.neighborhood,
        description: apt.description,
        size: apt.size,
        guests: apt.guests,
        airbnb_ical_url: apt.airbnb_ical_url,
      })
      .eq('id', apt.id)

    if (error) toast(error.message, 'error')
    else toast('Property saved', 'success')
    setSaving(false)
  }

  async function addDetail() {
    if (!apt || !newDetail.content.trim()) return
    const { data, error } = await supabase
      .from('apartment_details')
      .insert({ apartment_id: apt.id, ...newDetail })
      .select()
      .single()
    if (error) { toast(error.message, 'error'); return }
    setDetails(prev => [...prev, data])
    setNewDetail(p => ({ ...p, content: '' }))
    toast('Detail added', 'success')
  }

  async function deleteDetail(id: string) {
    await supabase.from('apartment_details').delete().eq('id', id)
    setDetails(prev => prev.filter(d => d.id !== id))
    toast('Detail removed', 'success')
  }

  async function togglePrivacy(det: Detail) {
    await supabase.from('apartment_details').update({ is_private: !det.is_private }).eq('id', det.id)
    setDetails(prev => prev.map(d => d.id === det.id ? { ...d, is_private: !d.is_private } : d))
  }

  if (loading) return <Loader />
  if (!apt) return <p className="text-gray-400">No property found. Complete onboarding first.</p>

  const grouped = CATEGORIES.reduce<Record<string, Detail[]>>((acc, cat) => {
    const items = details.filter(d => d.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const otherItems = details.filter(d => !CATEGORIES.slice(0, -1).includes(d.category) && d.category !== 'Other')
  if (otherItems.length > 0) grouped['Other'] = [...(grouped['Other'] ?? []), ...otherItems]

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Property Setup</h1>

      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-gray-300 mb-1.5">Property name</label>
            <input
              value={apt.name}
              onChange={e => setApt(p => p ? { ...p, name: e.target.value } : p)}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Neighbourhood</label>
            <input
              value={apt.neighborhood}
              onChange={e => setApt(p => p ? { ...p, neighborhood: e.target.value } : p)}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Size</label>
            <input
              value={apt.size ?? ''}
              onChange={e => setApt(p => p ? { ...p, size: e.target.value } : p)}
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
              value={apt.guests}
              onChange={e => setApt(p => p ? { ...p, guests: Number(e.target.value) } : p)}
              className={INPUT}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-300 mb-1.5">Description</label>
            <textarea
              value={apt.description ?? ''}
              onChange={e => setApt(p => p ? { ...p, description: e.target.value } : p)}
              className={`${INPUT} resize-none`}
              rows={4}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-300 mb-1.5">
              Airbnb iCal URL{' '}
              <span className="text-gray-500 font-normal">(for booking sync)</span>
            </label>
            <input
              value={apt.airbnb_ical_url ?? ''}
              onChange={e => setApt(p => p ? { ...p, airbnb_ical_url: e.target.value } : p)}
              className={INPUT}
              placeholder="https://www.airbnb.com/calendar/ical/..."
            />
          </div>
        </div>

        <button
          onClick={saveApartment}
          disabled={saving}
          className="flex items-center gap-2 bg-white text-[#1c1c1a] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </section>

      {/* Details by category */}
      <section className="space-y-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Guest Info</h2>

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-sm font-medium text-gray-300 mb-2">{cat}</p>
            <div className="space-y-2">
              {items.map(det => (
                <div key={det.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                  <span className="flex-1 text-sm text-gray-200">{det.content}</span>
                  <button
                    onClick={() => togglePrivacy(det)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                    title={det.is_private ? 'Private (guests only see with booking)' : 'Public'}
                  >
                    {det.is_private ? <Lock size={13} /> : <Globe size={13} />}
                  </button>
                  <button
                    onClick={() => deleteDetail(det.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Add new detail */}
        <div className="border border-dashed border-white/20 rounded-xl p-4 space-y-3">
          <p className="text-sm text-gray-400">Add detail</p>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newDetail.category}
              onChange={e => setNewDetail(p => ({ ...p, category: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/50"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={newDetail.is_private}
                onChange={e => setNewDetail(p => ({ ...p, is_private: e.target.checked }))}
                className="rounded"
              />
              Private
            </label>
          </div>
          <div className="flex gap-2">
            <input
              value={newDetail.content}
              onChange={e => setNewDetail(p => ({ ...p, content: e.target.value }))}
              className={`${INPUT} flex-1`}
              placeholder="e.g. No parties"
              onKeyDown={e => e.key === 'Enter' && addDetail()}
            />
            <button
              onClick={addDetail}
              disabled={!newDetail.content.trim()}
              className="bg-white text-[#1c1c1a] px-3 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
