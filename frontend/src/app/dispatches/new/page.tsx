'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Navigation from '@/components/Navigation'

interface Store {
  id: string
  name: string
  store_code: string
}

interface Product {
  id: string
  reference: string
  designation: string
  segment: string
  sous_famille: string
}

interface Stock {
  id: string
  product_id: string
  store_id: string
  quantity: number
  available_date: string
  product: Product
  store: Store
}

export default function NewDispatchPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [sourceStore, setSourceStore] = useState<string>('')
  const [targetStore, setTargetStore] = useState<string>('')
  const [stores, setStores] = useState<Store[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Charger les magasins au montage du composant
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .order('name')

        if (error) throw error
        setStores(data || [])
      } catch (error) {
        console.error('Erreur lors du chargement des magasins:', error)
        setError('Erreur lors du chargement des magasins')
      }
    }

    fetchStores()
  }, [])

  // Charger les stocks quand un magasin source est sélectionné
  useEffect(() => {
    const fetchStocks = async () => {
      if (!sourceStore) return

      try {
        const { data, error } = await supabase
          .from('stock')
          .select(`
            *,
            product:products(*),
            store:stores(*)
          `)
          .eq('store_id', sourceStore)
          .gt('quantity', 0)

        if (error) throw error
        setStocks(data || [])
      } catch (error) {
        console.error('Erreur lors du chargement des stocks:', error)
        setError('Erreur lors du chargement des stocks')
      }
    }

    fetchStocks()
  }, [sourceStore])

  const handleStockToggle = (stockId: string) => {
    setSelectedStocks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stockId)) {
        newSet.delete(stockId)
      } else {
        newSet.add(stockId)
      }
      return newSet
    })
  }

  const handleCreateDispatch = async () => {
    if (!name || !sourceStore || !targetStore || selectedStocks.size === 0) {
      setError('Veuillez remplir tous les champs et sélectionner au moins un produit')
      return
    }

    setIsLoading(true)
    try {
      // 1. Créer la distribution
      const { data: distribution, error: distributionError } = await supabase
        .from('distributions')
        .insert({
          name,
          status: 'draft'
        })
        .select()
        .single()

      if (distributionError) throw distributionError

      // 2. Créer les items de distribution
      const distributionItems = Array.from(selectedStocks).map(stockId => {
        const stock = stocks.find(s => s.id === stockId)
        if (!stock) throw new Error('Stock non trouvé')

        return {
          distribution_id: distribution.id,
          product_id: stock.product_id,
          source_store_id: sourceStore,
          target_store_id: targetStore,
          quantity: stock.quantity,
          available_date: stock.available_date
        }
      })

      const { error: itemsError } = await supabase
        .from('distribution_items')
        .insert(distributionItems)

      if (itemsError) throw itemsError

      // Rediriger vers la page de détail du dispatch
      router.push(`/dispatches/${distribution.id}`)
    } catch (error) {
      console.error('Erreur lors de la création du dispatch:', error)
      setError('Erreur lors de la création du dispatch')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="pl-64">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Nouveau Dispatch</h1>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
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

            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Nom du dispatch */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nom du dispatch
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* Sélection des magasins */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="sourceStore" className="block text-sm font-medium text-gray-700">
                        Magasin source
                      </label>
                      <select
                        id="sourceStore"
                        value={sourceStore}
                        onChange={(e) => setSourceStore(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Sélectionner un magasin</option>
                        {stores.map(store => (
                          <option key={store.id} value={store.id}>
                            {store.name} ({store.store_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="targetStore" className="block text-sm font-medium text-gray-700">
                        Magasin destination
                      </label>
                      <select
                        id="targetStore"
                        value={targetStore}
                        onChange={(e) => setTargetStore(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Sélectionner un magasin</option>
                        {stores.map(store => (
                          <option key={store.id} value={store.id}>
                            {store.name} ({store.store_code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Liste des stocks disponibles */}
                  {sourceStore && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Stocks disponibles</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sélection
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Référence
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Désignation
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Segment
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sous-famille
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantité
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date disponibilité
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {stocks.map((stock) => (
                              <tr key={stock.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedStocks.has(stock.id)}
                                    onChange={() => handleStockToggle(stock.id)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {stock.product.reference}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {stock.product.designation}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {stock.product.segment}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {stock.product.sous_famille}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {stock.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(stock.available_date).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCreateDispatch}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Création en cours...' : 'Créer le dispatch'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 