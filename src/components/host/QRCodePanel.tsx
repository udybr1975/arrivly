import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Copy, Download, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ARRIVLY_CONFIG } from '../../config'
import Loader from '../shared/Loader'

export default function QRCodePanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [aptId, setAptId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('apartments')
        .select('id')
        .eq('created_by', user.id)
        .order('created_at')
        .limit(1)
        .maybeSingle()
      if (data) setAptId(data.id)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!aptId || !canvasRef.current) return
    const url = `${ARRIVLY_CONFIG.appUrl}/guest?id=${aptId}`
    QRCode.toCanvas(canvasRef.current, url, {
      width: 256,
      margin: 2,
      color: { dark: '#1c1c1a', light: '#ffffff' },
    })
  }, [aptId])

  function guestUrl() {
    return `${ARRIVLY_CONFIG.appUrl}/guest?id=${aptId}`
  }

  async function copyUrl() {
    if (!aptId) return
    await navigator.clipboard.writeText(guestUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = 'arrivly-qr.png'
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  if (loading) return <Loader />

  return (
    <div className="max-w-md space-y-8">
      <h1 className="text-2xl font-bold">QR Code</h1>

      <div className="bg-white rounded-2xl p-6 w-fit">
        <canvas ref={canvasRef} />
      </div>

      {aptId && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Guest page URL</p>
            <p className="text-sm font-mono text-gray-300 break-all">{guestUrl()}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyUrl}
              className="flex-1 flex items-center justify-center gap-2 border border-white/20 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
            >
              {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
            <button
              onClick={download}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-[#1c1c1a] py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              <Download size={15} />
              Download QR
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Print or display this QR code at your property so guests can access their welcome page.
          </p>
        </div>
      )}
    </div>
  )
}
