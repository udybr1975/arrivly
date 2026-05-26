import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const INPUT = 'w-full bg-[#f8f6f2] border border-[#ddd8ce] rounded-[8px] px-3 py-2 text-xs text-[#444] focus:outline-none focus:border-[#1a1a1a] transition-colors'
const LABEL = 'block text-[10px] uppercase tracking-[.06em] text-[#999] mb-[3px]'

export default function Signup() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName.trim() } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0ede6] px-4">
      <div className="w-full max-w-[320px]">
        <div className="mb-5">
          <h1 className="text-[17px] font-serif font-light text-[#1a1a1a] mb-1">Create your account</h1>
          <p className="text-xs text-[#888]">30 days free. No card needed.</p>
        </div>

        <form onSubmit={submit} className="space-y-[7px]">
          <div>
            <label className={LABEL}>First name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className={INPUT}
              placeholder="Marco"
              autoComplete="given-name"
              minLength={2}
              required
            />
          </div>
          <div>
            <label className={LABEL}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={INPUT}
              placeholder="marco@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className={LABEL}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={INPUT}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-[#666] cursor-pointer pt-1 pb-1">
            <div
              className={`w-[15px] h-[15px] border rounded-[3px] flex-shrink-0 mt-0.5 flex items-center justify-center cursor-pointer ${
                agreed ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'border-[#ccc]'
              }`}
              onClick={() => setAgreed(v => !v)}
            >
              {agreed && <span className="text-white text-[9px]">✓</span>}
            </div>
            <span onClick={() => setAgreed(v => !v)}>I agree to the terms and privacy policy</span>
          </label>

          {error && (
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full bg-[#1a1a1a] text-white rounded-[8px] py-[10px] text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 mt-2"
          >
            {loading ? 'Creating account…' : 'Create free account'}
          </button>

          <p className="text-center pt-2 text-xs text-[#888]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1a1a1a] font-semibold underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
