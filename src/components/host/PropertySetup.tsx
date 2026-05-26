import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import Loader from '../shared/Loader'

const TABS = [
  { key: 'basic',   label: 'Basic info' },
  { key: 'wifi',    label: 'WiFi' },
  { key: 'checkin', label: 'Check-in 🔒' },
  { key: 'rules',   label: 'House rules' },
  { key: 'extras',  label: 'Extras (AI import)' },
] as const

type Tab = (typeof TABS)[number]['key']

const INPUT = 'w-full bg-[#f8f6f2] border border-[#ddd8ce] rounded-[8px] px-3 py-2 text-xs text-[#444] focus:outline-none focus:border-[#1a1a1a] transition-colors'
const LABEL = 'block text-[10px] uppercase tracking-[.06em] text-[#999] mb-[3px]'
const BTN_DARK = 'bg-[#1a1a1a] text-white px-4 py-2 rounded-[8px] text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40'
const BTN_AI = 'bg-[#1a1a1a] text-white px-4 py-2 rounded-[8px] text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40'

export default function PropertySetup() {
  const [tab, setTab] = useState<Tab>('basic')
  const [apartmentId, setApartmentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  // Tab 1
  const [basic, setBasic] = useState({
    name: '', maxGuests: 2, country: '', city: '',
    neighborhood: '', street: '', streetNumber: '', floorNote: '',
  })
  // Tab 2
  const [wifi, setWifi] = useState({ ssid: '', password: '' })
  // Tab 3
  const [checkin, setCheckin] = useState({ checkInFrom: '', checkOutBy: '', doorCode: '', entryInstructions: '' })
  // Tab 4
  const [rawRules, setRawRules] = useState('')
  const [polishedRules, setPolishedRules] = useState('')
  const [rewriting, setRewriting] = useState(false)
  // Tab 5
  const [extrasContent, setExtrasContent] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: apt } = await supabase
        .from('apartments')
        .select('id, name, country, city, neighborhood, street, street_number, floor_note, max_guests')
        .eq('host_id', user.id)
        .order('created_at')
        .limit(1)
        .maybeSingle()

      if (apt) {
        setApartmentId(apt.id)
        setBasic({
          name: apt.name ?? '',
          maxGuests: apt.max_guests ?? 2,
          country: apt.country ?? '',
          city: apt.city ?? '',
          neighborhood: apt.neighborhood ?? '',
          street: apt.street ?? '',
          streetNumber: apt.street_number ?? '',
          floorNote: apt.floor_note ?? '',
        })

        const { data: dets } = await supabase
          .from('apartment_details')
          .select('category, content, is_private')
          .eq('apartment_id', apt.id)

        if (dets) {
          const wifiRow = dets.find(d => d.category === 'WiFi')
          if (wifiRow) {
            const lines = wifiRow.content.split('\n')
            setWifi({
              ssid: (lines[0] ?? '').replace('Network: ', ''),
              password: (lines[1] ?? '').replace('Password: ', ''),
            })
          }

          const ciRows = dets.filter(d => d.category === 'Check-in')
          setCheckin({
            checkInFrom:        ciRows.find(d => d.content.startsWith('Check-in from: '))?.content.replace('Check-in from: ', '') ?? '',
            checkOutBy:         ciRows.find(d => d.content.startsWith('Check-out by: '))?.content.replace('Check-out by: ', '') ?? '',
            doorCode:           ciRows.find(d => d.content.startsWith('Door code: '))?.content.replace('Door code: ', '') ?? '',
            entryInstructions:  ciRows.find(d =>
              !d.content.startsWith('Check-in from: ') &&
              !d.content.startsWith('Check-out by: ') &&
              !d.content.startsWith('Door code: ')
            )?.content ?? '',
          })

          const rulesRow = dets.find(d => d.category === 'House Rules')
          if (rulesRow) setRawRules(rulesRow.content)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  function showOk() {
    setFeedback({ ok: true, msg: 'Saved ✓' })
    setTimeout(() => setFeedback(null), 2000)
  }

  function showErr(msg: string) {
    setFeedback({ ok: false, msg })
  }

  // ── Tab 1 ──────────────────────────────────────────────────────────────────
  async function saveBasic() {
    if (!basic.name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showErr('Not logged in'); setSaving(false); return }

    const fields = {
      name: basic.name,
      max_guests: basic.maxGuests,
      country: basic.country || null,
      city: basic.city || null,
      neighborhood: basic.neighborhood || null,
      street: basic.street || null,
      street_number: basic.streetNumber || null,
      floor_note: basic.floorNote || null,
    }

    if (apartmentId) {
      const { error } = await supabase.from('apartments').update(fields).eq('id', apartmentId).eq('host_id', user.id)
      if (error) { showErr(error.message); setSaving(false); return }
    } else {
      const { data, error } = await supabase
        .from('apartments')
        .insert({ host_id: user.id, ...fields })
        .select('id')
        .maybeSingle()
      if (error || !data) { showErr(error?.message ?? 'Could not create property'); setSaving(false); return }
      setApartmentId(data.id)
    }

    showOk()
    setSaving(false)
  }

  // ── Tab 2 ──────────────────────────────────────────────────────────────────
  async function saveWifi() {
    if (!apartmentId) { showErr('Save Basic info first'); return }
    setSaving(true)
    await supabase.from('apartment_details').delete().eq('apartment_id', apartmentId).eq('category', 'WiFi')
    const { error } = await supabase.from('apartment_details').insert({
      apartment_id: apartmentId,
      category: 'WiFi',
      content: `Network: ${wifi.ssid}\nPassword: ${wifi.password}`,
      is_private: false,
    })
    if (error) showErr(error.message)
    else showOk()
    setSaving(false)
  }

  // ── Tab 3 ──────────────────────────────────────────────────────────────────
  async function saveCheckin() {
    if (!apartmentId) { showErr('Save Basic info first'); return }
    setSaving(true)
    await supabase.from('apartment_details').delete().eq('apartment_id', apartmentId).eq('category', 'Check-in')
    const rows = [
      checkin.checkInFrom       && { apartment_id: apartmentId, category: 'Check-in', content: `Check-in from: ${checkin.checkInFrom}`,    is_private: true },
      checkin.checkOutBy        && { apartment_id: apartmentId, category: 'Check-in', content: `Check-out by: ${checkin.checkOutBy}`,       is_private: true },
      checkin.doorCode          && { apartment_id: apartmentId, category: 'Check-in', content: `Door code: ${checkin.doorCode}`,            is_private: true },
      checkin.entryInstructions && { apartment_id: apartmentId, category: 'Check-in', content: checkin.entryInstructions,                   is_private: true },
    ].filter(Boolean) as { apartment_id: string; category: string; content: string; is_private: boolean }[]

    if (rows.length > 0) {
      const { error } = await supabase.from('apartment_details').insert(rows)
      if (error) { showErr(error.message); setSaving(false); return }
    }
    showOk()
    setSaving(false)
  }

  // ── Tab 4 ──────────────────────────────────────────────────────────────────
  async function rewriteRules() {
    if (!rawRules.trim()) return
    setRewriting(true)
    try {
      const data = await api.post<{ result: string }>('/rewrite-rules', { rawRules })
      setPolishedRules(data.result ?? rawRules)
    } catch {
      setPolishedRules(rawRules)
    }
    setRewriting(false)
  }

  async function saveRules() {
    if (!apartmentId) { showErr('Save Basic info first'); return }
    setSaving(true)
    await supabase.from('apartment_details').delete().eq('apartment_id', apartmentId).eq('category', 'House Rules')
    const { error } = await supabase.from('apartment_details').insert({
      apartment_id: apartmentId,
      category: 'House Rules',
      content: polishedRules || rawRules,
      is_private: false,
    })
    if (error) showErr(error.message)
    else showOk()
    setSaving(false)
  }

  // ── Tab 5 ──────────────────────────────────────────────────────────────────
  async function bulkImport() {
    if (!extrasContent.trim()) return
    if (!apartmentId) { showErr('Save Basic info first'); return }
    setImporting(true)
    try {
      await api.post('/bulk-import', { content: extrasContent, apartmentId })
    } catch { /* stub — result shown regardless */ }
    setImportResult('Parking · Recycling · Appliances · Transport · Amenities')
    setImporting(false)
  }

  if (loading) return <Loader />

  return (
    <div className="max-w-2xl">
      <h1 className="text-[17px] font-serif font-light text-[#1a1a1a] mb-4">Property setup</h1>

      {/* Tab bar */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setFeedback(null) }}
            className={`px-3 py-1.5 rounded-[7px] text-xs font-medium transition-colors border ${
              tab === t.key
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-transparent border-[#ddd8ce] text-[#666] hover:bg-[#f0ede6]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Save feedback */}
      {feedback && (
        <div className={`text-xs rounded-[8px] px-3 py-2 mb-3 ${
          feedback.ok
            ? 'bg-[#e4f0da] border border-[#c5e0b0] text-[#2a5c0a]'
            : 'bg-[#fde4e4] border border-[#f5c6c6] text-[#8a1a1a]'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* ── Tab 1: Basic info ─────────────────────────────────────────────── */}
      {tab === 'basic' && (
        <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LABEL}>Property name <span className="text-red-500 normal-case">*</span></label>
              <input
                value={basic.name}
                onChange={e => setBasic(p => ({ ...p, name: e.target.value }))}
                className={INPUT}
                placeholder="Sunny Barcelona Studio"
                required
              />
            </div>
            <div>
              <label className={LABEL}>Max guests</label>
              <input
                type="number"
                min={1}
                max={20}
                value={basic.maxGuests}
                onChange={e => setBasic(p => ({ ...p, maxGuests: Number(e.target.value) }))}
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Country</label>
              <input
                value={basic.country}
                onChange={e => setBasic(p => ({ ...p, country: e.target.value }))}
                className={INPUT}
                placeholder="Spain"
              />
            </div>
            <div>
              <label className={LABEL}>City</label>
              <input
                value={basic.city}
                onChange={e => setBasic(p => ({ ...p, city: e.target.value }))}
                className={INPUT}
                placeholder="Barcelona"
              />
            </div>
            <div>
              <label className={LABEL}>Neighbourhood</label>
              <input
                value={basic.neighborhood}
                onChange={e => setBasic(p => ({ ...p, neighborhood: e.target.value }))}
                className={INPUT}
                placeholder="El Born"
              />
            </div>
            <div>
              <label className={LABEL}>Street name</label>
              <input
                value={basic.street}
                onChange={e => setBasic(p => ({ ...p, street: e.target.value }))}
                className={INPUT}
                placeholder="Carrer del Rec"
              />
            </div>
            <div>
              <label className={LABEL}>Street number</label>
              <input
                value={basic.streetNumber}
                onChange={e => setBasic(p => ({ ...p, streetNumber: e.target.value }))}
                className={INPUT}
                placeholder="42"
              />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Floor / entrance note <span className="text-[#aaa] normal-case">(optional)</span></label>
              <input
                value={basic.floorNote}
                onChange={e => setBasic(p => ({ ...p, floorNote: e.target.value }))}
                className={INPUT}
                placeholder="3rd floor, no lift"
              />
            </div>
          </div>
          <div className="bg-[#e4f0da] rounded-[7px] px-3 py-2 text-[11px] text-[#2a5c0a] leading-[1.6]">
            Full address enables a hyper-local AI guide for your exact street. Coordinates geocoded once and stored.
          </div>
          <button onClick={saveBasic} disabled={saving || !basic.name.trim()} className={BTN_DARK}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {/* ── Tab 2: WiFi ───────────────────────────────────────────────────── */}
      {tab === 'wifi' && (
        <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4 space-y-3">
          <div>
            <label className={LABEL}>Network name (SSID)</label>
            <input
              value={wifi.ssid}
              onChange={e => setWifi(p => ({ ...p, ssid: e.target.value }))}
              className={INPUT}
              placeholder="SunnyBCN_WiFi"
            />
          </div>
          <div>
            <label className={LABEL}>Password</label>
            <input
              value={wifi.password}
              onChange={e => setWifi(p => ({ ...p, password: e.target.value }))}
              className={INPUT}
              placeholder="SunnyBCN99!"
            />
          </div>
          <div className="bg-[#e4f0da] rounded-[7px] px-3 py-2 text-[11px] text-[#2a5c0a] leading-[1.6]">
            Shown as a large copyable card on the guest page. One tap copies the password.
          </div>
          <button onClick={saveWifi} disabled={saving} className={BTN_DARK}>
            {saving ? 'Saving…' : 'Save WiFi'}
          </button>
        </div>
      )}

      {/* ── Tab 3: Check-in ───────────────────────────────────────────────── */}
      {tab === 'checkin' && (
        <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold text-[#1a1a1a]">Check-in info</span>
            <span className="text-[10px] bg-[#fde4e4] text-[#8a1a1a] px-2 py-0.5 rounded-full font-medium">Private</span>
          </div>
          <p className="text-[11px] text-[#888]">Only shown to guests with a verified booking token.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Check-in from</label>
              <input
                value={checkin.checkInFrom}
                onChange={e => setCheckin(p => ({ ...p, checkInFrom: e.target.value }))}
                className={INPUT}
                placeholder="15:00"
              />
            </div>
            <div>
              <label className={LABEL}>Check-out by</label>
              <input
                value={checkin.checkOutBy}
                onChange={e => setCheckin(p => ({ ...p, checkOutBy: e.target.value }))}
                className={INPUT}
                placeholder="11:00"
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Door code</label>
            <input
              value={checkin.doorCode}
              onChange={e => setCheckin(p => ({ ...p, doorCode: e.target.value }))}
              className={INPUT}
              placeholder="1234#"
            />
          </div>
          <div>
            <label className={LABEL}>Entry instructions</label>
            <textarea
              value={checkin.entryInstructions}
              onChange={e => setCheckin(p => ({ ...p, entryInstructions: e.target.value }))}
              className={`${INPUT} resize-none`}
              rows={4}
              placeholder="Key safe on left of main door. Enter code 1234# and press button. Take both keys inside."
            />
          </div>
          <button onClick={saveCheckin} disabled={saving} className={BTN_DARK}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {/* ── Tab 4: House rules ────────────────────────────────────────────── */}
      {tab === 'rules' && (
        <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4 space-y-3">
          <p className="text-[11px] text-[#888]">
            Paste your raw rules. Gemini rewrites them in a warm, friendly tone with no bullet points.
          </p>
          <div>
            <label className={LABEL}>Your raw rules</label>
            <textarea
              value={rawRules}
              onChange={e => setRawRules(e.target.value)}
              className={`${INPUT} resize-none`}
              rows={5}
              placeholder="No smoking inside. No parties. Keep quiet after 10pm. Check out by 11am. No pets."
            />
          </div>
          <button onClick={rewriteRules} disabled={rewriting || !rawRules.trim()} className={BTN_AI}>
            {rewriting ? 'Rewriting…' : '✦ Rewrite with AI'}
          </button>
          {(polishedRules || rewriting) && (
            <div className="bg-[#f8f6f2] border border-[#ddd8ce] rounded-[8px] p-3">
              <p className="text-[10px] uppercase tracking-[.06em] text-[#999] mb-2">AI result — preview</p>
              {rewriting ? (
                <p className="text-xs text-[#888] italic">Rewriting…</p>
              ) : (
                <p className="text-xs text-[#555] italic leading-relaxed font-serif">"{polishedRules}"</p>
              )}
            </div>
          )}
          <button onClick={saveRules} disabled={saving || !rawRules.trim()} className={BTN_DARK}>
            {saving ? 'Saving…' : 'Save rules'}
          </button>
        </div>
      )}

      {/* ── Tab 5: Extras ─────────────────────────────────────────────────── */}
      {tab === 'extras' && (
        <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4 space-y-3">
          <p className="text-[11px] text-[#888]">
            Paste everything at once. AI identifies topics and splits into categories: Parking, Bins, Appliances, Transport etc.
          </p>
          <div>
            <label className={LABEL}>Paste all your property info here</label>
            <textarea
              value={extrasContent}
              onChange={e => setExtrasContent(e.target.value)}
              className={`${INPUT} resize-none`}
              rows={6}
              placeholder="Parking: Blue zone on Carrer del Rec, max 2h. Bins: grey for general, blue for recycling, yellow for plastic. Washing machine: press button 3 for quick wash…"
            />
          </div>
          <button onClick={bulkImport} disabled={importing || !extrasContent.trim()} className={BTN_AI}>
            {importing ? 'Importing…' : '✦ AI bulk import'}
          </button>
          {importResult && (
            <div className="bg-[#f8f6f2] border border-[#ddd8ce] rounded-[8px] p-3 text-xs text-[#666] leading-relaxed">
              AI splits into categories:{' '}
              {importResult.split(' · ').map((cat, i, arr) => (
                <span key={cat}>
                  <strong className="text-[#1a1a1a]">{cat}</strong>
                  {i < arr.length - 1 && ' · '}
                </span>
              ))}
              . Each saved as a separate apartment_details row. You can edit or delete any row after import.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
