'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Navigation from '@/components/Navigation'
import CreateDispatchModal from '@/components/CreateDispatchModal'
import { DispatchStatus } from '@/types/common'

interface Dispatch {
  id: string
  name: string
  status: DispatchStatus
  created_at: string
  parameters: {
    min_reference_quantity: number
    min_ean_quantity: number
  }
  stock_to_dispatch_items: Array<{
    id: string
    product_id: string
    ean_code: string
    size: string
    quantity: number
    expedition_date: string | null
    products: {
      reference: string
      designation: string
    }
  }>
}

export default function DispatchPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [dispatch, setDispatch] = useState<Dispatch | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchDispatch = async () => {
      try {
        const { data, error } = await supabase
          .from('stock_to_dispatch')
          .select(`
            *,
            parameters (
              min_reference_quantity,
              min_ean_quantity
            ),
            stock_to_dispatch_items (
              id,
              product_id,
              ean_code,
              size,
              quantity,
              expedition_date,
              products (
                reference,
                designation
              )
            )
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error
        setDispatch(data)
      } catch (error) {
        console.error('Erreur lors du chargement du dispatch:', error)
        setError('Erreur lors du chargement du dispatch')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDispatch()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="pl-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !dispatch) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="pl-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error || 'Dispatch non trouvé'}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{dispatch.name}</h1>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Modifier
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Informations générales</h3>
                    <dl className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Statut</dt>
                        <dd className="mt-1 text-sm text-gray-900">{dispatch.status}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(dispatch.created_at).toLocaleDateString('fr-FR')}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Articles ({dispatch.stock_to_dispatch_items.length})</h3>
                    <div className="mt-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Référence
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Désignation
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              EAN
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Taille
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantité
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dispatch.stock_to_dispatch_items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.products.reference}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.products.designation}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.ean_code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.size}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.quantity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <CreateDispatchModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          existingDispatch={{
            id: dispatch.id,
            name: dispatch.name,
            status: dispatch.status
          }}
        />
      )}
    </div>
  )
} 