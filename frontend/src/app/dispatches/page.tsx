'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Navigation from '@/components/Navigation'
import CreateDispatchModal from '@/components/CreateDispatchModal'
import { TrashIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, PencilIcon, ArrowDownTrayIcon } from '@heroicons/react/20/solid'
import { useDebounce } from '@/hooks/useDebounce'
import { DispatchStatus } from '@/types/common'

interface Dispatch {
  id: string
  name: string
  created_at: string
  status: DispatchStatus
  target_revenue: number
}

const ITEMS_PER_PAGE = 10
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export default function DispatchesPage() {
  const router = useRouter()
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: keyof Dispatch; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE)
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    date: ''
  })
  const [tempFilters, setTempFilters] = useState(filters)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [dispatchToDelete, setDispatchToDelete] = useState<Dispatch | null>(null)
  const [dispatchToEdit, setDispatchToEdit] = useState<Dispatch | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Utiliser useDebounce pour les filtres
  const debouncedFilters = useDebounce(tempFilters, 500)

  const fetchDispatches = async () => {
    try {
      console.log('Chargement des dispatches...')
      
      // Charger les données complètes
      let query = supabase
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
        `, { count: 'exact' })

      // Appliquer les filtres
      if (debouncedFilters.name) {
        query = query.ilike('name', `%${debouncedFilters.name}%`)
      }
      if (debouncedFilters.status) {
        query = query.eq('status', debouncedFilters.status)
      }
      if (debouncedFilters.date) {
        query = query.gte('created_at', debouncedFilters.date)
      }

      // Appliquer le tri
      if (sortConfig) {
        query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Appliquer la pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Erreur Supabase lors du chargement:', error)
        throw error
      }

      console.log('Dispatches chargés:', data)
      setDispatches(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Erreur lors de la récupération des dispatches:', error)
      setError('Erreur lors du chargement des dispatches')
      setDispatches([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

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
    fetchDispatches()
  }, [currentPage, itemsPerPage, sortConfig, debouncedFilters])

  const handleSort = (key: keyof Dispatch) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      return {
        key,
        direction: 'asc'
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedRows.size === dispatches.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(dispatches.map(d => d.id)))
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return

    try {
      setIsLoading(true)
      console.log('Suppression des dispatches:', Array.from(selectedRows))
      
      // Supprimer d'abord les enregistrements associés dans stock_to_dispatch
      const { error: stockError } = await supabase
        .from('stock_to_dispatch')
        .delete()
        .in('distribution_id', Array.from(selectedRows))

      if (stockError) {
        console.error('Erreur Supabase lors de la suppression des stocks:', stockError)
        throw stockError
      }

      // Puis supprimer les dispatches
      const { error } = await supabase
        .from('stock_to_dispatch')
        .delete()
        .in('id', Array.from(selectedRows))

      if (error) {
        console.error('Erreur Supabase lors de la suppression:', error)
        throw error
      }

      // Recharger les données depuis Supabase
      await fetchDispatches()
      
      // Réinitialiser la sélection
      setSelectedRows(new Set())
      
      // Fermer la modale
      setShowDeleteModal(false)
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setError('Erreur lors de la suppression des dispatches')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDispatch = async (dispatch: Dispatch) => {
    setDispatchToDelete(dispatch)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!dispatchToDelete) return

    try {
      setIsLoading(true)
      console.log('Suppression du dispatch:', dispatchToDelete.id)
      
      // Supprimer le dispatch
      const { data: deleteData, error } = await supabase
        .from('stock_to_dispatch')
        .delete()
        .eq('id', dispatchToDelete.id)
        .select()

      if (error) {
        console.error('Erreur Supabase lors de la suppression:', error)
        throw error
      }

      console.log('Résultat de la suppression:', deleteData)

      // Supprimer aussi les enregistrements associés dans stock_to_dispatch
      const { error: stockError } = await supabase
        .from('stock_to_dispatch')
        .delete()
        .eq('distribution_id', dispatchToDelete.id)

      if (stockError) {
        console.error('Erreur Supabase lors de la suppression des stocks:', stockError)
        throw stockError
      }

      // Vérifier que la suppression a bien été effectuée
      const { data: checkData, error: checkError } = await supabase
        .from('stock_to_dispatch')
        .select('*')
        .eq('id', dispatchToDelete.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification:', checkError)
        throw checkError
      }

      if (checkData) {
        console.error('Le dispatch existe toujours après la suppression')
        throw new Error('La suppression a échoué')
      }

      // Vider l'état local
      setDispatches([])
      setTotalCount(0)
      
      // Réinitialiser la page à 1
      setCurrentPage(1)
      
      // Forcer un rechargement complet
      window.location.reload()
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setError('Erreur lors de la suppression du dispatch')
    } finally {
      setIsLoading(false)
      setShowDeleteModal(false)
      setDispatchToDelete(null)
    }
  }

  const handleEditDispatch = (dispatch: Dispatch) => {
    setDispatchToEdit(dispatch)
    setIsCreateModalOpen(true)
  }

  const handleExportDispatch = (dispatch: Dispatch) => {
    // TODO: Implémenter l'export du dispatch
    console.log('Export du dispatch:', dispatch)
  }

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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="pl-64">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Gestion des Dispatches</h1>
              <div className="flex gap-2">
                {selectedRows.size > 0 && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                    Supprimer ({selectedRows.size})
                  </button>
                )}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  Nouveau Dispatch
                </button>
              </div>
            </div>

            {/* Filtres */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={tempFilters.name}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Filtrer par nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={tempFilters.status}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Tous</option>
                    <option value="draft">Brouillon</option>
                    <option value="ready">Prêt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={tempFilters.date}
                    onChange={(e) => setTempFilters(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === dispatches.length && dispatches.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Nom
                        {sortConfig?.key === 'name' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUpIcon className="h-4 w-4" /> : 
                            <ArrowDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortConfig?.key === 'created_at' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUpIcon className="h-4 w-4" /> : 
                            <ArrowDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Statut
                        {sortConfig?.key === 'status' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUpIcon className="h-4 w-4" /> : 
                            <ArrowDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('target_revenue')}
                    >
                      <div className="flex items-center gap-1">
                        CA Cible
                        {sortConfig?.key === 'target_revenue' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUpIcon className="h-4 w-4" /> : 
                            <ArrowDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dispatches.map((dispatch) => (
                    <tr key={dispatch.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(dispatch.id)}
                          onChange={() => handleSelectRow(dispatch.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispatch.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(dispatch.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispatch.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(dispatch.target_revenue || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditDispatch(dispatch)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleExportDispatch(dispatch)}
                            className="text-green-600 hover:text-green-900"
                            title="Exporter"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDispatch(dispatch)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage * itemsPerPage >= totalCount}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Affichage de{' '}
                      <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span>
                      {' '}à{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
                      {' '}sur{' '}
                      <span className="font-medium">{totalCount}</span>
                      {' '}résultats
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <label htmlFor="items-per-page" className="mr-2 text-sm text-gray-700">
                        Par page:
                      </label>
                      <select
                        id="items-per-page"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        {ITEMS_PER_PAGE_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Premier</span>
                        «
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Précédent</span>
                        ‹
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage * itemsPerPage >= totalCount}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Suivant</span>
                        ›
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.ceil(totalCount / itemsPerPage))}
                        disabled={currentPage * itemsPerPage >= totalCount}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Dernier</span>
                        »
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de création */}
      <CreateDispatchModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setDispatchToEdit(null)
        }}
        onDispatchCreated={(dispatch) => {
          console.log('Dispatch créé:', dispatch)
          setDispatches(prev => [...prev, dispatch])
          setIsCreateModalOpen(false)
        }}
        existingDispatch={dispatchToEdit ? {
          id: dispatchToEdit.id,
          name: dispatchToEdit.name,
          status: dispatchToEdit.status
        } : undefined}
      />

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Confirmer la suppression</h2>
            <p className="mb-4 text-gray-700">
              {dispatchToDelete ? (
                <>Êtes-vous sûr de vouloir supprimer le dispatch "{dispatchToDelete.name}" ?</>
              ) : (
                <>Êtes-vous sûr de vouloir supprimer {selectedRows.size} dispatch{selectedRows.size > 1 ? 'es' : ''} ?</>
              )}
              <span className="block mt-2 text-red-600">Cette action est irréversible.</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDispatchToDelete(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => dispatchToDelete ? confirmDelete() : handleDeleteSelected()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 