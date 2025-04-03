'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Navigation from '@/components/Navigation'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

interface DispatchStats {
  total: number
  byMonth: Record<string, number>
  byStore: Record<string, number>
}

interface Store {
  id: string
  name: string
  is_active: boolean
}

interface Product {
  id: string
  name: string
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [dispatchStats, setDispatchStats] = useState<DispatchStats | null>(null)
  const [storeStats, setStoreStats] = useState<Store[]>([])
  const [productStats, setProductStats] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const fetchStats = async () => {
      try {
        // Récupérer les statistiques des dispatches
        const { data: dispatchData, error: dispatchError } = await supabase
          .from('dispatch_output')
          .select('*')

        if (dispatchError) throw dispatchError

        // Récupérer les statistiques des magasins
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')

        if (storeError) throw storeError

        // Récupérer les statistiques des produits
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')

        if (productError) throw productError

        // Calculer les statistiques des dispatches
        const dispatchStats: DispatchStats = {
          total: dispatchData.length,
          byMonth: dispatchData.reduce((acc: Record<string, number>, curr: any) => {
            const month = new Date(curr.date_dispo).toLocaleString('fr-FR', { month: 'long' })
            acc[month] = (acc[month] || 0) + 1
            return acc
          }, {}),
          byStore: dispatchData.reduce((acc: Record<string, number>, curr: any) => {
            acc[curr.magasin] = (acc[curr.magasin] || 0) + curr.quantity
            return acc
          }, {})
        }

        setDispatchStats(dispatchStats)
        setStoreStats(storeData || [])
        setProductStats(productData || [])
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error)
        setError('Erreur lors du chargement des statistiques')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="pl-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">Chargement...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !dispatchStats) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="pl-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center text-red-600">{error || 'Erreur lors du chargement des statistiques'}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const dispatchByMonthData = {
    labels: Object.keys(dispatchStats.byMonth),
    datasets: [
      {
        label: 'Nombre de dispatches par mois',
        data: Object.values(dispatchStats.byMonth),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  }

  const dispatchByStoreData = {
    labels: Object.keys(dispatchStats.byStore),
    datasets: [
      {
        label: 'Quantité dispatchée par magasin',
        data: Object.values(dispatchStats.byStore),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  }

  const storeByCategoryData = {
    labels: ['Magasins actifs', 'Magasins inactifs'],
    datasets: [
      {
        data: [storeStats.filter(s => s.is_active).length, storeStats.filter(s => !s.is_active).length],
        backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="pl-64">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Graphique des dispatches par mois */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Dispatches par mois</h2>
                <Bar data={dispatchByMonthData} />
              </div>

              {/* Graphique des dispatches par magasin */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quantité dispatchée par magasin</h2>
                <Bar data={dispatchByStoreData} />
              </div>

              {/* Graphique des magasins par catégorie */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Répartition des magasins</h2>
                <Pie data={storeByCategoryData} />
              </div>

              {/* Statistiques générales */}
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Statistiques générales</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500">Total des dispatches</h3>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{dispatchStats.total}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500">Magasins actifs</h3>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{storeStats.filter(s => s.is_active).length}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500">Produits en stock</h3>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{productStats.length}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500">Quantité totale dispatchée</h3>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">
                      {Object.values(dispatchStats.byStore).reduce((a, b) => a + b, 0)}
                    </p>
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