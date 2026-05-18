'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Hotel, CircleAlert as AlertCircle, Loader as Loader2, User, Briefcase } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Role = 'guest' | 'staff'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<Role>('guest')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Staff-only fields
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [department, setDepartment] = useState('front_desk')
  const [position, setPosition] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('Failed to create account')

      const userId = authData.user.id

      // Insert into users table
      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        email,
        full_name: fullName,
        phone: phone || null,
        role,
      })

      if (userError) throw userError

      // Insert into subclass table
      if (role === 'guest') {
        const { error: guestError } = await supabase.from('guests').insert({
          id: userId,
          loyalty_points: 0,
        })
        if (guestError) throw guestError
      } else {
        const { error: staffError } = await supabase.from('staff').insert({
          id: userId,
          employee_number: employeeNumber || `EMP-${Date.now()}`,
          department,
          position: position || 'Staff',
          hire_date: new Date().toISOString().split('T')[0],
        })
        if (staffError) throw staffError
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0A] py-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#6366F1]/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative z-10 fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#6366F1] flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Lumière</span>
        </div>

        <div className="surface rounded-xl p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
            <p className="text-sm text-white/40">Join Lumière Grand Hotel</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              type="button"
              onClick={() => setRole('guest')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-150 text-sm',
                role === 'guest'
                  ? 'border-[#6366F1]/50 bg-[#6366F1]/10 text-[#818CF8]'
                  : 'border-[#1F1F1F] text-white/40 hover:border-white/10 hover:text-white/70'
              )}
            >
              <User className="w-4 h-4" />
              <span>Guest</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('staff')}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-150 text-sm',
                role === 'staff'
                  ? 'border-[#6366F1]/50 bg-[#6366F1]/10 text-[#818CF8]'
                  : 'border-[#1F1F1F] text-white/40 hover:border-white/10 hover:text-white/70'
              )}
            >
              <Briefcase className="w-4 h-4" />
              <span>Staff</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-white/50 mb-1.5 block">Full name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoFocus
                className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-white/20 focus:border-[#6366F1] h-10"
              />
            </div>

            <div>
              <Label className="text-xs text-white/50 mb-1.5 block">Email address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-white/20 focus:border-[#6366F1] h-10"
              />
            </div>

            <div>
              <Label className="text-xs text-white/50 mb-1.5 block">Phone (optional)</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-white/20 focus:border-[#6366F1] h-10"
              />
            </div>

            <div>
              <Label className="text-xs text-white/50 mb-1.5 block">Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-white/20 focus:border-[#6366F1] h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Staff fields */}
            {role === 'staff' && (
              <div className="space-y-3 pt-2 border-t border-[#1F1F1F]">
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Staff Details</p>
                <div>
                  <Label className="text-xs text-white/50 mb-1.5 block">Employee Number</Label>
                  <Input
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    placeholder="EMP-001"
                    className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-white/20 focus:border-[#6366F1] h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/50 mb-1.5 block">Department</Label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm focus:border-[#6366F1] outline-none"
                  >
                    <option value="front_desk">Front Desk</option>
                    <option value="housekeeping">Housekeeping</option>
                    <option value="management">Management</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="food_beverage">Food & Beverage</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-white/50 mb-1.5 block">Position / Title</Label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Front Desk Agent"
                    className="bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-white/20 focus:border-[#6366F1] h-10"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 rounded-md">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6366F1] hover:bg-[#5558E3] disabled:bg-white/10 disabled:text-white/30 text-white py-2.5 text-sm font-semibold rounded-md transition-colors duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#818CF8] hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
