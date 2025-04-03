import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

// Fonction pour convertir la date du format DD/MM/YYYY vers YYYY-MM-DD
function convertDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const [day, month, year] = dateStr.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export async function POST(request: Request) {
  try {
    // Créer le client Supabase avec les cookies de session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier n\'a été fourni' },
        { status: 400 }
      )
    }

    // Convertir le fichier en buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const content = buffer.toString('utf-8')

    console.log('Contenu du fichier:', content.substring(0, 200))

    // Parser le CSV
    const records = parse(content, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
    })

    console.log('Nombre de lignes CSV:', records.length)
    console.log('Première ligne:', records[0])

    const stores = records.map((record: any) => {
      try {
        const weight = record['Poids repartition (PVP Base article) ']
          ? parseFloat(record['Poids repartition (PVP Base article) '].replace(',', '.').replace('%', ''))
          : 0

        return {
          zone: record['ZONE'] || '',
          country: record.Pays || '',
          entity_type: record['Type Entité'] || '',
          entity_category: record['Catégorie Entité'] || '',
          store_code: record['Code Entité'] || '',
          name: record.Enseigne || '',
          brand: record.Enseigne || '',
          dispatch_category: record['Dispatch Mag '] || '',
          weight: weight,
          start_date: convertDate(record['Date debut ']),
          end_date: convertDate(record['Date fin ']),
          currency: record.Devise || '',
          exchange_rate: parseFloat(record['Taux € / Devise'] || '0'),
          vat_rate: parseFloat(record['Taux TVA'] || '0'),
          is_active: true,
        }
      } catch (error) {
        console.error('Erreur lors de la transformation de la ligne:', record, error)
        throw error
      }
    })

    console.log('Nombre de magasins transformés:', stores.length)
    console.log('Premier magasin transformé:', stores[0])

    // Insérer les magasins dans Supabase
    const { data, error } = await supabase
      .from('stores')
      .upsert(stores, {
        onConflict: 'store_code',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: `Erreur Supabase: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Import des magasins réussi', count: stores.length, data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur détaillée:', error)
    return NextResponse.json(
      { error: `Erreur lors de l'import des magasins: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    )
  }
} 