'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import type { User } from '@/types/database'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Menu, X, Hotel, ChevronDown, LogOut, LayoutDashboard, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/rooms', label: 'Rooms' },
  { href: '/#amenities', label: 'Amenities' },
  { href: '/#about', label: 'About' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      setUser(data)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
      } else if (session?.user) {
        fetchUserProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  const isHomePage = pathname === '/'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || !isHomePage
          ? 'glass border-b border-white/5 shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300">
              <Hotel className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">
              Lumière
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors duration-150',
                  pathname === link.href
                    ? 'text-white bg-white/8'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors duration-150 group">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-[#6366F1] text-white text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm text-white/80 group-hover:text-white transition-colors">
                      {user.full_name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-[#111] border-[#1F1F1F] text-white shadow-xl"
                >
                  <DropdownMenuLabel className="pb-2">
                    <div className="font-medium text-sm">{user.full_name}</div>
                    <div className="text-xs text-white/40 font-normal mt-0.5">{user.email}</div>
                    <div className="mt-1.5">
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider',
                        user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' :
                        user.role === 'staff' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-[#6366F1]/20 text-[#818CF8]'
                      )}>
                        {user.role}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#1F1F1F]" />
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white/70 hover:text-white">
                    <Link href="/dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === 'admin' || user.role === 'staff') && (
                    <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white/70 hover:text-white">
                      <Link href="/admin">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[#1F1F1F]" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-rose-400 hover:text-rose-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm bg-[#6366F1] hover:bg-[#5558E3] text-white px-4 py-1.5 rounded-md transition-colors duration-150 font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/5 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
