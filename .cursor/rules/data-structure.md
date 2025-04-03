# Structure des Données - Outil de Dispatch de Stock

## 📁 Organisation des Fichiers

### Fichiers d'Entrée
```
/data
  /input
    /stock
      - MARS_25_a_dispatcher.xlsx    # Stock à dispatcher
    /base
      - Base_Article.xlsx            # Base article
    /historique
      - Ventes_historiques.xlsx      # Données historiques de ventes
  /output
    - mouvements_dispatche_vague_mars-25.xlsx  # Résultats du dispatch
```

## 📊 Structure des Données

### Base Article
- Format: XLSX
- Colonnes requises:
  - EAN
  - Référence mère
  - Catégorie produit (A, B, C)
  - Tailles disponibles

### Stock à Dispatcher
- Format: XLSX
- Colonnes requises:
  - EAN
  - Quantité disponible
  - Date de disponibilité

### Ventes Historiques
- Format: XLSX
- Colonnes requises:
  - Magasin
  - EAN
  - Date
  - Quantité vendue

### Output de Dispatch
- Format: XLSX
- Colonnes requises:
  - Magasin
  - EAN
  - Quantité dispatchée
  - Date d'arrivée estimée

## 🔄 Validation des Données

### Règles de Validation
1. Format des fichiers:
   - Extension: .xlsx
   - Encodage: UTF-8
   - Pas de caractères spéciaux dans les noms de fichiers

2. Contenu:
   - Pas de lignes vides
   - Pas de doublons
   - Types de données cohérents

3. Cohérence:
   - EANs présents dans la base article
   - Magasins valides
   - Quantités positives

## 📈 Visualisations

### Tableaux de Bord
1. Vue d'ensemble:
   - Total des articles à dispatcher
   - Nombre de magasins concernés
   - Temps de calcul estimé

2. Résultats:
   - Répartition par magasin
   - Graphiques de distribution
   - Alertes sur anomalies

## 🔒 Sécurité des Données

### Stockage
- Fichiers temporaires supprimés après traitement
- Sauvegarde des résultats avant export
- Pas de stockage de données sensibles

### Accès
- Lecture seule des fichiers d'entrée
- Export contrôlé des résultats
- Logs des opérations 