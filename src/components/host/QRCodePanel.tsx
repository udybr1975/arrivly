import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabase'
import { ARRIVLY_CONFIG } from '../../config'
import Loader from '../shared/Loader'

interface ApartmentQR {
  id: string
  name: string
  neighborhood: string | null
  guide_refreshed_at?: string | null
}

function guestUrl(aptId: string) {
  return `${ARRIVLY_CONFIG.appUrl}/guest?apt=${aptId}`
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'qr'
}

function PropertyQRCard({ apt }: { apt: ApartmentQR }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = guestUrl(apt.id)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 180,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
  }, [url])

  function download() {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `arrivly-qr-${slugify(apt.name)}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  function printCard() {
    if (!canvasRef.current) return
    const w = window.open('', '_blank')
    if (!w) return
    const img = canvasRef.current.toDataURL('image/png')
    w.document.write(`<html><body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;"><img src="${img}" style="width:300px"/><p style="font-family:monospace;font-size:11px;text-align:center">${url}</p></body></html>`)
    w.document.close()
    w.print()
  }

  return (
    <div className="bg-white border border-[#ddd8ce] rounded-[10px] p-4 flex items-start gap-4">
      <div className="shrink-0 bg-[#f8f6f2] rounded-[8px] p-2 flex items-center justify-center">
        <canvas ref={canvasRef} aria-label={`QR code for ${apt.name}`} style={{ width: 80, height: 80 }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[#1a1a1a] mb-0.5">{apt.name}</div>
        {apt.neighborhood && (
          <div className="text-[11px] text-[#888] mb-2">{apt.neighborhood}</div>
        )}
        <div className="bg-[#f8f6f2] rounded-[6px] px-2.5 py-1.5 mb-2">
          <div className="text-[10px] uppercase tracking-[.06em] text-[#999] mb-0.5">Guest page URL</div>
          <div className="text-[10px] font-mono text-[#555] break-all">{url}</div>
        </div>
        <div className="text-[10px] text-[#aaa] mb-3">
          Guide refreshed: {apt.guide_refreshed_at
            ? new Date(apt.guide_refreshed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Not generated yet'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={download}
            className="bg-[#1a1a1a] text-white px-3 py-1.5 rounded-[7px] text-xs font-semibold hover:opacity-80 transition-opacity"
          >
            ⬇ Download PNG
          </button>
          <button
            onClick={printCard}
            className="bg-transparent border border-[#ddd8ce] text-[#444] px-3 py-1.5 rounded-[7px] text-xs hover:bg-[#f0ede6] transition-colors"
          >
            🖨 Print card
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QRCodePanel() {
  const [apts, setApts] = useState<ApartmentQR[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('apartments')
        .select('id, name, neighborhood')
        .eq('host_id', user.id)
        .order('created_at')
      setApts(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Loader />

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[17px] font-serif font-light text-[#1a1a1a]">QR codes &amp; guides</h1>
        <button className="bg-transparent border border-[#ddd8ce] text-[#444] px-3 py-1.5 rounded-[7px] text-xs hover:bg-[#f0ede6] transition-colors">
          ↻ Refresh all guides
        </button>
      </div>

      {apts.length === 0 && (
        <div className="text-center py-10 text-[#aaa] text-[12px]">No properties yet.</div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {apts.map((apt) => (
          <PropertyQRCard key={apt.id} apt={apt} />
        ))}
      </div>

      {/* Dashed add card */}
      <div className="border border-dashed border-[#ccc] rounded-[10px] p-4 mt-3 flex items-center justify-center cursor-pointer hover:bg-white/60 transition-colors">
        <span className="text-[12px] text-[#aaa]">+ Add another property · coming soon</span>
      </div>
    </div>
  )
}
