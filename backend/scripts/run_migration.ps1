# Charger les variables d'environnement depuis le fichier .env du backend
Get-Content "../.env" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Item -Path "env:$name" -Value $value
    }
}

# Vérifier que les variables d'environnement sont définies
if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_KEY) {
    Write-Error "Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies"
    exit 1
}

# Lire le contenu du fichier de migration
$migrationSql = Get-Content -Path "../supabase/migrations/003_add_python_scripts.sql" -Raw

# Exécuter la migration via l'API Supabase
$headers = @{
    "apikey" = $env:SUPABASE_KEY
    "Authorization" = "Bearer $env:SUPABASE_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    "sql" = $migrationSql
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$env:SUPABASE_URL/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body
    Write-Host "Migration exécutée avec succès!"
} catch {
    Write-Error "Erreur lors de l'exécution de la migration: $_"
    exit 1
} 