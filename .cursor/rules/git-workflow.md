# Règles pour les opérations Git

## Emplacement des commandes
- **IMPORTANT** : Toutes les commandes Git doivent être exécutées depuis la racine du projet (`C:\Users\pierr\OneDrive\Documents\Cursor\mim`)
- Ne jamais exécuter de commandes Git depuis les sous-dossiers (`backend/`, `frontend/`, etc.)
- Si vous êtes dans un sous-dossier, utilisez `cd ..` jusqu'à atteindre la racine avant d'exécuter des commandes Git

## Pourquoi ?
- Le dépôt Git est initialisé à la racine du projet
- Les branches, commits et autres opérations Git concernent l'ensemble du projet
- Travailler depuis un sous-dossier peut causer des problèmes de chemins relatifs et de visibilité des modifications

## Exemple de workflow correct
```powershell
# Si vous êtes dans un sous-dossier
cd ..  # Remonter à la racine

# Puis exécuter les commandes Git
git status
git add .
git commit -m "message"
git checkout develop
git merge feature/ma-branche
```

## À éviter
```powershell
# ❌ Ne pas exécuter depuis backend/
cd backend
git add .  # Incorrect : ne verra que les modifications de backend/

# ❌ Ne pas exécuter depuis frontend/
cd frontend
git commit  # Incorrect : contexte incomplet du projet
``` 