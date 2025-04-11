'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Navigation from '@/components/Navigation'
import { Editor } from '@monaco-editor/react'

interface Parameters {
  id: string
  min_reference_quantity: number
  min_ean_quantity: number
  status: string
  created_at: string
  stock_to_dispatch?: StockToDispatch[]
}

interface PythonScript {
  id: string
  name: string
  description: string
  code: string
  status: string
  created_at: string
  stock_to_dispatch?: StockToDispatch[]
  showEditor?: boolean
}

interface StockToDispatch {
  id: string
  name: string
  created_at: string
}

export default function ParametersPage() {
  const router = useRouter()
  const [parameters, setParameters] = useState<Parameters[]>([])
  const [pythonScripts, setPythonScripts] = useState<PythonScript[]>([])
  const [editingParameter, setEditingParameter] = useState<Parameters | null>(null)
  const [editingScript, setEditingScript] = useState<PythonScript | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  const loadData = async () => {
      try {
      // Récupérer tous les paramètres avec leurs stock_to_dispatch associés
      const { data: paramsData, error: paramsError } = await supabase
          .from('parameters')
        .select('*, stock_to_dispatch(id, name, created_at)')
        .order('created_at', { ascending: false })

      if (paramsError) throw paramsError
      setParameters(paramsData || [])

      // Récupérer tous les scripts Python avec leurs stock_to_dispatch associés
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('python_scripts')
        .select('*, stock_to_dispatch(id, name, created_at)')
        .order('created_at', { ascending: false })

      if (scriptsError) throw scriptsError
      setPythonScripts(scriptsData || [])
      } catch (error) {
      console.error('Erreur lors de la récupération des données:', error)
      setError('Erreur lors du chargement des données')
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveParameter = async (parameter: Parameters) => {
    setIsSaving(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('parameters')
        .update({
          min_reference_quantity: parameter.min_reference_quantity,
          min_ean_quantity: parameter.min_ean_quantity,
          status: parameter.status
        })
        .eq('id', parameter.id)

      if (updateError) throw updateError
      
      await loadData()
      setEditingParameter(null)
      setSuccess('Paramètres mis à jour avec succès')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setError('Erreur lors de la mise à jour des paramètres')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveScript = async (script: PythonScript) => {
    setIsSaving(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('python_scripts')
        .update({
          name: script.name,
          description: script.description,
          code: script.code,
          status: script.status
        })
        .eq('id', script.id)

      if (updateError) throw updateError
      
      await loadData()
      setEditingScript(null)
      setSuccess('Script mis à jour avec succès')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setError('Erreur lors de la mise à jour du script')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateParameter = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const { error: insertError } = await supabase
        .from('parameters')
        .insert({
          min_reference_quantity: 0,
          min_ean_quantity: 0,
          status: 'active'
        })

      if (insertError) throw insertError
      
      await loadData()
      setSuccess('Nouveaux paramètres créés avec succès')
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      setError('Erreur lors de la création des paramètres')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateScript = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const { error: insertError } = await supabase
        .from('python_scripts')
        .insert({
          name: 'Nouveau script',
          description: 'Description du script',
          code: '# Nouveau script Python\n',
          status: 'active'
        })

      if (insertError) throw insertError
      
      await loadData()
      setSuccess('Nouveau script créé avec succès')
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      setError('Erreur lors de la création du script')
    } finally {
      setIsSaving(false)
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="pl-64">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
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

            {/* Section Paramètres de calcul */}
            <div className="mt-8">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Calcul du nombre maximum de magasins
                    </h3>
                    <button
                      onClick={handleCreateParameter}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Nouveau paramètre
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col">
                    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <div style={{ maxHeight: '200px' }} className="overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date de création</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Qté min. référence</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Qté min. EAN</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Statut</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dispatches liés</th>
                                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {parameters.map((param) => (
                                  <tr key={param.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                                      {new Date(param.created_at).toLocaleString()}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {editingParameter?.id === param.id ? (
                        <input
                          type="number"
                                          value={editingParameter.min_reference_quantity}
                                          onChange={(e) => setEditingParameter({
                                            ...editingParameter,
                            min_reference_quantity: parseInt(e.target.value)
                                          })}
                                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                      ) : param.min_reference_quantity}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {editingParameter?.id === param.id ? (
                                        <input
                                          type="number"
                                          value={editingParameter.min_ean_quantity}
                                          onChange={(e) => setEditingParameter({
                                            ...editingParameter,
                                            min_ean_quantity: parseInt(e.target.value)
                                          })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                                      ) : param.min_ean_quantity}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {editingParameter?.id === param.id ? (
                                        <select
                                          value={editingParameter.status}
                                          onChange={(e) => setEditingParameter({
                                            ...editingParameter,
                                            status: e.target.value
                                          })}
                                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        >
                                          <option value="active">Actif</option>
                                          <option value="archived">Archivé</option>
                                        </select>
                                      ) : (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          param.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {param.status === 'active' ? 'Actif' : 'Archivé'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {param.stock_to_dispatch?.length || 0} dispatch(es)
                                      {param.stock_to_dispatch && param.stock_to_dispatch.length > 0 && (
                                        <div className="text-xs text-gray-400 mt-1">
                                          {param.stock_to_dispatch.map(d => d.name).join(', ')}
                                        </div>
                                      )}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                      {editingParameter?.id === param.id ? (
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleSaveParameter(editingParameter)}
                                            disabled={isSaving}
                                            className="text-indigo-600 hover:text-indigo-900"
                                          >
                                            Enregistrer
                                          </button>
                                          <button
                                            onClick={() => setEditingParameter(null)}
                                            className="text-gray-600 hover:text-gray-900"
                                          >
                                            Annuler
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setEditingParameter(param)}
                                          className="text-indigo-600 hover:text-indigo-900"
                                        >
                                          Modifier
                                        </button>
                                      )}
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

            {/* Section Scripts Python */}
            <div className="mt-8">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Algorithme de dispatch
                    </h3>
                    <button
                      onClick={handleCreateScript}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Nouveau script
                    </button>
                    </div>

                  <div className="mt-4 flex flex-col">
                    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <div style={{ maxHeight: '200px' }} className="overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date de création</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nom</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Statut</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dispatches liés</th>
                                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {pythonScripts.map((script) => (
                                  <tr key={script.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                                      {new Date(script.created_at).toLocaleString()}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {editingScript?.id === script.id ? (
                                        <input
                                          type="text"
                                          value={editingScript.name}
                                          onChange={(e) => setEditingScript({
                                            ...editingScript,
                                            name: e.target.value
                                          })}
                                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                      ) : script.name}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {editingScript?.id === script.id ? (
                        <input
                                          type="text"
                                          value={editingScript.description}
                                          onChange={(e) => setEditingScript({
                                            ...editingScript,
                                            description: e.target.value
                                          })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                                      ) : script.description}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {editingScript?.id === script.id ? (
                                        <select
                                          value={editingScript.status}
                                          onChange={(e) => setEditingScript({
                                            ...editingScript,
                                            status: e.target.value
                                          })}
                                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        >
                                          <option value="active">Actif</option>
                                          <option value="archived">Archivé</option>
                                        </select>
                                      ) : (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          script.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {script.status === 'active' ? 'Actif' : 'Archivé'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {script.stock_to_dispatch?.length || 0} dispatch(es)
                                      {script.stock_to_dispatch && script.stock_to_dispatch.length > 0 && (
                                        <div className="text-xs text-gray-400 mt-1">
                                          {script.stock_to_dispatch.map(d => d.name).join(', ')}
                                        </div>
                                      )}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                      {editingScript?.id === script.id ? (
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleSaveScript(editingScript)}
                                            disabled={isSaving}
                                            className="text-indigo-600 hover:text-indigo-900"
                                          >
                                            Enregistrer
                                          </button>
                                          <button
                                            onClick={() => setEditingScript(null)}
                                            className="text-gray-600 hover:text-gray-900"
                                          >
                                            Annuler
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => setEditingScript(script)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                          >
                                            Modifier
                                          </button>
                                          <button
                                            onClick={() => setEditingScript({...script, showEditor: true})}
                                            className="text-indigo-600 hover:text-indigo-900"
                                          >
                                            Éditer code
                                          </button>
                                        </div>
                                      )}
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

            {/* Modal d'édition de code */}
            {editingScript?.showEditor && (
              <div className="fixed z-10 inset-0 overflow-y-auto">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                  <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                      <button
                        type="button"
                        onClick={() => setEditingScript(null)}
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <span className="sr-only">Fermer</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="h-[70vh]">
                      <Editor
                        height="100%"
                        defaultLanguage="python"
                        value={editingScript.code}
                        onChange={(value) => setEditingScript({
                          ...editingScript,
                          code: value || ''
                        })}
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                        }}
                      />
                    </div>
                    <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setEditingScript(null)}
                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveScript(editingScript)}
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 