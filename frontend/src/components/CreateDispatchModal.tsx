'use client'

import { useState, useRef, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { DispatchStatus } from '@/types/common'
import { Editor } from '@monaco-editor/react'
import { useRouter } from 'next/navigation'

interface StockToDispatch {
  id: string
  name: string
  status: DispatchStatus
  parameters_id: string
  created_by: string
  created_at: string
  updated_at: string
}

interface CreateDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  onDispatchCreated: (dispatch: StockToDispatch) => void
  existingDispatch?: StockToDispatch
}

type Step = 'name' | 'file' | 'calculation' | 'model'

interface DispatchState {
    name: string
  file: File | null
  dispatchId: string | null
  error: string | null
  success: string | null
  isLoading: boolean
  progress: number
  calculationProgress: number
  calculationComplete: boolean
  pythonScript: string
  scriptSaved: boolean
  distributionId: string | null
  csvFilename: string | null
  distributionSuccess: boolean
}

interface Product {
  id: string
  reference: string
  designation: string
}

interface Parameters {
  id: string
  min_reference_quantity: number
  min_ean_quantity: number
    status: string
  created_at: string
}

interface StockToDispatchItem {
  id: string
  product_id: string | null
  quantity: number
  reference_not_found: boolean
  products: Product
  ean_code: string
  size: string
  expedition_date: string | null
  nb_max_store_m4_ref: number
  nb_max_store_m5_ean: number
  nb_max_store_final: number
  calculation_completed: boolean
}

interface StockData {
  id: string
  parameters: Parameters
  stock_to_dispatch_items: StockToDispatchItem[]
}

interface SupabaseStockData {
  id: string
  parameters: Parameters
  stock_to_dispatch_items: {
    id: string
    product_id: string | null
    quantity: number
    reference_not_found: boolean
    products: Product
    ean_code: string
    size: string
    expedition_date: string | null
    nb_max_store_m4_ref: number
    nb_max_store_m5_ean: number
    nb_max_store_final: number
  }[]
}

interface PythonScript {
  id?: string
  stock_to_dispatch_id: string
  name: string
  description: string
  code: string
}

