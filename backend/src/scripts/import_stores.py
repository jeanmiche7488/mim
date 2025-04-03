import csv
from datetime import datetime
from ..config.supabase import supabase

def import_stores(csv_file_path: str):
    """Importe les magasins depuis un fichier CSV vers Supabase"""
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            # Utiliser le délimiteur point-virgule
            reader = csv.DictReader(file, delimiter=';')
            
            # Liste pour stocker les magasins à importer
            stores_to_import = []
            
            for row in reader:
                # Convertir les dates
                start_date = datetime.strptime(row['Date debut'], '%d/%m/%Y').date()
                end_date = datetime.strptime(row['Date fin'], '%d/%m/%Y').date()
                
                # Convertir le poids en décimal
                weight = float(row['Poids repartition (PVP Base article)'].replace('%', '').replace(',', '.'))
                
                # Créer l'objet magasin
                store = {
                    'zone': row['ZONE'],
                    'country': row['Pays'],
                    'entity_type': row['Type Entité'],
                    'entity_category': row['Catégorie Entité'],
                    'store_code': row['Code Entité'],
                    'name': row['Enseigne'],
                    'brand': row['Enseigne'],
                    'dispatch_category': row['Dispatch Mag'],
                    'weight': weight,
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'currency': row['Devise'],
                    'exchange_rate': float(row['Taux € / Devise']),
                    'vat_rate': float(row['Taux TVA']),
                    'is_active': True
                }
                
                stores_to_import.append(store)
            
            # Importer les magasins par lots de 100
            batch_size = 100
            for i in range(0, len(stores_to_import), batch_size):
                batch = stores_to_import[i:i + batch_size]
                response = supabase.table('stores').upsert(batch).execute()
                
                if response.error:
                    print(f"Erreur lors de l'import du lot {i//batch_size + 1}: {response.error}")
                else:
                    print(f"Lot {i//batch_size + 1} importé avec succès")
            
            print(f"Import terminé. {len(stores_to_import)} magasins importés.")
            
    except Exception as e:
        print(f"Erreur lors de l'import des magasins: {str(e)}")

if __name__ == "__main__":
    # Chemin vers le fichier CSV
    csv_file_path = "../../data/input/magasins/Cartographie_magasins.csv"
    import_stores(csv_file_path) 