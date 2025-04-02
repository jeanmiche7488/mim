# Configuration de l'Environnement

## Structure des Fichiers d'Environnement

### `.env`
Fichier contenant les variables d'environnement non sensibles, partagé sur GitHub :
- URL de l'API Supabase
- Clé publique Supabase
- Configuration de l'API

### `.env.local`
Fichier contenant les variables d'environnement sensibles, **NE PAS PARTAGER** :
- Clé de service Supabase
- URLs de connexion à la base de données
- Mots de passe et informations d'authentification

## Configuration Supabase

### Variables Requises
```env
# Variables publiques (.env)
SUPABASE_URL=https://[votre-projet].supabase.co
SUPABASE_KEY=votre_clé_anon

# Variables sensibles (.env.local)
SUPABASE_SERVICE_KEY=votre_clé_service
DATABASE_URL=votre_url_de_connexion
DIRECT_URL=votre_url_directe
```

### Sécurité
- Ne jamais commiter `.env.local` sur GitHub
- Utiliser des variables d'environnement différentes pour chaque environnement (dev, prod)
- Roter régulièrement les clés de service

## Utilisation dans le Code

### Backend (Python)
```python
from dotenv import load_dotenv
import os

# Charge .env et .env.local
load_dotenv()

# Accès aux variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
```

### Frontend (Next.js)
```typescript
// Accès aux variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
```

## Bonnes Pratiques
1. Toujours utiliser des variables d'environnement pour les informations sensibles
2. Documenter toutes les variables requises
3. Fournir des valeurs par défaut quand possible
4. Valider la présence des variables requises au démarrage 