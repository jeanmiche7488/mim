'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PencilIcon, TrashIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid'
import React from 'react'

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

  useEffect(() => {
    fetchStores()
  }, [])

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(stores.map(store => store.id)))
    } else {
      setSelectedRows(new Set())
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

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedRows.size} magasin(s) ?`)) {
      try {
        const { error } = await supabase
          .from('stores')
          .delete()
          .in('id', Array.from(selectedRows))

        if (error) throw error
        
        setStores(stores.filter(store => !selectedRows.has(store.id)))
        setSelectedRows(new Set())
      } catch (error) {
        console.error('Erreur lors de la suppression multiple:', error)
      }
    }
  }

  const handleImportCSV = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const rows = text.split('\n').map(row => row.split(','))
        const headers = rows[0]
        
        const stores = rows.slice(1).map(row => {
          const store: any = {}
          headers.forEach((header, index) => {
            store[header.trim()] = row[index]?.trim()
          })
          return store
        })

        const { error } = await supabase
          .from('stores')
          .insert(stores)

        if (error) throw error
        
        fetchStores()
        setIsImportModalOpen(false)
      } catch (error) {
        console.error('Erreur lors de l\'import:', error)
      }
    }
    reader.readAsText(file)
  }

  const fetchStores = async () => {
    try {
      console.log('Début de la récupération des magasins...')
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('country')

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }
      
      console.log('Données reçues:', data)
      setStores(data || [])
    } catch (error) {
      console.error('Erreur lors de la récupération des magasins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (store: Store) => {
    setSelectedStore(store)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce magasin ?')) {
      try {
        const { error } = await supabase
          .from('stores')
          .delete()
          .eq('id', id)

        if (error) throw error
        setStores(stores.filter(store => store.id !== id))
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
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
        <div className="flex justify-end p-2 border-b">
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
                  onChange={handleSelectAll}
                  checked={selectedRows.size === stores.length && stores.length > 0}
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
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
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