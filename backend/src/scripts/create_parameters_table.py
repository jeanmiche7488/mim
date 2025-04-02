from ..config.supabase import supabase

def create_parameters_table():
    """Crée la table parameters et insère les valeurs par défaut"""
    try:
        # Création de la table
        supabase.table("parameters").create({
            "id": "bigint primary key generated always as identity",
            "min_reference_quantity": "integer not null check (min_reference_quantity > 0)",
            "min_ean_quantity": "integer not null check (min_ean_quantity > 0)",
            "created_at": "timestamp with time zone default timezone('utc'::text, now())",
            "updated_at": "timestamp with time zone default timezone('utc'::text, now())"
        }).execute()

        # Insertion des valeurs par défaut
        supabase.table("parameters").insert({
            "min_reference_quantity": 5,
            "min_ean_quantity": 10
        }).execute()

        print("Table parameters créée avec succès et valeurs par défaut insérées")
    except Exception as e:
        print(f"Erreur lors de la création de la table parameters : {str(e)}")

if __name__ == "__main__":
    create_parameters_table() 