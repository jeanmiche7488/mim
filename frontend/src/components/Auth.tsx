'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isNewPassword, setIsNewPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/')
    }
  }, [shouldRedirect, router])

  useEffect(() => {
    const handlePasswordReset = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session && window.location.pathname === '/auth/callback') {
        setIsNewPassword(true)
      }
    }
    handlePasswordReset()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('Tentative de connexion avec:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Erreur de connexion:', error)
        if (error.message === 'Invalid login credentials') {
          setError('Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.')
        } else {
          setError(`Erreur de connexion : ${error.message}`)
        }
        return
      }

      console.log('Connexion réussie:', data)
      if (data?.user) {
        // Vérifier la session après la connexion
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session après connexion:', session)
        
        if (session) {
          console.log('Redirection vers la page d\'accueil...')
          setShouldRedirect(true)
        } else {
          setError('Erreur lors de la création de la session')
        }
      }
    } catch (error: any) {
      console.error('Erreur inattendue:', error)
      setError(`Une erreur est survenue : ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.')
        } else {
          setError(`Erreur d'inscription : ${error.message}`)
        }
        return
      }

      if (data?.user) {
        setError('Vérifiez votre email pour confirmer votre inscription')
        setIsSignUp(false)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setError('Votre mot de passe a été mis à jour avec succès')
      setIsNewPassword(false)
      router.push('/')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour du mot de passe')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) throw error

      setError('Vérifiez votre email pour réinitialiser votre mot de passe')
      setIsResetPassword(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la réinitialisation du mot de passe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {isNewPassword ? 'Nouveau mot de passe' : isResetPassword ? 'Réinitialiser le mot de passe' : isSignUp ? 'Créer un compte' : 'Connexion'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={isNewPassword ? handleNewPassword : isSignUp ? handleSignUp : isResetPassword ? handleResetPassword : handleSignIn}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required={!isNewPassword}
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {!isResetPassword && !isNewPassword && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            {isNewPassword && (
              <div>
                <label htmlFor="newPassword" className="sr-only">
                  Nouveau mot de passe
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : isNewPassword ? 'Mettre à jour le mot de passe' : isSignUp ? 'Créer un compte' : isResetPassword ? 'Envoyer le lien' : 'Se connecter'}
            </button>
          </div>

          {!isResetPassword && !isSignUp && !isNewPassword && (
            <div className="text-sm text-center space-y-2">
              <button
                type="button"
                onClick={() => setIsResetPassword(true)}
                className="font-medium text-indigo-600 hover:text-indigo-500 block w-full"
              >
                Mot de passe oublié ?
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="font-medium text-indigo-600 hover:text-indigo-500 block w-full"
              >
                Créer un compte
              </button>
            </div>
          )}

          {isSignUp && (
            <div className="text-sm text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Déjà un compte ? Se connecter
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
} 