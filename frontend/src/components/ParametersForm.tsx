import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface PlatformParameters {
  id: number;
  min_reference_quantity: number;
  min_ean_quantity: number;
  created_at: string;
  updated_at: string;
}

export default function ParametersForm() {
  const [parameters, setParameters] = useState<PlatformParameters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchParameters();
  }, []);

  const fetchParameters = async () => {
    try {
      const response = await fetch('http://localhost:8000/parameters');
      if (!response.ok) throw new Error('Erreur lors de la récupération des paramètres');
      const data = await response.json();
      setParameters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!parameters) return;

    try {
      const response = await fetch('http://localhost:8000/parameters', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          min_reference_quantity: parameters.min_reference_quantity,
          min_ean_quantity: parameters.min_ean_quantity,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour des paramètres');
      
      setSuccess(true);
      await fetchParameters(); // Rafraîchir les données
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!parameters) return <div>Aucun paramètre trouvé</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Paramètres de la Plateforme</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quantité minimale d'une référence par magasin
          </label>
          <div className="mt-1">
            <input
              type="number"
              min="1"
              value={parameters.min_reference_quantity}
              onChange={(e) => setParameters({
                ...parameters,
                min_reference_quantity: parseInt(e.target.value)
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Quantité minimale d'une référence à livrer par magasin (niveau référence)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quantité minimale par taille
          </label>
          <div className="mt-1">
            <input
              type="number"
              min="1"
              value={parameters.min_ean_quantity}
              onChange={(e) => setParameters({
                ...parameters,
                min_ean_quantity: parseInt(e.target.value)
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Quantité minimale par taille (niveau EAN) pour le calcul de la diversité
          </p>
        </div>

        {success && (
          <div className="text-green-600 text-sm">
            Les paramètres ont été mis à jour avec succès
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
} 