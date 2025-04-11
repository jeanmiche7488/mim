'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PencilIcon, TrashIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid'
import React from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface Store {
  id: string
  country: string
  entity_category: string
  store_code: string
  brand: string
  [key: string]: any
}

const MAIN_COLUMNS = [
  { key: 'country', label: 'Pays', sortable: true },
  { key: 'entity_category', label: 'Catégorie Entité', sortable: true },
  { key: 'store_code', label: 'Code Entité', sortable: true },
  { key: 'brand', label: 'Enseigne', sortable: true }
]

const ITEMS_PER_PAGE = 10
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

export default function StoresTable() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newStore, setNewStore] = useState<Partial<Store>>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState({
    country: '',
    entity_category: '',
    store_code: '',
    brand: ''
  })
  const [tempFilters, setTempFilters] = useState(filters)
  const [importStatus, setImportStatus] = useState<{ loading: boolean; message: string; error: boolean }>({
    loading: false,
    message: '',
    error: false
  })
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSelectingAll, setIsSelectingAll] = useState(false)
  const [selectAllStatus, setSelectAllStatus] = useState<{ loading: boolean; message: string }>({
    loading: false,
    message: ''
  })
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0])

  // Utiliser useDebounce pour les filtres
  const debouncedFilters = useDebounce(tempFilters, 500)

  // Mettre à jour les filtres réels quand les filtres debounced changent
  useEffect(() => {
    setFilters(debouncedFilters)
  }, [debouncedFilters])

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  useEffect(() => {
    fetchStores()
  }, [currentPage, filters, itemsPerPage])

  const fetchStores = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('stores')
        .select('*', { count: 'exact' })

      // Appliquer les filtres
      if (filters.country) {
        query = query.ilike('country', `%${filters.country}%`)
      }
      if (filters.entity_category) {
        query = query.ilike('entity_category', `%${filters.entity_category}%`)
      }
      if (filters.store_code) {
        query = query.ilike('store_code', `%${filters.store_code}%`)
      }
      if (filters.brand) {
        query = query.ilike('brand', `%${filters.brand}%`)
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setStores(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Erreur lors de la récupération des magasins:', error)
      setError('Une erreur est survenue lors de la récupération des magasins')
    } finally {
      setLoading(false)
    }
  }

  const handleImportCSV = async (file: File) => {
    setImportStatus({ loading: true, message: 'Lecture du fichier...', error: false })
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const rows = text.split('\n').map(row => row.split(';'))
        const headers = rows[0].map(header => header.trim())
        
        setImportStatus({ loading: true, message: 'Vérification des en-têtes...', error: false })

        // Vérification des en-têtes requis
        const requiredHeaders = ['country', 'entity_category', 'store_code', 'brand']
        const missingHeaders = requiredHeaders.filter(header => 
          !headers.some(h => h.toLowerCase() === header.toLowerCase())
        )

        if (missingHeaders.length > 0) {
          throw new Error(`En-têtes manquants dans le fichier CSV : ${missingHeaders.join(', ')}`)
        }

        const headerIndexes = {
          country: headers.findIndex(h => h.toLowerCase() === 'country'),
          entity_category: headers.findIndex(h => h.toLowerCase() === 'entity_category'),
          store_code: headers.findIndex(h => h.toLowerCase() === 'store_code'),
          brand: headers.findIndex(h => h.toLowerCase() === 'brand')
        }

        setImportStatus({ loading: true, message: 'Traitement des données...', error: false })
        const stores = rows.slice(1)
          .filter(row => row.length === headers.length && row.some(cell => cell.trim()))
          .map(row => {
            const store: any = {
              country: row[headerIndexes.country]?.trim(),
              entity_category: row[headerIndexes.entity_category]?.trim(),
              store_code: row[headerIndexes.store_code]?.trim(),
              brand: row[headerIndexes.brand]?.trim()
            }
            return store
          })

        setImportStatus({ loading: true, message: `Validation de ${stores.length} magasins...`, error: false })
        const invalidStores = stores.filter(store => 
          !store.country || !store.entity_category || !store.store_code || !store.brand
        )

        if (invalidStores.length > 0) {
          throw new Error(`${invalidStores.length} magasins invalides (données requises manquantes)`)
        }

        // Vérifier les doublons avant l'import
        const { data: existingStores } = await supabase
          .from('stores')
          .select('store_code')
          .in('store_code', stores.map(s => s.store_code))

        const existingCodes = new Set(existingStores?.map(s => s.store_code) || [])
        const storesToInsert = stores.filter(s => !existingCodes.has(s.store_code))
        const duplicateCount = stores.length - storesToInsert.length

        if (duplicateCount > 0) {
          setImportStatus({ 
            loading: true, 
            message: `${duplicateCount} magasin(s) déjà existant(s) seront ignoré(s). ${storesToInsert.length} nouveau(x) magasin(s) seront importé(s).`, 
            error: false 
          })
        }

        setImportStatus({ loading: true, message: 'Import des magasins dans la base de données...', error: false })
        if (storesToInsert.length > 0) {
          const { error } = await supabase
            .from('stores')
            .insert(storesToInsert)

          if (error) {
            console.error('Erreur Supabase:', error)
            if (error.code === '23505') { // Code d'erreur pour violation de contrainte unique
              setImportStatus({ 
                loading: false, 
                message: `Erreur : ${duplicateCount} magasin(s) déjà existant(s) dans la base. Aucun nouveau magasin n'a été importé.`, 
                error: true 
              })
            } else {
              throw new Error(`Erreur lors de l'import : ${error.message}`)
            }
            return
          }
        }

        setImportStatus({ loading: true, message: 'Rafraîchissement de l\'affichage...', error: false })
        await fetchStores()
        
        if (duplicateCount > 0) {
          setImportStatus({ 
            loading: false, 
            message: `Import partiel : ${storesToInsert.length} nouveau(x) magasin(s) importé(s), ${duplicateCount} magasin(s) déjà existant(s) ignoré(s).`, 
            error: true 
          })
        } else {
          setImportStatus({ 
            loading: false, 
            message: `${storesToInsert.length} magasin(s) importé(s) avec succès`, 
            error: false 
          })
        }
        
        setTimeout(() => {
          setIsImportModalOpen(false)
          setImportStatus({ loading: false, message: '', error: false })
        }, 3000)
      } catch (error) {
        console.error('Erreur lors de l\'import:', error)
        setImportStatus({ 
          loading: false, 
          message: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'import',
          error: true 
        })
      }
    }
    reader.readAsText(file, 'ISO-8859-1')
  }

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedRows.size} magasin(s) ? Cette action est irréversible.`)) {
      try {
        const { error } = await supabase
          .from('stores')
          .delete()
          .in('id', Array.from(selectedRows))

        if (error) throw error
        
        setStores(stores.filter(store => !selectedRows.has(store.id)))
        setSelectedRows(new Set())
        await fetchStores()
      } catch (error) {
        console.error('Erreur lors de la suppression multiple:', error)
        setError('Une erreur est survenue lors de la suppression des magasins')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce magasin ? Cette action est irréversible.')) {
      try {
        const { error } = await supabase
          .from('stores')
          .delete()
          .eq('id', id)

        if (error) throw error
        setStores(stores.filter(store => store.id !== id))
        await fetchStores()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        setError('Une erreur est survenue lors de la suppression du magasin')
      }
    }
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }

    setSortConfig({ key, direction })
    
    const sortedStores = [...stores].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1
      return 0
    })
    
    setStores(sortedStores)
  }

  const handleSelectPage = () => {
    const pageStoreIds = stores.map(store => store.id)
    const allPageStoresSelected = pageStoreIds.every(id => selectedRows.has(id))
    
    if (allPageStoresSelected) {
      // Désélectionner les magasins de la page courante
      const newSelectedRows = new Set(selectedRows)
      pageStoreIds.forEach(id => newSelectedRows.delete(id))
      setSelectedRows(newSelectedRows)
    } else {
      // Sélectionner tous les magasins de la page courante
      const newSelectedRows = new Set(selectedRows)
      pageStoreIds.forEach(id => newSelectedRows.add(id))
      setSelectedRows(newSelectedRows)
    }
  }

  const handleSelectAll = async () => {
    const allStoresSelected = selectedRows.size === totalCount
    
    if (allStoresSelected) {
      // Désélectionner tous les magasins
      setSelectedRows(new Set())
      setSelectAllStatus({ loading: false, message: '' })
      return
    }

    setIsSelectingAll(true)
    setSelectAllStatus({ loading: true, message: 'Sélection des magasins en cours...' })
    
    try {
      // D'abord sélectionner les magasins visibles
      const visibleStoreIds = stores.map(store => store.id)
      setSelectedRows(new Set(visibleStoreIds))
      
      // Ensuite, récupérer tous les IDs de la base
      let allStoreIds = new Set<string>(visibleStoreIds)
      let offset = 0
      const batchSize = 1000
      
      while (true) {
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .range(offset, offset + batchSize - 1)
        
        if (error) throw error
        if (!data || data.length === 0) break
        
        data.forEach(store => allStoreIds.add(store.id))
        offset += batchSize
      }
      
      setSelectedRows(allStoreIds)
      setSelectAllStatus({ loading: false, message: `Tous les magasins (${allStoreIds.size}) ont été sélectionnés` })
    } catch (error) {
      console.error('Erreur lors de la sélection de tous les magasins:', error)
      setSelectAllStatus({ loading: false, message: 'Erreur lors de la sélection des magasins' })
    } finally {
      setIsSelectingAll(false)
      setTimeout(() => {
        setSelectAllStatus({ loading: false, message: '' })
      }, 3000)
    }
  }

  const handleSelectRow = (id: string) => {
    const newSelectedRows = new Set(selectedRows)
    if (newSelectedRows.has(id)) {
      newSelectedRows.delete(id)
    } else {
      newSelectedRows.add(id)
    }
    setSelectedRows(newSelectedRows)
  }

  const handleEdit = (store: Store) => {
    setSelectedStore(store)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!selectedStore) return

    try {
      const { error } = await supabase
        .from('stores')
        .update(selectedStore)
        .eq('id', selectedStore.id)

      if (error) throw error
      setStores(stores.map(store => 
        store.id === selectedStore.id ? selectedStore : store
      ))
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const handleAdd = async () => {
    try {
      // Vérifier si le code entité existe déjà
      const { data: existingStore } = await supabase
        .from('stores')
        .select('store_code')
        .eq('store_code', newStore.store_code)
        .single()

      if (existingStore) {
        alert('Un magasin avec ce code entité existe déjà')
        return
      }

      const { data, error } = await supabase
        .from('stores')
        .insert([newStore])
        .select()

      if (error) throw error
      if (data) {
        setStores([...stores, data[0]])
        setIsAddModalOpen(false)
        setNewStore({})
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error)
    }
  }

  const handleDeleteDuplicates = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer les doublons ? Cette action conservera uniquement le plus ancien magasin pour chaque code entité.')) {
      try {
        // 1. Récupérer tous les magasins triés par code entité et date de création
        const { data: allStores, error: fetchError } = await supabase
          .from('stores')
          .select('*')
          .order('store_code')
          .order('created_at')

        if (fetchError) throw fetchError

        // 2. Identifier les doublons (garder le premier de chaque groupe)
        const seen = new Set()
        const duplicates = allStores!.filter(store => {
          if (seen.has(store.store_code)) {
            return true
          }
          seen.add(store.store_code)
          return false
        })

        if (duplicates.length === 0) {
          alert('Aucun doublon trouvé')
          return
        }

        // 3. Supprimer les doublons
        const { error: deleteError } = await supabase
          .from('stores')
          .delete()
          .in('id', duplicates.map(store => store.id))

        if (deleteError) throw deleteError

        // 4. Rafraîchir la liste
        fetchStores()
        alert(`${duplicates.length} doublon(s) supprimé(s)`)
      } catch (error) {
        console.error('Erreur lors de la suppression des doublons:', error)
        alert('Une erreur est survenue lors de la suppression des doublons')
      }
    }
  }

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id)
    } else {
      newExpandedRows.add(id)
    }
    setExpandedRows(newExpandedRows)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>
  }

  return (
    <div className="ml-64 w-[calc(100%-16rem)]">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Magasins</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDeleteDuplicates}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-700 transition-colors"
          >
            <TrashIcon className="h-5 w-5" />
            Supprimer les doublons
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Importer CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Ajouter un magasin
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-2">
        <div className="p-4 border-b border-gray-200 grid grid-cols-4 gap-4">
          {MAIN_COLUMNS.map(({ key, label }) => (
            <div key={key} className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">
                {label}
              </label>
              <input
                type="text"
                value={tempFilters[key as keyof typeof filters]}
                onChange={(e) => handleFilterChange(key as keyof typeof filters, e.target.value)}
                placeholder={`Filtrer par ${label.toLowerCase()}`}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between p-2 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedRows.size > 0}
                onChange={() => {
                  if (selectedRows.size > 0) {
                    setSelectedRows(new Set())
                    setSelectAllStatus({ loading: false, message: '' })
                  } else {
                    handleSelectPage()
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Sélection</span>
              <button
                onClick={handleSelectPage}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              >
                Page courante
              </button>
              <button
                onClick={handleSelectAll}
                disabled={isSelectingAll}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
              >
                Tous les magasins
              </button>
            </div>
            {selectAllStatus.message && (
              <div className="text-sm text-gray-600">
                {selectAllStatus.loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {selectAllStatus.message}
                  </div>
                ) : (
                  selectAllStatus.message
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Afficher</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="rounded-md border-gray-300 text-sm font-medium text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            >
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600">magasins par page</span>
          </div>
          {selectedRows.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
            >
              <TrashIcon className="h-4 w-4" />
              Supprimer la sélection ({selectedRows.size})
            </button>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 w-8">
                <input
                  type="checkbox"
                  checked={selectedRows.size === stores.length && stores.length > 0}
                  onChange={() => {
                    if (selectedRows.size > 0) {
                      setSelectedRows(new Set())
                      setSelectAllStatus({ loading: false, message: '' })
                    } else {
                      handleSelectPage()
                    }
                  }}
                  disabled={isSelectingAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                Détails
              </th>
              {MAIN_COLUMNS.map(({ key, label, sortable }) => (
                <th
                  key={key}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => sortable && handleSort(key)}
                >
                  <div className="flex items-center gap-1">
                  {label}
                    {sortable && sortConfig?.key === key && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4" /> : 
                        <ArrowDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={MAIN_COLUMNS.length + 3} className="px-4 py-3 text-center text-gray-500">
                  Aucun magasin trouvé
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <React.Fragment key={store.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(store.id)}
                        onChange={() => handleSelectRow(store.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap w-10">
                      <button
                        onClick={() => toggleRow(store.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandedRows.has(store.id) ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                {MAIN_COLUMNS.map(({ key }) => (
                      <td key={key} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                    {store[key] || '-'}
                  </td>
                ))}
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium w-20">
                      <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(store)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Modifier"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(store.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                  </button>
                      </div>
                </td>
              </tr>
                  {expandedRows.has(store.id) && (
                    <tr>
                      <td colSpan={MAIN_COLUMNS.length + 3} className="px-4 py-3 bg-gray-50">
                        <div className="grid grid-cols-3 gap-4">
                          {Object.entries(store)
                            .filter(([key]) => !MAIN_COLUMNS.some(col => col.key === key) && key !== 'id')
                            .map(([key, value]) => (
                              <div key={key} className="col-span-1">
                                <span className="text-xs font-medium text-gray-500">
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <p className="mt-1 text-sm text-gray-700">{value || '-'}</p>
                              </div>
                            ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / itemsPerPage)))}
              disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span> à{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> sur{' '}
                <span className="font-medium">{totalCount}</span> magasins
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Première page</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Précédent</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1)
                  .filter(page => {
                    if (page === 1 || page === Math.ceil(totalCount / itemsPerPage)) return true
                    if (Math.abs(page - currentPage) <= 2) return true
                    return false
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Suivant</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(Math.ceil(totalCount / itemsPerPage))}
                  disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Dernière page</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'import CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[480px] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Importer des magasins</h2>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleImportCSV(e.target.files[0])}
                disabled={importStatus.loading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100
                  disabled:opacity-50"
              />
              {importStatus.message && (
                <div className={`mt-4 p-4 rounded-md ${
                  importStatus.error ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  <div className="flex items-center">
                    {importStatus.loading && (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <p>{importStatus.message}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t p-4 flex justify-end gap-3">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {isModalOpen && selectedStore && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[480px] max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Modifier le magasin</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Corps de la modale avec scroll */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                {MAIN_COLUMNS.map(({ key, label }) => (
                  <div key={key} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={selectedStore[key] || ''}
                      onChange={(e) => setSelectedStore({
                        ...selectedStore,
                        [key]: e.target.value
                      })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                    />
                  </div>
                ))}

                <div className="border-t my-3"></div>

                {Object.entries(selectedStore)
                  .filter(([key]) => !MAIN_COLUMNS.some(col => col.key === key) && key !== 'id')
                  .map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => setSelectedStore({
                          ...selectedStore,
                          [key]: e.target.value
                        })}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer avec les boutons */}
            <div className="border-t p-4 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[480px] max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Ajouter un magasin</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Corps de la modale avec scroll */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                {MAIN_COLUMNS.map(({ key, label }) => (
                  <div key={key} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={newStore[key] || ''}
                      onChange={(e) => setNewStore({
                        ...newStore,
                        [key]: e.target.value
                      })}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                    />
                  </div>
                ))}

                <div className="border-t my-3"></div>

                {/* Champs additionnels si nécessaire */}
                {Object.entries(stores[0] || {})
                  .filter(([key]) => !MAIN_COLUMNS.some(col => col.key === key) && key !== 'id')
                  .map(([key]) => (
                    <div key={key} className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={newStore[key] || ''}
                        onChange={(e) => setNewStore({
                          ...newStore,
                          [key]: e.target.value
                        })}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer avec les boutons */}
            <div className="border-t p-4 flex justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Créer un magasin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 