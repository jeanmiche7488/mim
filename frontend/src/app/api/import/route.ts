import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'

// Initialisation du client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function extractDateFromFilename(filename: string): { month: string, year: string } {
  const match = filename.match(/([A-Z]+)_(\d{2})_a_dispatcher/)
  if (!match) {
    throw new Error('Format de nom de fichier invalide. Format attendu: MOIS_AA_a_dispatcher.csv')
  }
  return { month: match[1], year: match[2] }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérification du format du nom de fichier
    const { month, year } = extractDateFromFilename(file.name)

    // Lecture du fichier CSV
    const text = await file.text()
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    // Traitement des données
    for (const record of records) {
      // Insertion dans la table products si le produit n'existe pas
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('ean', record.ean)
        .single()

      if (!existingProduct) {
        const { error: productError } = await supabase
          .from('products')
          .insert([
            {
              ean: record.ean,
              reference: record.reference,
              name: record.reference // On utilise la référence comme nom par défaut
            }
          ])

        if (productError) throw productError
      }

      // Insertion dans la table stock
      const { error: stockError } = await supabase
        .from('stock')
        .insert([
          {
            product_id: existingProduct?.id || record.ean,
            store_id: 1, // Magasin par défaut
            quantity: parseInt(record.quantity),
            month: month,
            year: year
          }
        ])

      if (stockError) throw stockError
    }

    return NextResponse.json({ 
      message: 'Import réussi',
      count: records.length,
      month,
      year
    })

  } catch (error) {
    console.error('Erreur lors de l\'import:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import des données' },
      { status: 500 }
    )
  }
} 