export default function CreateDispatchModal({ isOpen, onClose, existingDispatch }: CreateDispatchModalProps) {
  const [step, setStep] = useState<Step>(existingDispatch ? 'calculation' : 'name')
  const [state, setState] = useState<DispatchState>({
    name: existingDispatch?.name || generateDefaultName(),
    file: null,
    dispatchId: existingDispatch?.id || null,
    error: null,
    success: null,
    isLoading: false,
    progress: 0,
    calculationProgress: 0,
    calculationComplete: false,
    pythonScript: '',
    scriptSaved: false,
    distributionId: null,
    csvFilename: null,
    distributionSuccess: false
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [activeParameters, setActiveParameters] = useState<Parameters | null>(null)
  const router = useRouter()

  // Fonction de conversion de date
  function convertDateFormat(dateStr: string | null): string | null {
    if (!dateStr) return null;
    
    // Vérifier si la date est au format DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    
    // Convertir au format YYYY-MM-DD
    return `${year}-${month}-${day}`;
  }

  // Générer un nom par défaut avec la date et l'heure
  function generateDefaultName() {
    const now = new Date()
    return `Dispatch ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  // Ajouter cette fonction de conversion de date après generateDefaultName
  // Mettre à jour l'état de manière sûre
  const updateState = (updates: Partial<DispatchState>) => {
    setState(current => ({ ...current, ...updates }))
  }

  // Réinitialiser l'état
  const resetState = () => {
    setState({
      name: existingDispatch?.name || generateDefaultName(),
      file: null,
      dispatchId: existingDispatch?.id || null,
      error: null,
      success: null,
      isLoading: false,
      progress: 0,
      calculationProgress: 0,
      calculationComplete: false,
      pythonScript: '',
      scriptSaved: false,
      distributionId: null,
      csvFilename: null,
      distributionSuccess: false
    })
    setStep(existingDispatch ? 'calculation' : 'name')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Créer un stock_to_dispatch
  const createStockToDispatch = async (shouldClose: boolean = false) => {
    console.log('Début de createStockToDispatch')
    if (!state.name.trim()) {
      console.log('Erreur: nom vide')
      updateState({ error: 'Le nom est obligatoire' })
      return null
    }

    try {
      console.log('Récupération des données...')
      updateState({ isLoading: true, error: null })

      // Récupérer les paramètres actifs et le script Python actif en parallèle
      const [paramsResponse, scriptResponse, userResponse] = await Promise.all([
        supabase.from('parameters').select('*').eq('status', 'active').single(),
        supabase.from('python_scripts').select('*').eq('status', 'active').single(),
        supabase.auth.getUser()
      ])

      console.log('Réponses reçues:', {
        params: paramsResponse,
        script: scriptResponse,
        user: userResponse
      })

      if (paramsResponse.error) {
        console.error('Erreur paramètres:', paramsResponse.error)
        throw new Error('Aucun paramètre actif trouvé')
      }

      if (scriptResponse.error) {
        console.error('Erreur script:', scriptResponse.error)
        throw new Error('Aucun script Python actif trouvé')
      }

      if (userResponse.error || !userResponse.data.user) {
        console.error('Erreur utilisateur:', userResponse.error)
        throw new Error('Utilisateur non authentifié')
      }

      const params = paramsResponse.data
      const activeScript = scriptResponse.data
      const user = userResponse.data.user

      console.log('Données récupérées:', {
        params,
        activeScript,
        user
      })

      // Créer le dispatch avec le lien vers le script Python
      const { data: dispatch, error: dispatchError } = await supabase
        .from('stock_to_dispatch')
        .insert({
          name: state.name,
          parameters_id: params.id,
          created_by: user.id,
          status: 'pending',
          python_script_id: activeScript.id
        })
        .select()
        .single()

      console.log('Résultat création dispatch:', { dispatch, error: dispatchError })

      if (dispatchError) {
        console.error('Erreur création dispatch:', dispatchError)
        throw dispatchError
      }

      updateState({ dispatchId: dispatch.id })

      if (shouldClose) {
        console.log('Fermeture de la modal')
        onClose()
      } else {
        console.log('Passage à l\'étape suivante')
        setStep('file')
      }

      return dispatch.id
    } catch (error) {
      console.error('Erreur finale:', error)
      updateState({ 
        error: error instanceof Error ? error.message : 'Une erreur est survenue' 
      })
      return null
    } finally {
      updateState({ isLoading: false })
    }
  }

  // Gérer le changement de fichier
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    updateState({ 
      file: file || null,
      error: null
    })
  }

  // Traiter le fichier CSV et créer les stock_to_dispatch_items
  const processFile = async (shouldClose: boolean = false) => {
    if (!state.file || !state.dispatchId) {
      updateState({ error: 'Veuillez sélectionner un fichier' })
      return
    }

    try {
      updateState({ isLoading: true, error: null, progress: 0 })

      const text = await state.file.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        throw new Error('Le fichier est vide ou ne contient que l\'en-tête')
      }

      const headers = lines[0].split(';').map(h => h.trim())
      
      const rows = lines.slice(1).map(line => {
        const values = line.split(';').map(v => v.trim())
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || ''
          return obj
        }, {} as Record<string, string>)
      })

      // Récupérer toutes les références uniques et les convertir en string
      const references = [...new Set(rows.map(row => {
        const ref = row['Référence du modèle']
        return String(ref).trim()
      }))]
      
      // Récupérer les produits correspondants
      const { data: products, error: productsError } = await supabase
          .from('products')
        .select('id, reference')
        .in('reference', references)

      if (productsError) {
        throw new Error('Erreur lors de la récupération des produits')
      }

      // Créer la map avec les références converties en string
      const referenceToId = new Map(
        products.map(p => [String(p.reference).trim(), p.id])
      )

      // Identifier les références non trouvées
      const notFoundReferences = references.filter(ref => !referenceToId.has(ref))

      // Préparer les items à insérer
      const items = rows.map(row => {
        const ref = String(row['Référence du modèle']).trim()
        const item = {
          stock_to_dispatch_id: state.dispatchId,
          product_id: referenceToId.get(ref),
          ean_code: String(row['Code EAN'] || '').replace(/\s+/g, '').trim(),
          size: String(row['Taille'] || '').trim(),
          quantity: parseInt(row['Quantités BL']) || 0,
          expedition_date: convertDateFormat(row['Date Expe']),
          reference_not_found: !referenceToId.has(ref)
        }
        return item
      })

      if (items.length === 0) {
        throw new Error('Aucun item valide trouvé dans le fichier')
      }

      // Insérer les items par lots
      const batchSize = 100
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const { data: insertData, error: insertError } = await supabase
          .from('stock_to_dispatch_items')
          .insert(batch)
          .select()

        if (insertError) {
          throw new Error(`Erreur d'insertion: ${insertError.message}`)
        }

        updateState({ 
          progress: Math.round((i + batch.length) / items.length * 100) 
        })
      }

      // Si des références n'ont pas été trouvées, créer et télécharger un fichier CSV
      if (notFoundReferences.length > 0) {
        const csvContent = [
          'Référence',
          ...notFoundReferences
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `references_non_trouvees_${new Date().toISOString()}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        updateState({
          error: `${notFoundReferences.length} référence(s) non trouvée(s). Un fichier CSV a été téléchargé avec la liste.`
        })
      }

      // Mettre à jour le statut après l'insertion des items
      const { error: statusError } = await supabase
        .from('stock_to_dispatch')
        .update({ status: 'max_shops_calculated' })
        .eq('id', state.dispatchId)

      if (statusError) {
        throw statusError
      }

      if (shouldClose) {
        onClose()
      } else {
        setStep('calculation')
      }
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      })
    } finally {
      updateState({ isLoading: false })
    }
  }

  // Calculer les champs nb_max_store
  const calculateMaxStores = async () => {
    if (!state.dispatchId) return

    try {
      updateState({ isLoading: true, error: null, calculationProgress: 0 })

      // 0. Charger les paramètres actifs si pas déjà chargés
      if (!activeParameters) {
        const { data: params, error: paramsError } = await supabase
          .from('parameters')
          .select('*')
          .eq('status', 'active')
          .single()

        if (paramsError) throw new Error('Aucun paramètre actif trouvé')
        if (!params) throw new Error('Aucun paramètre actif trouvé')
        
        setActiveParameters(params)
      }

      // 1. Récupérer tous les items
      const { data: items, error: itemsError } = await supabase
        .from('stock_to_dispatch_items')
        .select(`
          id,
          product_id,
          ean_code,
          size,
          quantity,
          products (
            reference,
            designation
          )
        `)
        .eq('stock_to_dispatch_id', state.dispatchId)

      if (itemsError) throw new Error('Erreur lors de la récupération des items')
      
      if (!items || items.length === 0) {
        throw new Error('Aucun item trouvé pour ce dispatch')
      }

      // 2. Vérifier que les paramètres sont bien chargés
      if (!activeParameters) {
        throw new Error('Les paramètres actifs n\'ont pas pu être chargés')
      }

      // 3. Calculer nb_max_store pour chaque item
      const totalItems = items.length
      let processedItems = 0

      for (const item of items) {
        try {
          // Calcul pour la référence (M4)
          const totalQuantityForReference = items
            .filter(i => i.product_id === item.product_id)
            .reduce((sum, i) => sum + i.quantity, 0)

          const nbMaxStoreM4 = Math.floor(totalQuantityForReference / activeParameters.min_reference_quantity)

          // Calcul pour l'EAN (M5)
          const nbMaxStoreM5 = Math.floor(item.quantity / activeParameters.min_ean_quantity)

          // Mettre à jour l'item avec les valeurs calculées
          const { data: updateData, error: updateError } = await supabase
            .from('stock_to_dispatch_items')
            .update({
              nb_max_store_m4_ref: nbMaxStoreM4,
              nb_max_store_m5_ean: nbMaxStoreM5,
              nb_max_store_final: Math.min(nbMaxStoreM4, nbMaxStoreM5)
            })
            .eq('id', item.id)
            .select('*')

          if (updateError) {
            throw new Error(`Erreur lors de la mise à jour de l'item ${item.id}: ${updateError.message || 'Erreur inconnue'}`)
          }

          processedItems++
          updateState({ 
            calculationProgress: Math.round((processedItems / totalItems) * 100)
          })
        } catch (error) {
          console.error(`Erreur lors du traitement de l'item ${item.id}:`, error)
          throw error
        }
      }

      // 4. Mettre à jour le statut du dispatch
      const { error: statusError } = await supabase
        .from('stock_to_dispatch')
        .update({ status: 'max_shops_calculated' })
        .eq('id', state.dispatchId)

      if (statusError) throw new Error('Erreur lors de la mise à jour du statut')

      updateState({ 
        calculationComplete: true,
        success: 'Le calcul a été effectué avec succès'
      })

    } catch (error) {
      console.error('Erreur lors du calcul:', error)
      updateState({ 
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors du calcul'
      })
    } finally {
      updateState({ isLoading: false })
    }
  }

  // Gérer la fermeture avec nettoyage si nécessaire
  const handleClose = async () => {
    if (state.dispatchId && step !== 'calculation' && !existingDispatch) {
      try {
        updateState({ isLoading: true })
        
        // Supprimer les items
        await supabase
          .from('stock_to_dispatch_items')
          .delete()
          .eq('stock_to_dispatch_id', state.dispatchId)
        
        // Supprimer le dispatch
        await supabase
          .from('stock_to_dispatch')
          .delete()
          .eq('id', state.dispatchId)
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
    
    resetState()
    onClose()
  }

  // Ajouter la fonction de chargement du script actif
  const loadActiveScript = async () => {
    if (!state.dispatchId) return;

    try {
      console.log('Loading script for dispatch:', state.dispatchId);
      
      // D'abord, récupérer le dispatch avec son python_script_id
      const { data: dispatch, error: dispatchError } = await supabase
        .from('stock_to_dispatch')
        .select(`
          id,
          python_script_id,
          python_scripts (
            id,
            name,
            description,
            code,
            status
          )
        `)
        .eq('id', state.dispatchId)
        .single();

      console.log('Dispatch data:', dispatch);

      if (dispatchError) {
        console.error('Dispatch error:', dispatchError);
        throw dispatchError;
      }

      if (dispatch?.python_scripts) {
        const script = Array.isArray(dispatch.python_scripts) 
          ? dispatch.python_scripts[0] 
          : dispatch.python_scripts;

        console.log('Found script:', script);
        
        updateState({ 
          pythonScript: script.code,
          scriptSaved: true
        });
      } else {
        console.log('No script found for dispatch');
        throw new Error('Aucun script Python associé trouvé');
      }
    } catch (error) {
      console.error('Error loading script:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement du script'
      });
    }
  }

  // Dans le useEffect pour charger les données existantes
  useEffect(() => {
    if (step === 'model' && !state.pythonScript) {
      console.log('Step is model, loading script...');
      loadActiveScript();
    }
  }, [step, state.pythonScript]);

  useEffect(() => {
    const loadActiveParameters = async () => {
      if (step === 'calculation') {
        const { data: params, error } = await supabase
          .from('parameters')
          .select('*')
          .eq('status', 'active')
          .single()

        if (!error && params) {
          setActiveParameters(params)
        }
      }
    }

    loadActiveParameters()
  }, [step])

  // Séparer le calcul et le téléchargement
  const downloadResults = async () => {
    if (!state.dispatchId) return

    try {
      updateState({ isLoading: true, error: null })

      const { data: finalData, error: finalError } = await supabase
        .from('stock_to_dispatch_items')
        .select(`
          id,
          ean_code,
          size,
          quantity,
          expedition_date,
          nb_max_store_m4_ref,
          nb_max_store_m5_ean,
          nb_max_store_final,
          reference_not_found,
          products:products (
            reference,
            designation
          )
        `)
        .eq('stock_to_dispatch_id', state.dispatchId)

      if (finalError || !finalData) {
        throw new Error('Erreur lors de la récupération des données finales')
      }

      const csvData = finalData.map(item => ({
        'Référence': item.products?.[0]?.reference || 'N/A',
        'Désignation': item.products?.[0]?.designation || 'N/A',
        'Code EAN': item.ean_code,
        'Taille': item.size,
        'Quantités BL': item.quantity,
        'Date Expe': item.expedition_date,
        'Nb max magasins (Référence)': item.nb_max_store_m4_ref,
        'Nb max magasins (EAN)': item.nb_max_store_m5_ean,
        'Nb max magasins final': item.nb_max_store_final,
        'Référence non trouvée': item.reference_not_found ? 'Oui' : 'Non'
      }))

      const csvContent = [
        Object.keys(csvData[0]).join(';'),
        ...csvData.map(row => Object.values(row).join(';'))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `dispatch_${state.dispatchId}_${new Date().toISOString()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      updateState({ 
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      })
    } finally {
      updateState({ isLoading: false })
    }
  }

  // Exécuter le script de distribution
  const executeDistributionScript = async () => {
    if (!state.dispatchId) return

    try {
      updateState({ isLoading: true, error: null, distributionSuccess: false })

      // Récupérer le script Python actif
      const { data: script, error: scriptError } = await supabase
        .from('python_scripts')
        .select('*')
        .eq('status', 'active')
        .single()

      if (scriptError || !script) {
        throw new Error('Aucun script Python actif trouvé')
      }

      // Exécuter le script via l'API Python
      const apiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000/api/python/execute'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script.code,
          params: {
            stock_to_dispatch_id: state.dispatchId
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'exécution du script')
      }

      // Mettre à jour l'état avec le succès
      updateState({ 
        isLoading: false,
        success: 'Le calcul a été effectué avec succès',
        distributionId: result.distribution_id,
        csvFilename: `distribution_${result.distribution_id}.csv`,
        distributionSuccess: true
      })

      // Forcer un re-render en mettant à jour l'état une deuxième fois
      setTimeout(() => {
        updateState({
          distributionSuccess: true
        })
      }, 100)

    } catch (error) {
      console.error('Erreur lors de l\'exécution du script:', error)
      updateState({ 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'exécution du script',
        distributionSuccess: false
      })
    }
  }

  // Télécharger le fichier CSV de distribution
  const downloadDistributionCSV = async () => {
    if (!state.distributionId) {
      console.error('Aucun ID de distribution disponible')
      updateState({ 
        error: 'Aucun ID de distribution disponible pour le téléchargement'
      })
      return
    }

    try {
      console.log('Tentative de téléchargement pour la distribution:', state.distributionId)
      
      // 1. Récupérer les items de distribution
      const { data: items, error: itemsError } = await supabase
        .from('distribution_items')
        .select('*')
        .eq('distribution_id', state.distributionId)

      if (itemsError) {
        console.error('Erreur lors de la récupération des items:', itemsError)
        throw new Error(`Erreur Supabase: ${itemsError.message}`)
      }

      if (!items || items.length === 0) {
        console.error('Aucun item trouvé pour cette distribution')
        throw new Error('Aucun item trouvé pour cette distribution')
      }

      console.log('Items récupérés:', items.length)

      // 2. Récupérer les IDs uniques des produits et des magasins
      const productIds = [...new Set(items.map(item => item.product_id))]
      const storeIds = [...new Set(items.map(item => item.store_id))]

      // 3. Récupérer les informations des produits
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, reference')
        .in('id', productIds)

      if (productsError) {
        console.error('Erreur lors de la récupération des produits:', productsError)
        throw new Error(`Erreur Supabase: ${productsError.message}`)
      }

      // 4. Récupérer les informations des magasins
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, store_code')
        .in('id', storeIds)

      if (storesError) {
        console.error('Erreur lors de la récupération des magasins:', storesError)
        throw new Error(`Erreur Supabase: ${storesError.message}`)
      }

      // 5. Créer des maps pour un accès rapide aux données
      const productMap = new Map(products.map(p => [p.id, p]))
      const storeMap = new Map(stores.map(s => [s.id, s]))

      // 6. Créer le contenu CSV avec les colonnes demandées
      const csvContent = [
        ['ID Distribution', 'Quantité', 'ID Produit', 'Référence', 'Code EAN', 'ID Magasin', 'Code Magasin'],
        ...items.map(item => [
          item.distribution_id,
          item.quantity,
          item.product_id,
          productMap.get(item.product_id)?.reference || 'N/A',
          item.ean_code,
          item.store_id,
          storeMap.get(item.store_id)?.store_code || 'N/A'
        ])
      ].map(row => row.join(';')).join('\n')

      console.log('Contenu CSV généré:', csvContent)

      // 7. Créer le blob et le télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `distribution_${state.distributionId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log('Téléchargement terminé avec succès')
    } catch (error) {
      console.error('Erreur détaillée lors du téléchargement:', error)
      if (error instanceof Error) {
        console.error('Message d\'erreur:', error.message)
        console.error('Stack trace:', error.stack)
      }
      updateState({ 
        error: error instanceof Error ? error.message : 'Erreur lors du téléchargement du fichier'
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'name' && 'Créer un nouveau dispatch'}
            {step === 'file' && 'Charger le fichier de stock'}
            {step === 'calculation' && (existingDispatch ? 'Modifier le dispatch' : 'Calcul du nombre maximum de magasins')}
            {step === 'model' && 'Définition du modèle de dispatch'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status indicator */}
        {existingDispatch && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Statut actuel : {existingDispatch.status === 'created' && 'Créé'}
              {existingDispatch.status === 'file_loaded' && 'Fichier chargé'}
              {existingDispatch.status === 'max_shops_calculated' && 'Calcul des magasins terminé'}
            </p>
          </div>
        )}

        {/* Error message */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            {state.error}
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          {step === 'name' && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du dispatch
                </label>
                <input
                  type="text"
                  value={state.name}
                  onChange={(e) => updateState({ name: e.target.value })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white"
                  placeholder="Nom du dispatch"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler et fermer
                </button>
                <button
                  onClick={() => createStockToDispatch(true)}
                  disabled={state.isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {state.isLoading ? 'Création...' : 'Enregistrer et fermer'}
                </button>
                <button
                  onClick={() => createStockToDispatch(false)}
                  disabled={state.isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {state.isLoading ? 'Création...' : 'Suivant'}
                </button>
              </div>
            </div>
          )}

          {step === 'file' && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier CSV de stock
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler et fermer
                </button>
                <button
                  onClick={() => processFile(true)}
                  disabled={state.isLoading || !state.file}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {state.isLoading ? 'Traitement...' : 'Enregistrer et fermer'}
                </button>
                <button
                  onClick={() => processFile(false)}
                  disabled={state.isLoading || !state.file}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {state.isLoading ? 'Traitement...' : 'Suivant'}
                </button>
              </div>
            </div>
          )}

          {step === 'calculation' && (
            <div>
              <div className="mb-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Cette étape calcule le nombre maximal de magasins vers lesquels dispatcher chaque référence. 
                        Le calcul prend en compte la quantité totale disponible par référence et les paramètres minimaux définis.
                      </p>
                    </div>
                  </div>
                </div>

                {activeParameters && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Paramètres actifs :</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li className="text-sm text-gray-600">
                        Quantité minimale par référence : {activeParameters.min_reference_quantity}
                      </li>
                      <li className="text-sm text-gray-600">
                        Quantité minimale par EAN : {activeParameters.min_ean_quantity}
                      </li>
                    </ul>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={calculateMaxStores}
                    disabled={state.isLoading}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {state.isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calcul en cours...
                      </span>
                    ) : 'Lancer le calcul'}
                  </button>
                  
                  <button
                    onClick={downloadResults}
                    disabled={!state.calculationComplete || state.isLoading}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    Télécharger les résultats
                  </button>
                </div>

                {state.isLoading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${state.calculationProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {state.calculationProgress}% terminé
                    </p>
                  </div>
                )}

                {state.calculationComplete && !state.isLoading && (
                  <div className="mt-4 text-center text-green-600">
                    Calcul terminé ! Vous pouvez télécharger les résultats.
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep('file')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Enregistrer et fermer
                </button>
                <button
                  onClick={() => setStep('model')}
                  disabled={!state.calculationComplete}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${!state.calculationComplete ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {step === 'model' && (
            <div className="flex flex-col h-full max-h-[80vh]">
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:p-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Cette étape exécute l'algorithme de dispatch défini dans le script Python actif.
                        Le script détermine la répartition optimale des articles entre les magasins en fonction des contraintes définies.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Affichage du script Python */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Script de calcul actif :</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {state.pythonScript ? (
                      <Editor
                        height="300px"
                        defaultLanguage="python"
                        value={state.pythonScript}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          lineNumbers: 'on',
                          theme: 'vs-light'
                        }}
                      />
                    ) : (
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                        Aucun script actif trouvé
                      </pre>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex space-x-4">
                  <button
                    onClick={executeDistributionScript}
                    disabled={state.isLoading || state.distributionSuccess}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {state.isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calcul en cours...
                      </span>
                    ) : 'Lancer le calcul du dispatch'}
                  </button>
                </div>

                {/* Barre de progression */}
                {state.isLoading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${state.calculationProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {state.calculationProgress}% terminé
                    </p>
                  </div>
                )}

                {/* Message de succès et bouton de téléchargement */}
                {state.distributionSuccess && (
                  <div className="mt-6">
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            Calcul terminé avec succès ! La distribution a été créée et enregistrée.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={downloadDistributionCSV}
                      className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Télécharger le fichier de distribution
                    </button>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 sm:px-6 flex justify-end space-x-3">
                <button
                  onClick={() => setStep('calculation')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}