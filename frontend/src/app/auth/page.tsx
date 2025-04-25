'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const { user, isLoading, error } = useUser()
  const router = useRouter()

  console.log('🔄 État de la page Auth:', {
    isLoading,
    user: user ? 'Utilisateur connecté' : 'Non connecté',
    error: error ? error.message : 'Aucune erreur'
  })

  useEffect(() => {
    console.log('🔍 useEffect déclenché:', {
      isLoading,
      user: user ? 'Utilisateur connecté' : 'Non connecté'
    })

    if (!isLoading && user) {
      console.log('🔄 Tentative de redirection vers /dispatches')
      router.replace('/dispatches')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    console.log('⏳ Affichage du loader')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chargement...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    console.log('❌ Erreur détectée:', error.message)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Erreur</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  console.log('👋 Affichage du formulaire de connexion')
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Connexion à MIM</h1>
          <p className="mt-2 text-gray-600">Connectez-vous pour accéder à la plateforme</p>
        </div>
        <div className="mt-8">
          <a
            href="/api/auth/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => console.log('🔗 Clic sur le bouton de connexion')}
          >
            Se connecter avec Auth0
          </a>
        </div>
      </div>
    </div>
  )
} 