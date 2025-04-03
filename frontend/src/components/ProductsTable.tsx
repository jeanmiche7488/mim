'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PencilIcon, TrashIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid'
import React from 'react'

interface Product {
  id: string
  reference: string
  designation: string
  segment: string
  sous_famille: string
  pvp: number
  p_vente: string
  dispatch_mag: string
  city_sport: boolean
  go_sport: boolean
  courir: boolean
  destock: boolean
  [key: string]: string | number | boolean
}

const MAIN_COLUMNS = [
  { key: 'reference', label: 'Référence', sortable: true },
  { key: 'designation', label: 'Désignation', sortable: true },
  { key: 'segment', label: 'Segment', sortable: true },
  { key: 'sous_famille', label: 'Sous famille', sortable: true }
]

const ITEMS_PER_PAGE = 50

export default function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    reference: '',
    designation: '',
    segment: '',
    sous_famille: ''
  })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importStatus, setImportStatus] = useState<{ loading: boolean; message: string; error: boolean }>({
    loading: false,
    message: '',
    error: false
  })
  const [isSelectingAll, setIsSelectingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [currentPage, filters])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }

    setSortConfig({ key, direction })
    
    const sortedProducts = [...products].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1
      return 0
    })
    
    setProducts(sortedProducts)
  }

  const handleSelectAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      if (isSelectingAll) {
        // Sélectionner tous les produits de la base
        try {
          setLoading(true)
          const allIds = new Set<string>()
          let hasMore = true
          let page = 0
          const pageSize = 1000

          while (hasMore) {
            const { data, error } = await supabase
              .from('products')
              .select('id')
              .range(page * pageSize, (page + 1) * pageSize - 1)

            if (error) throw error
            
            if (data.length === 0) {
              hasMore = false
            } else {
              data.forEach(p => allIds.add(p.id))
              page++
            }
          }

          setSelectedRows(allIds)
        } catch (error) {
          console.error('Erreur lors de la sélection de tous les produits:', error)
        } finally {
          setLoading(false)
        }
      } else {
        // Sélectionner uniquement la page courante
        setSelectedRows(new Set(products.map(product => product.id)))
      }
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
    if (!selectedRows.size) return

    const confirmMessage = selectedRows.size === 1
      ? `Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.`
      : `Êtes-vous sûr de vouloir supprimer ces ${selectedRows.size} produits ? Cette action est irréversible.`

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true)
        setError(null)

        // Utiliser la fonction RPC delete_products
        const { data, error } = await supabase
          .rpc('delete_products', {
            product_ids: Array.from(selectedRows)
          })

        if (error) {
          console.error('Erreur lors de la suppression:', error)
          throw new Error(`Erreur lors de la suppression: ${error.message}`)
        }

        // Mettre à jour l'interface utilisateur
        setProducts(products.filter(product => !selectedRows.has(product.id)))
        setSelectedRows(new Set())

        // Rafraîchir le compte total
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })

        if (count !== null) {
          setTotalCount(count)
        }

        // Rafraîchir la liste des produits
        fetchProducts()

      } catch (error) {
        console.error('Erreur lors de la suppression multiple:', error)
        setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression')
      } finally {
        setLoading(false)
      }
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
        console.log('En-têtes trouvés:', headers)

        // Vérification des en-têtes requis
        const requiredHeadersPatterns = [
          /^R.f.rence du mod.le$/i,
          /^D.signation$/i,
          /^Segment$/i,
          /^Sous famille$/i,
          /^PVP$/i,
          /^P.Vente/i,
          /^Dispatch Mag/i,
          /^CITY SPORT$/i,
          /^GO SPORT$/i,
          /^COURIR$/i,
          /^DESTOCK$/i
        ]

        const missingHeaders = requiredHeadersPatterns.filter(pattern => 
          !headers.some(header => pattern.test(header))
        )

        if (missingHeaders.length > 0) {
          throw new Error(`En-têtes manquants dans le fichier CSV : ${missingHeaders.join(', ')}`)
        }

        const headerIndexes = {
          reference: headers.findIndex(h => /^R.f.rence du mod.le$/i.test(h)),
          designation: headers.findIndex(h => /^D.signation$/i.test(h)),
          segment: headers.findIndex(h => /^Segment$/i.test(h)),
          sous_famille: headers.findIndex(h => /^Sous famille$/i.test(h)),
          pvp: headers.findIndex(h => /^PVP$/i.test(h)),
          p_vente: headers.findIndex(h => /^P.Vente/i.test(h)),
          dispatch_mag: headers.findIndex(h => /^Dispatch Mag/i.test(h)),
          city_sport: headers.findIndex(h => /^CITY SPORT$/i.test(h)),
          go_sport: headers.findIndex(h => /^GO SPORT$/i.test(h)),
          courir: headers.findIndex(h => /^COURIR$/i.test(h)),
          destock: headers.findIndex(h => /^DESTOCK$/i.test(h))
        }

        setImportStatus({ loading: true, message: 'Traitement des données...', error: false })
        const products = rows.slice(1)
          .filter(row => row.length === headers.length && row.some(cell => cell.trim()))
          .map(row => {
            const product: any = {
              reference: row[headerIndexes.reference]?.trim(),
              designation: row[headerIndexes.designation]?.trim(),
              segment: row[headerIndexes.segment]?.trim(),
              sous_famille: row[headerIndexes.sous_famille]?.trim(),
              pvp: parseFloat(row[headerIndexes.pvp]) || 0,
              p_vente: row[headerIndexes.p_vente]?.trim(),
              dispatch_mag: row[headerIndexes.dispatch_mag]?.trim(),
              city_sport: row[headerIndexes.city_sport]?.trim() === 'X',
              go_sport: row[headerIndexes.go_sport]?.trim() === 'X',
              courir: row[headerIndexes.courir]?.trim() === 'X',
              destock: row[headerIndexes.destock]?.trim() === 'X'
            }
            return product
          })

        setImportStatus({ loading: true, message: `Validation de ${products.length} produits...`, error: false })
        const invalidProducts = products.filter(product => 
          !product.reference || !product.designation || !product.segment || !product.sous_famille
        )

        if (invalidProducts.length > 0) {
          throw new Error(`${invalidProducts.length} produits invalides (données requises manquantes)`)
        }

        setImportStatus({ loading: true, message: 'Import des produits dans la base de données...', error: false })
        const { error } = await supabase
          .from('products')
          .upsert(products, {
            onConflict: 'reference',
            ignoreDuplicates: false
          })

        if (error) {
          console.error('Erreur Supabase:', error)
          throw new Error(`Erreur lors de l'import : ${error.message}`)
        }

        setImportStatus({ loading: true, message: 'Rafraîchissement de l\'affichage...', error: false })
        await fetchProducts()
        setImportStatus({ loading: false, message: `${products.length} produits importés avec succès`, error: false })
        setTimeout(() => {
          setIsImportModalOpen(false)
          setImportStatus({ loading: false, message: '', error: false })
        }, 2000)
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

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Construire la requête avec les filtres
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        
      // Appliquer les filtres si non vides
      if (filters.reference) {
        query = query.ilike('reference', `%${filters.reference}%`)
      }
      if (filters.designation) {
        query = query.ilike('designation', `%${filters.designation}%`)
      }
      if (filters.segment) {
        query = query.ilike('segment', `%${filters.segment}%`)
      }
      if (filters.sous_famille) {
        query = query.ilike('sous_famille', `%${filters.sous_famille}%`)
      }

      // Ajouter la pagination
      const start = (currentPage - 1) * ITEMS_PER_PAGE
      const end = start + ITEMS_PER_PAGE - 1
      
      const { data, error, count } = await query
        .order('reference')
        .range(start, end)

      if (error) throw error
      
      setProducts(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Réinitialiser à la première page lors d'un changement de filtre
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const product = products.find(p => p.id === id)
    if (!product) return

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le produit "${product.reference} - ${product.designation}" ? Cette action est irréversible.`

    if (window.confirm(confirmMessage)) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)

        if (error) throw error
        setProducts(products.filter(product => product.id !== id))
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const handleDeleteDuplicates = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer les doublons ? Cette action conservera uniquement le plus ancien produit pour chaque référence.')) {
      try {
        // 1. Récupérer tous les produits triés par référence et date de création
        const { data: allProducts, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .order('reference')
          .order('created_at')

        if (fetchError) throw fetchError

        // 2. Identifier les doublons (garder le premier de chaque groupe)
        const seen = new Set()
        const duplicates = allProducts!.filter(product => {
          if (seen.has(product.reference)) {
            return true
          }
          seen.add(product.reference)
          return false
        })

        if (duplicates.length === 0) {
          alert('Aucun doublon trouvé')
          return
        }

        // 3. Supprimer les doublons
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .in('id', duplicates.map(product => product.id))

        if (deleteError) throw deleteError

        // 4. Rafraîchir la liste
        fetchProducts()
        alert(`${duplicates.length} doublon(s) supprimé(s)`)
      } catch (error) {
        console.error('Erreur lors de la suppression des doublons:', error)
        alert('Une erreur est survenue lors de la suppression des doublons')
      }
    }
  }

  const handleSave = async () => {
    if (!selectedProduct) return

    try {
      // Vérifier si la référence existe déjà sur un autre produit
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id, reference')
        .eq('reference', selectedProduct.reference)
        .neq('id', selectedProduct.id)
        .single()

      if (existingProduct) {
        alert('Un produit avec cette référence existe déjà')
        return
      }

      const { error } = await supabase
        .from('products')
        .update(selectedProduct)
        .eq('id', selectedProduct.id)

      if (error) throw error
      setProducts(products.map(product => 
        product.id === selectedProduct.id ? selectedProduct : product
      ))
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const handleAdd = async () => {
    try {
      // Vérifier si la référence existe déjà
      const { data: existingProduct } = await supabase
        .from('products')
        .select('reference')
        .eq('reference', newProduct.reference)
        .single()

      if (existingProduct) {
        alert('Un produit avec cette référence existe déjà')
        return
      }

      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()

      if (error) throw error
      if (data) {
        setProducts([...products, data[0]])
        setIsAddModalOpen(false)
        setNewProduct({})
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error)
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

  // Ajouter la sélection par page
  const handleSelectPage = () => {
    setSelectedRows(new Set(products.map(product => product.id)))
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>
  }

  return (
    <div className="ml-64 w-[calc(100%-16rem)]">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Produits</h1>
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
            Ajouter un produit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-2">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="p-4 border-b border-gray-200 grid grid-cols-4 gap-4">
          {MAIN_COLUMNS.map(({ key, label }) => (
            <div key={key} className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">
                {label}
              </label>
              <input
                type="text"
                value={filters[key as keyof typeof filters]}
                onChange={(e) => handleFilterChange(key as keyof typeof filters, e.target.value)}
                placeholder={`Filtrer par ${label.toLowerCase()}`}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between p-2 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedRows.size > 0 && selectedRows.size >= products.length}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Sélection</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectPage}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Page courante
              </button>
              <button
                onClick={() => {
                  setIsSelectingAll(true)
                  handleSelectAll({ target: { checked: true } } as any)
                }}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Tous les produits
              </button>
            </div>
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
                  onChange={handleSelectAll}
                  checked={selectedRows.size === products.length && products.length > 0}
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
            {products.length === 0 ? (
              <tr>
                <td colSpan={MAIN_COLUMNS.length + 3} className="px-4 py-3 text-center text-gray-500">
                  Aucun produit trouvé
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <React.Fragment key={product.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(product.id)}
                        onChange={() => handleSelectRow(product.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleRow(product.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {expandedRows.has(product.id) ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {product.reference}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {product.designation}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {product.segment}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {product.sous_famille}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(product.id) && (
                    <tr>
                      <td colSpan={MAIN_COLUMNS.length + 3} className="px-4 py-3 bg-gray-50">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                            <span className="text-xs font-medium text-gray-500">PVP</span>
                            <p className="mt-1 text-sm text-gray-700">{product.pvp}€</p>
                          </div>
                          <div className="col-span-1">
                            <span className="text-xs font-medium text-gray-500">Prix de vente</span>
                            <p className="mt-1 text-sm text-gray-700">{product.p_vente}</p>
                          </div>
                          <div className="col-span-1">
                            <span className="text-xs font-medium text-gray-500">Dispatch Mag</span>
                            <p className="mt-1 text-sm text-gray-700">{product.dispatch_mag}</p>
                          </div>
                          <div className="col-span-3">
                            <span className="text-xs font-medium text-gray-500">Disponibilité par magasin</span>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              <p className="text-sm text-gray-700">
                                <span className="inline-flex items-center">
                                  <span className={`h-2 w-2 rounded-full mr-2 ${product.city_sport ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                  City Sport
                                </span>
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="inline-flex items-center">
                                  <span className={`h-2 w-2 rounded-full mr-2 ${product.go_sport ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                  Go Sport
                                </span>
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="inline-flex items-center">
                                  <span className={`h-2 w-2 rounded-full mr-2 ${product.courir ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                  Courir
                                </span>
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="inline-flex items-center">
                                  <span className={`h-2 w-2 rounded-full mr-2 ${product.destock ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                  Destock
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination améliorée */}
        <div className="px-4 py-3 flex items-center justify-between border-t bg-gray-50">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> à{' '}
              <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> sur{' '}
              <span className="font-medium">{totalCount}</span> résultats
            </p>
            <div className="flex items-center gap-2">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:opacity-50"
                >
                  <span className="sr-only">Première page</span>
                  ⟪
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:opacity-50"
                >
                  <span className="sr-only">Précédent</span>
                  ⟨
                </button>
                {/* Pages */}
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNumber
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:opacity-50"
                >
                  <span className="sr-only">Suivant</span>
                  ⟩
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:opacity-50"
                >
                  <span className="sr-only">Dernière page</span>
                  ⟫
                </button>
              </nav>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Aller à la page:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page)
                    }
                  }}
                  className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[480px] max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Modifier le produit</h2>
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
                {/* Champs principaux */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.reference}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, reference: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Désignation
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.designation}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Segment
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.segment}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, segment: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Sous famille
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.sous_famille}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, sous_famille: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>

                <div className="border-t my-3"></div>

                {/* Champs secondaires */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    PVP
                  </label>
                  <input
                    type="number"
                    value={selectedProduct.pvp}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, pvp: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Prix de vente
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.p_vente}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, p_vente: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Dispatch Mag
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.dispatch_mag}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, dispatch_mag: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>

                <div className="border-t my-3"></div>

                {/* Magasins */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Magasins
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProduct.city_sport}
                        onChange={(e) => setSelectedProduct({ ...selectedProduct, city_sport: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">City Sport</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProduct.go_sport}
                        onChange={(e) => setSelectedProduct({ ...selectedProduct, go_sport: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Go Sport</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProduct.courir}
                        onChange={(e) => setSelectedProduct({ ...selectedProduct, courir: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Courir</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProduct.destock}
                        onChange={(e) => setSelectedProduct({ ...selectedProduct, destock: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Destock</span>
                    </label>
                  </div>
                </div>
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
              <h2 className="text-lg font-semibold text-gray-800">Ajouter un produit</h2>
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
                {/* Champs principaux */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={newProduct.reference || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, reference: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Désignation
                  </label>
                  <input
                    type="text"
                    value={newProduct.designation || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Segment
                  </label>
                  <input
                    type="text"
                    value={newProduct.segment || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, segment: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Sous famille
                  </label>
                  <input
                    type="text"
                    value={newProduct.sous_famille || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, sous_famille: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>

                <div className="border-t my-3"></div>

                {/* Champs secondaires */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    PVP
                  </label>
                  <input
                    type="number"
                    value={newProduct.pvp || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, pvp: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Prix de vente
                  </label>
                  <input
                    type="text"
                    value={newProduct.p_vente || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, p_vente: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Dispatch Mag
                  </label>
                  <input
                    type="text"
                    value={newProduct.dispatch_mag || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, dispatch_mag: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900"
                  />
                </div>

                <div className="border-t my-3"></div>

                {/* Magasins */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    Magasins
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.city_sport || false}
                        onChange={(e) => setNewProduct({ ...newProduct, city_sport: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">City Sport</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.go_sport || false}
                        onChange={(e) => setNewProduct({ ...newProduct, go_sport: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Go Sport</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.courir || false}
                        onChange={(e) => setNewProduct({ ...newProduct, courir: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Courir</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.destock || false}
                        onChange={(e) => setNewProduct({ ...newProduct, destock: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Destock</span>
                    </label>
                  </div>
                </div>
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
                Créer un produit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'import */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Importer des produits</h2>
              <button
                onClick={() => {
                  if (!importStatus.loading) {
                    setIsImportModalOpen(false)
                    setImportStatus({ loading: false, message: '', error: false })
                  }
                }}
                className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                disabled={importStatus.loading}
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Fichier CSV
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImportCSV(file)
                  }}
                  disabled={importStatus.loading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100
                    disabled:opacity-50"
                />
              </div>
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
              <p className="mt-2 text-sm text-gray-500">
                Le fichier CSV doit contenir les colonnes suivantes :
                <br />
                Référence du modèle, Désignation, Segment, Sous famille, PVP, P.Vente, Dispatch Mag, CITY SPORT, GO SPORT, COURIR, DESTOCK
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 