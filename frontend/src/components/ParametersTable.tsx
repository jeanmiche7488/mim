'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Editor } from '@monaco-editor/react'

interface Parameter {
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

export default function ParametersTable() {
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [pythonScripts, setPythonScripts] = useState<PythonScript[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Charger les paramètres avec leurs stock_to_dispatch associés
      const { data: parametersData, error: parametersError } = await supabase
        .from('parameters')
        .select(`
          *,
          stock_to_dispatch (
            id,
            name,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (parametersError) throw parametersError
      setParameters(parametersData || [])

      // Charger les scripts Python avec leurs stock_to_dispatch associés
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('python_scripts')
        .select(`
          *,
          stock_to_dispatch (
            id,
            name,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (scriptsError) throw scriptsError
      setPythonScripts(scriptsData || [])

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const toggleEditor = (scriptId: string) => {
    setPythonScripts(scripts =>
      scripts.map(script =>
        script.id === scriptId
          ? { ...script, showEditor: !script.showEditor }
          : script
      )
    )
  }

  const handleScriptUpdate = async (scriptId: string, newCode: string) => {
    try {
      const { error } = await supabase
        .from('python_scripts')
        .update({ code: newCode })
        .eq('id', scriptId)

      if (error) throw error

      setPythonScripts(scripts =>
        scripts.map(script =>
          script.id === scriptId
            ? { ...script, code: newCode, showEditor: false }
            : script
        )
      )
    } catch (error) {
      console.error('Erreur lors de la mise à jour du script:', error)
      setError('Erreur lors de la mise à jour du script')
    }
  }

  if (loading) return <div>Chargement...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-8">
      {/* Table des paramètres */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Paramètres</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité minimale référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité minimale EAN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Magasin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parameters.map((param) => (
                <tr key={param.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {param.min_reference_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {param.min_ean_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {param.stock_to_dispatch?.[0]?.name || 'Non assigné'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table des scripts Python */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Scripts Python</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Magasin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pythonScripts.map((script) => (
                <tr key={script.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {script.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {script.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {script.stock_to_dispatch?.[0]?.name || 'Non assigné'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => toggleEditor(script.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Éditeurs de code pour les scripts */}
      {pythonScripts.map((script) => 
        script.showEditor && (
          <div key={`editor-${script.id}`} className="mt-4">
            <Editor
              height="400px"
              defaultLanguage="python"
              defaultValue={script.code}
              onChange={(value) => value && handleScriptUpdate(script.id, value)}
            />
          </div>
        )
      )}
    </div>
  )
} 