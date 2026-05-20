'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import type { User } from '@/types/database'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      setUser(data)
      setLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setLoading(false)
      } else if (session?.user) {
        fetchUserProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return { user, loading }
}
