'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Navigation from '@/components/Navigation'

interface Parameters {
  min_reference_quantity: number
  min_ean_quantity: number
}

export default function ParametersPage() {
  const router = useRouter()
  const [parameters, setParameters] = useState<Parameters>({
    min_reference_quantity: 0,
    min_ean_quantity: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
      }
    }
    checkSession()
  }, [router])

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const { data, error } = await supabase
          .from('parameters')
          .select('*')
          .single()

        if (error) throw error

        setParameters(data || {
          min_reference_quantity: 0,
          min_ean_quantity: 0
        })
      } catch (error) {
        console.error('Erreur lors de la récupération des paramètres:', error)
        setError('Erreur lors du chargement des paramètres')
      } finally {
        setIsLoading(false)
      }
    }

    fetchParameters()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('parameters')
        .upsert(parameters)

      if (error) throw error

      setSuccess('Paramètres mis à jour avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error)
      setError('Erreur lors de la mise à jour des paramètres')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">Chargement...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="pl-64">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{success}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="min_reference_quantity" className="block text-sm font-medium text-gray-700">
                        Quantité minimale par référence
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="min_reference_quantity"
                          id="min_reference_quantity"
                          value={parameters.min_reference_quantity}
                          onChange={(e) => setParameters(prev => ({
                            ...prev,
                            min_reference_quantity: parseInt(e.target.value)
                          }))}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Quantité minimale d'articles à dispatcher par référence de produit.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="min_ean_quantity" className="block text-sm font-medium text-gray-700">
                        Quantité minimale par EAN
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="min_ean_quantity"
                          id="min_ean_quantity"
                          value={parameters.min_ean_quantity}
                          onChange={(e) => setParameters(prev => ({
                            ...prev,
                            min_ean_quantity: parseInt(e.target.value)
                          }))}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Quantité minimale d'articles à dispatcher par code EAN.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 