# Règles pour les commandes PowerShell

## Syntaxe générale
- Utiliser `git` sans `&&` car PowerShell utilise `;` comme séparateur de commandes
- Pour les chemins avec des espaces, utiliser des guillemets doubles `"`
- Pour les chemins relatifs, utiliser `..\` au lieu de `../`

## Exemples de commandes valides
```powershell
# Multiple commandes
git add .; git commit -m "message"

# Chemins avec espaces
git add "..\My Documents\file.txt"

# Commandes avec options
git checkout -b "feature/ma-branche"
```

## À éviter
- Ne pas utiliser `&&` comme séparateur de commandes
- Ne pas utiliser `/` dans les chemins Windows
- Ne pas utiliser de guillemets simples pour les chemins avec espaces 