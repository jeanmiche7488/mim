'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Navigation from '@/components/Navigation'

interface Dispatch {
  id: string
  status: string
  store_count: number
  product_count: number
  total_items: number
  dispatched_items: number
  potential_revenue: number
}

interface DispatchItem {
  id: string
  store_id: string
  product_id: string
  quantity: number
  status: string
  store: {
    name: string
  }
  product: {
    name: string
    reference: string
  }
}

export default function DispatchProcessPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [dispatch, setDispatch] = useState<Dispatch | null>(null)
  const [items, setItems] = useState<DispatchItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
    const fetchData = async () => {
      try {
        // Récupérer les informations du dispatch
        const { data: dispatchData, error: dispatchError } = await supabase
          .from('dispatch_history')
          .select('*')
          .eq('id', params.id)
          .single()

        if (dispatchError) throw dispatchError

        // Récupérer les items du dispatch
        const { data: itemsData, error: itemsError } = await supabase
          .from('dispatch_items')
          .select(`
            *,
            store:stores(name),
            product:products(name, reference)
          `)
          .eq('dispatch_id', params.id)
          .order('created_at')

        if (itemsError) throw itemsError

        setDispatch(dispatchData)
        setItems(itemsData || [])
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error)
        setError('Erreur lors du chargement des données')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleItemUpdate = async (itemId: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('dispatch_items')
        .update({
          quantity,
          status: 'completed'
        })
        .eq('id', itemId)

      if (error) throw error

      // Mettre à jour les statistiques du dispatch
      const updatedItems = items.map(item => 
        item.id === itemId ? { ...item, quantity, status: 'completed' } : item
      )

      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      const completedItems = updatedItems.filter(item => item.status === 'completed').length

      const { error: updateError } = await supabase
        .from('dispatch_history')
        .update({
          total_items: totalItems,
          dispatched_items: completedItems,
          status: completedItems === updatedItems.length ? 'completed' : 'processing'
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      setItems(updatedItems)
      setSuccess('Item mis à jour avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'item:', error)
      setError('Erreur lors de la mise à jour de l\'item')
      setTimeout(() => setError(null), 3000)
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

  if (!dispatch) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-red-600">Dispatch non trouvé</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Traitement du dispatch</h1>
              <div className="flex items-center space-x-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  dispatch.status === 'completed' ? 'bg-green-100 text-green-800' :
                  dispatch.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {dispatch.status === 'completed' ? 'Terminé' :
                   dispatch.status === 'processing' ? 'En cours' :
                   'Erreur'}
                </span>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retour au tableau de bord
                </button>
              </div>
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
                  <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Magasin
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Produit
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantité
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Statut
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.store.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.product.name} ({item.product.reference})
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.quantity}
                                    onChange={(e) => handleItemUpdate(item.id, parseInt(e.target.value))}
                                    disabled={item.status === 'completed'}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.status === 'completed' ? 'Terminé' : 'En attente'}
                                  </span>
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
      </div>
    </div>
  )
} 