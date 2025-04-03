'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Navigation from '@/components/Navigation'

interface Store {
  name: string
  store_code: string
}

interface StoreProductCount {
  store: string
  products: number
}

interface CategoryCount {
  name: string
  value: number
}

const COLORS = {
  ACCESSOIRES: '#3B82F6',  // blue-500
  CHAUSSURES: '#10B981'    // emerald-500
}

const STORE_NAMES = {
  'CITY_SPORT': 'CITY SPORT',
  'GO_SPORT': 'GO SPORT',
  'COURIR': 'COURIR',
  'DESTOCK': 'DESTOCK'
}

export default function AnalyticsPage() {
  const [productsPerStore, setProductsPerStore] = useState<StoreProductCount[]>([])
  const [productsPerCategory, setProductsPerCategory] = useState<CategoryCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les données des produits par magasin
        const stores = ['CITY_SPORT', 'GO_SPORT', 'COURIR', 'DESTOCK']
        const storeProductCounts = await Promise.all(
          stores.map(async (storeCode) => {
            const { count, error: countError } = await supabase
              .from('products')
              .select('*', { count: 'exact' })
              .eq(storeCode.toLowerCase(), true)

            if (countError) {
              console.error(`Erreur lors du comptage des produits pour ${storeCode}:`, countError)
              return {
                store: STORE_NAMES[storeCode as keyof typeof STORE_NAMES],
                products: 0
              }
            }

            return {
              store: STORE_NAMES[storeCode as keyof typeof STORE_NAMES],
              products: count || 0
            }
          })
        )
        setProductsPerStore(storeProductCounts)

        // Récupérer les données des produits par catégorie
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('segment')

        if (productsError) {
          console.error('Erreur lors de la récupération des produits:', productsError)
          throw new Error(`Erreur lors de la récupération des produits: ${productsError.message}`)
        }

        if (!productsData || productsData.length === 0) {
          console.log('Aucun produit trouvé')
          setProductsPerCategory([])
        } else {
          const categoryCount = productsData.reduce((acc: { [key: string]: number }, product) => {
            const category = product.segment || 'Non catégorisé'
            acc[category] = (acc[category] || 0) + 1
            return acc
          }, {})

          const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
            name,
            value
          }))
          setProductsPerCategory(categoryData)
        }

        setLoading(false)
      } catch (err) {
        console.error('Erreur générale:', err)
        setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Une erreur est survenue</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      <div className="w-64 flex-shrink-0">
        <Navigation />
      </div>
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto px-4 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-2">Visualisez les données de votre plateforme</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Nombre de produits par magasin</h2>
                <div className="h-[400px] relative">
                  {productsPerStore.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Aucun magasin trouvé
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={productsPerStore} 
                        margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
                        layout="vertical"
                        barSize={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis 
                          type="number"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          dataKey="store" 
                          type="category"
                          width={120}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => value.replace(' ', '\n')}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ color: '#374151' }}
                        />
                        <Legend />
                        <Bar dataKey="products" fill="#3B82F6" name="Nombre de produits" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Répartition des produits par segment</h2>
                <div className="h-[400px] relative">
                  {productsPerCategory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Aucun produit trouvé
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productsPerCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={150}
                          dataKey="value"
                        >
                          {productsPerCategory.map((entry) => (
                            <Cell 
                              key={`cell-${entry.name}`} 
                              fill={COLORS[entry.name as keyof typeof COLORS] || '#3B82F6'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ color: '#374151' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 