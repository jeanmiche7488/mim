'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthCallback() {
  const { user, isLoading, error } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard')
      } else if (error) {
        router.push('/auth')
      }
    }
  }, [user, isLoading, error, router])

  if (isLoading) {
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Erreur</h2>
            <p className="mt-2 text-gray-600">{error.message}</p>
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

  return null
} 