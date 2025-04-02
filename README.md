# Outil de Dispatch de Stock

Application de répartition de stock entre entrepôt et magasins.

## 🚀 Fonctionnalités

- Import de fichiers de stock (XLS/CSV)
- Calcul de répartition optimale
- Export des résultats
- Interface utilisateur intuitive

## 🛠 Technologies

- Frontend : Next.js/React
- Backend : FastAPI (Python)
- Base de données : PostgreSQL

## 📋 Prérequis

- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- PowerShell

## 🚀 Installation

1. Cloner le repository :
```powershell
git clone [URL_DU_REPO]
cd mim
```

2. Installer les dépendances frontend :
```powershell
cd frontend
npm install
```

3. Installer les dépendances backend :
```powershell
cd ../backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

4. Configurer la base de données :
```powershell
# À compléter avec les instructions de configuration de la base de données
```

## 📁 Structure du Projet

```
mim/
├── frontend/          # Application Next.js
├── backend/           # API FastAPI
├── data/             # Données d'entrée/sortie
│   ├── input/        # Fichiers d'entrée
│   └── output/       # Fichiers de sortie
└── docs/             # Documentation
```

## 🔒 Sécurité

- Authentification requise
- Validation des fichiers d'entrée
- Protection des données sensibles

## 📝 Documentation

La documentation complète est disponible dans le dossier `docs/`.

## 🤝 Contribution

Veuillez suivre les guidelines de contribution dans `docs/CONTRIBUTING.md`. 