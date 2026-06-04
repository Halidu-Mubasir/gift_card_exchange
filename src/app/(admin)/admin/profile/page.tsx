'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type UserProfile = {
  id: string
  name: string
  email: string
  phone: string | null
  momoNumber: string | null
  role: string
  createdAt: string
}

export default function AdminProfilePage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/users/profile')
        const data = await res.json()

        if (data.success) {
          setProfile(data.data)
          setFormData({
            name: data.data.name || '',
            phone: data.data.phone || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          })
        }
      } catch {
        toast.error('Failed to load profile')
      }
    }

    loadProfile()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    // Validation
    const errs: Record<string, string> = {}

    if (!formData.name.trim()) {
      errs.name = 'Name is required'
    }

    // Password validation
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        errs.currentPassword = 'Current password is required to change password'
      }
      if (formData.newPassword.length < 8) {
        errs.newPassword = 'Password must be at least 8 characters'
      }
      if (formData.newPassword !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match'
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, string> = {
        name: formData.name,
        phone: formData.phone,
      }

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword
        payload.newPassword = formData.newPassword
      }

      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update profile')
        return
      }

      setProfile(data.data)
      toast.success(data.message || 'Profile updated successfully')

      // Update session name if changed
      if (formData.name !== session?.user?.name) {
        await update({ name: formData.name })
      }

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase = 'w-full px-4 py-3 rounded-lg outline-none transition-all text-sm'

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: '#1c1b1b' }}>
          Administrator Profile
        </h1>
        <p className="text-sm" style={{ color: '#7d7483' }}>
          Manage your account information
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8" style={{ boxShadow: '0 4px 40px rgba(75,0,130,0.08)', border: '1px solid #cec3d3' }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information */}
          <div>
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: '#1c1b1b' }}>
              Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={inputBase}
                  style={{
                    border: errors.name ? '1px solid #dc2626' : '1px solid #cec3d3',
                    backgroundColor: '#fcf9f8',
                  }}
                  disabled={loading}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  className={inputBase}
                  style={{
                    border: '1px solid #cec3d3',
                    backgroundColor: '#f3f4f6',
                    color: '#9ca3af',
                  }}
                  disabled
                />
                <p className="mt-1 text-xs" style={{ color: '#7d7483' }}>
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+233 XX XXX XXXX"
                  className={inputBase}
                  style={{
                    border: '1px solid #cec3d3',
                    backgroundColor: '#fcf9f8',
                  }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif', color: '#1c1b1b' }}>
              Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  className={inputBase}
                  style={{
                    border: errors.currentPassword ? '1px solid #dc2626' : '1px solid #cec3d3',
                    backgroundColor: '#fcf9f8',
                  }}
                  disabled={loading}
                />
                {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword}</p>}
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className={inputBase}
                  style={{
                    border: errors.newPassword ? '1px solid #dc2626' : '1px solid #cec3d3',
                    backgroundColor: '#fcf9f8',
                  }}
                  disabled={loading}
                />
                {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className={inputBase}
                  style={{
                    border: errors.confirmPassword ? '1px solid #dc2626' : '1px solid #cec3d3',
                    backgroundColor: '#fcf9f8',
                  }}
                  disabled={loading}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>
            <p className="mt-2 text-xs" style={{ color: '#7d7483' }}>
              Leave password fields empty if you don&apos;t want to change your password
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3.5 rounded-lg text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.03em' }}
            >
              {loading ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>

        {/* Account Stats */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: '#7d7483' }}>
            Account Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: '#7d7483' }}>Role</p>
              <p className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: '#4b0082' }}>
                Administrator
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#7d7483' }}>Member Since</p>
              <p className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: '#1c1b1b' }}>
                {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
