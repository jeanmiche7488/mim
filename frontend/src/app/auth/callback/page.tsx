'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const code = searchParams.get('code')
      const next = searchParams.get('next') ?? '/'

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            throw error
          }
          router.push(next)
        } catch (error) {
          setError('Une erreur est survenue lors de la réinitialisation du mot de passe.')
        }
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Erreur</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/auth')}
              className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Chargement...</h2>
          <p className="mt-2 text-gray-600">Veuillez patienter pendant que nous traitons votre demande.</p>
        </div>
      </div>
    </div>
  )
} 