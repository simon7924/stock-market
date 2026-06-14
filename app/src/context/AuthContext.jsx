import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
    // The DB trigger creates the profile; patch username immediately after.
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ username })
        .eq('id', data.user.id)
    }
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    setIsGuest(false)
    await supabase.auth.signOut()
  }

  async function enterGuestMode() {
    await supabase.auth.signOut()
    setUser(null)
    setIsGuest(true)
    setProfile({
      username: `Guest${Math.floor(Math.random() * 9000) + 1000}`,
      current_balance: 10000,
      starting_balance: 10000,
    })
    setLoading(false)
  }

  function exitGuestMode() {
    setIsGuest(false)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isGuest,
      signUp, signIn, signOut,
      enterGuestMode, exitGuestMode,
      setProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
