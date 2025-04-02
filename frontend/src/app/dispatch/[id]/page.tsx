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

interface Store {
  id: string
  name: string
  address: string
  city: string
  postal_code: string
  country: string
}

interface Product {
  id: string
  reference: string
  name: string
  brand: string
  category: string
}

export default function DispatchPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [dispatch, setDispatch] = useState<Dispatch | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
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

        // Récupérer la liste des magasins
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('*')
          .order('name')

        if (storesError) throw storesError

        // Récupérer la liste des produits
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('reference')

        if (productsError) throw productsError

        setDispatch(dispatchData)
        setStores(storesData || [])
        setProducts(productsData || [])
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error)
        setError('Erreur lors du chargement des données')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleStoreToggle = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    )
  }

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleStartDispatch = async () => {
    if (selectedStores.length === 0 || selectedProducts.length === 0) {
      setError('Veuillez sélectionner au moins un magasin et un produit')
      return
    }

    try {
      const { error } = await supabase
        .from('dispatch_history')
        .update({
          status: 'processing',
          store_count: selectedStores.length,
          product_count: selectedProducts.length
        })
        .eq('id', params.id)

      if (error) throw error

      router.push(`/dispatch/${params.id}/process`)
    } catch (error) {
      console.error('Erreur lors du démarrage du dispatch:', error)
      setError('Erreur lors du démarrage du dispatch')
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
              <h1 className="text-3xl font-bold text-gray-900">Configuration du dispatch</h1>
              <button
                onClick={handleStartDispatch}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Démarrer le dispatch
              </button>
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

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sélection des magasins */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Magasins sélectionnés</h3>
                  <div className="mt-4">
                    <div className="space-y-4">
                      {stores.map((store) => (
                        <div key={store.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedStores.includes(store.id)}
                            onChange={() => handleStoreToggle(store.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label className="ml-3">
                            <span className="block text-sm font-medium text-gray-700">{store.name}</span>
                            <span className="block text-sm text-gray-500">{store.address}, {store.postal_code} {store.city}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sélection des produits */}
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Produits sélectionnés</h3>
                  <div className="mt-4">
                    <div className="space-y-4">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleProductToggle(product.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label className="ml-3">
                            <span className="block text-sm font-medium text-gray-700">{product.name}</span>
                            <span className="block text-sm text-gray-500">{product.reference} - {product.brand}</span>
                          </label>
                        </div>
                      ))}
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