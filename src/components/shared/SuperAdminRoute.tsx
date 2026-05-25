import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ARRIVLY_CONFIG } from '../../config'
import Loader from './Loader'

export default function SuperAdminRoute() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email
      setIsAdmin(email === ARRIVLY_CONFIG.adminEmail)
      setLoading(false)
    })
  }, [])

  if (loading) return <Loader />
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />
}
