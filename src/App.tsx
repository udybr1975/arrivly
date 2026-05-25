import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/shared/Toast'
import PrivateRoute from './components/shared/PrivateRoute'
import SuperAdminRoute from './components/shared/SuperAdminRoute'
import Layout from './components/shared/Layout'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import OnboardingFlow from './components/onboarding/OnboardingFlow'
import Dashboard from './components/host/Dashboard'
import PropertySetup from './components/host/PropertySetup'
import BookingManager from './components/host/BookingManager'
import QRCodePanel from './components/host/QRCodePanel'
import BrandingPanel from './components/host/BrandingPanel'
import BillingPanel from './components/host/BillingPanel'
import GuestPage from './components/guest/GuestPage'
import SuperAdmin from './components/admin/SuperAdmin'

function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1c1a] text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Arrivly</h1>
        <p className="text-xl text-gray-300 mb-8">Personalised guest pages for short-term rental hosts</p>
        <div className="flex gap-4 justify-center">
          <a href="/signup" className="bg-white text-[#1c1c1a] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Start free trial
          </a>
          <a href="/login" className="border border-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
            Sign in
          </a>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/guest" element={<GuestPage />} />

          {/* Protected host routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/onboarding" element={<OnboardingFlow />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/property" element={<PropertySetup />} />
              <Route path="/dashboard/bookings" element={<BookingManager />} />
              <Route path="/dashboard/qr" element={<QRCodePanel />} />
              <Route path="/dashboard/branding" element={<BrandingPanel />} />
              <Route path="/dashboard/billing" element={<BillingPanel />} />
            </Route>
          </Route>

          {/* Superadmin */}
          <Route element={<SuperAdminRoute />}>
            <Route path="/admin" element={<SuperAdmin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
