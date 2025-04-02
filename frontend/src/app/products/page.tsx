'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Navigation from '@/components/Navigation'

interface Product {
  id: string
  reference: string
  name: string
  brand: string
  category: string
}

export default function ProductsPage() {
  const router = useRouter()
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
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('reference')

        if (error) throw error

        setProducts(data || [])
      } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error)
        setError('Erreur lors du chargement des produits')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const content = event.target?.result as string
        const rows = content.split('\n').slice(1) // Skip header row
        const data = rows.map(row => {
          const [reference, name, brand, category] = row.split(',')
          return {
            reference: reference.trim(),
            name: name.trim(),
            brand: brand.trim(),
            category: category.trim()
          }
        })

        const { error } = await supabase
          .from('products')
          .upsert(data)

        if (error) throw error

        setSuccess('Base de données produits mise à jour avec succès')
        setTimeout(() => setSuccess(null), 3000)
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('Erreur lors de l\'import des produits:', error)
      setError('Erreur lors de l\'import de la base de données produits')
      setTimeout(() => setError(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="pl-64">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Base de données Produits</h1>
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
                  <div className="flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Import de données</h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>Importez un fichier CSV contenant la liste des produits.</p>
                        <p className="mt-1">Format attendu : référence, nom, marque, catégorie</p>
                      </div>
                      <div className="mt-5">
                        <div className="flex items-center">
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-semibold
                              file:bg-indigo-50 file:text-indigo-700
                              hover:file:bg-indigo-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Référence
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Nom
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Marque
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Catégorie
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {products.map((product) => (
                                <tr key={product.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {product.reference}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.brand}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.category}
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
    </div>
  )
} 