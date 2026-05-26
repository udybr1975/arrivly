import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Loader from './Loader'

export default function PrivateRoute() {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user)
      setLoading(false)
    })
  }, [])

  if (loading) return <Loader />
  return authed ? <Outlet /> : <Navigate to="/login" replace />
}
