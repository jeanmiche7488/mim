#!/bin/bash

# Vérifier que les variables d'environnement sont définies
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "Erreur: Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies"
    exit 1
fi

# Lire le contenu du fichier de migration
MIGRATION_SQL=$(cat ../supabase/migrations/002_update_schema.sql)

# Exécuter la migration via l'API Supabase
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
     -H "apikey: ${SUPABASE_KEY}" \
     -H "Authorization: Bearer ${SUPABASE_KEY}" \
     -H "Content-Type: application/json" \
     -d "{\"sql\": \"${MIGRATION_SQL}\"}"

echo "Migration exécutée avec succès!" 