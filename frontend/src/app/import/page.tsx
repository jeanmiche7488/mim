'use client'

import { useState } from 'react'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMessage('Veuillez sélectionner un fichier')
      return
    }

    setLoading(true)
    setMessage('Chargement en cours...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'import')
      }

      const data = await response.json()
      setMessage('Import réussi !')
      setFile(null)
    } catch (error) {
      setMessage('Erreur lors de l\'import : ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Import des Données Initiales</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier CSV de stock à dispatcher
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="mt-2 text-sm text-gray-500">
              Format attendu : Fichier CSV (séparé par des virgules) contenant les colonnes EAN, Référence, Quantité
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded ${
              message.includes('Erreur') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className={`w-full py-2 px-4 rounded-md text-white font-medium
              ${loading || !file 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {loading ? 'Import en cours...' : 'Importer'}
          </button>
        </form>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Préparez votre fichier CSV avec les colonnes : EAN, Référence, Quantité</li>
          <li>Le nom du fichier doit suivre le format : MOIS_AA_a_dispatcher.csv (ex: MARS_25_a_dispatcher.csv)</li>
          <li>Assurez-vous que le fichier est encodé en UTF-8</li>
          <li>Cliquez sur "Parcourir" pour sélectionner votre fichier</li>
          <li>Cliquez sur "Importer" pour lancer l'import</li>
        </ol>
      </div>
    </div>
  )
} 