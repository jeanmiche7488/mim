'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Navigation from '@/components/Navigation'

interface Store {
  id: string
  name: string
  address: string
  postal_code: string
  city: string
}

interface Product {
  id: string
  reference: string
  name: string
  brand: string
  category: string
}

export default function InputsPage() {
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
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
        const [storesResult, productsResult] = await Promise.all([
          supabase.from('stores').select('*'),
          supabase.from('products').select('*')
        ])

        if (storesResult.error) throw storesResult.error
        if (productsResult.error) throw productsResult.error

        setStores(storesResult.data || [])
        setProducts(productsResult.data || [])
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error)
        setError('Erreur lors du chargement des données')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'stores' | 'products') => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const content = event.target?.result as string
        const rows = content.split('\n').slice(1) // Skip header row
        const data = rows.map(row => {
          const [name, address, postal_code, city] = row.split(',')
          return {
            name: name.trim(),
            address: address.trim(),
            postal_code: postal_code.trim(),
            city: city.trim()
          }
        })

        const { error } = await supabase
          .from(type)
          .upsert(data)

        if (error) throw error

        setSuccess(`Base de données ${type === 'stores' ? 'magasins' : 'produits'} mise à jour avec succès`)
        setTimeout(() => setSuccess(null), 3000)
      }
      reader.readAsText(file)
    } catch (error) {
      console.error(`Erreur lors de l'import ${type}:`, error)
      setError(`Erreur lors de l'import de la base de données ${type === 'stores' ? 'magasins' : 'produits'}`)
      setTimeout(() => setError(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Gestion des bases de données</h1>
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

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Base de données Magasins */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Base de données Magasins</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Importez un fichier CSV contenant la liste des magasins.</p>
                  <p className="mt-1">Format attendu : nom, adresse, code postal, ville</p>
                </div>
                <div className="mt-5">
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, 'stores')}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Statistiques</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {stores.length} magasins enregistrés
                  </p>
                </div>
              </div>
            </div>

            {/* Base de données Produits */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Base de données Produits</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Importez un fichier CSV contenant la liste des produits.</p>
                  <p className="mt-1">Format attendu : référence, nom, marque, catégorie</p>
                </div>
                <div className="mt-5">
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, 'products')}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Statistiques</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {products.length} produits enregistrés
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 