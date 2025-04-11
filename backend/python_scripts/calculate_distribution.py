import os
import sys
import pandas as pd
from supabase import create_client, Client
from datetime import datetime
import logging
import math
from dotenv import load_dotenv
from typing import Dict, List, Optional, Tuple, Any

# Configuration des logs pour suivre l'exécution du script
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement pour la connexion à Supabase
load_dotenv()

def calculate_distribution(stock_to_dispatch_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Fonction principale qui orchestre le processus de distribution.
    
    Étapes principales :
    1. Récupération des données nécessaires
    2. Calcul de la distribution
    3. Création des enregistrements dans la base de données
    4. Mise à jour des statuts
    
    Args:
        stock_to_dispatch_id (str): ID du stock à dispatcher
        user_id (str, optional): ID de l'utilisateur qui effectue la distribution
        
    Returns:
        Dict[str, Any]: Résultat de la distribution avec les items créés
    """
    try:
        # Étape 1: Initialisation et connexion à Supabase
        logger.info(f"Début du calcul de distribution pour stock_to_dispatch_id: {stock_to_dispatch_id}")
        
        # Récupération des credentials Supabase depuis les variables d'environnement
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            error_msg = "Variables d'environnement SUPABASE_URL et SUPABASE_KEY requises"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        # Création du client Supabase
        supabase: Client = create_client(supabase_url, supabase_key)
        logger.info("Connexion à Supabase établie")

        # Étape 2: Récupération des données de base
        logger.info("Récupération du stock_to_dispatch")
        stock_data = fetch_stock_data(supabase, stock_to_dispatch_id)
        if not stock_data:
            error_msg = "Stock_to_dispatch non trouvé"
            logger.error(error_msg)
            raise Exception(error_msg)

        # Récupération de l'user_id si non fourni
        if not user_id:
            user_id = stock_data.get('created_by')
            if not user_id:
                error_msg = "Impossible de déterminer l'utilisateur pour la distribution"
                logger.error(error_msg)
                raise Exception(error_msg)
            logger.info(f"Utilisateur récupéré depuis le stock_to_dispatch: {user_id}")
        else:
            logger.info(f"Utilisateur fourni: {user_id}")

        # Étape 3: Récupération des paramètres de distribution
        logger.info("Récupération des paramètres actifs")
        active_params = get_active_parameters(supabase)
        if not active_params:
            error_msg = "Aucun paramètre actif trouvé"
            logger.error(error_msg)
            raise Exception(error_msg)

        # Étape 4: Récupération des items à distribuer
        logger.info("Récupération des items à distribuer")
        items = get_stock_items(supabase, stock_to_dispatch_id)
        if not items:
            error_msg = "Aucun item trouvé pour la distribution"
            logger.error(error_msg)
            raise Exception(error_msg)

        # Étape 5: Récupération des magasins actifs
        logger.info("Récupération des magasins actifs")
        stores = get_stores(supabase)
        if not stores:
            error_msg = "Aucun magasin actif trouvé"
            logger.error(error_msg)
            raise Exception(error_msg)

        # Étape 6: Calcul de la distribution
        logger.info("Calcul de la distribution")
        try:
            distribution_items = calculate_store_distribution(supabase, stock_to_dispatch_id)
        except Exception as e:
            error_msg = f"Erreur lors du calcul de la distribution: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

        if not distribution_items:
            error_msg = "Aucun item de distribution créé. Vérifiez que les quantités et les poids des magasins permettent une distribution."
            logger.error(error_msg)
            raise Exception(error_msg)

        # Étape 7: Vérification des critères de distribution
        logger.info("Vérification des critères de distribution")
        try:
            verified_items = verify_distribution_criteria(supabase, distribution_items)
        except Exception as e:
            error_msg = f"Erreur lors de la vérification des critères: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

        # Étape 8: Création de l'enregistrement de distribution
        logger.info("Création de la distribution")
        try:
            distribution_id = create_distribution(supabase, stock_to_dispatch_id, user_id)
        except Exception as e:
            error_msg = f"Erreur lors de la création de la distribution: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

        if not distribution_id:
            error_msg = "Erreur lors de la création de la distribution. Vérifiez les permissions et la structure de la table distributions."
            logger.error(error_msg)
            raise Exception(error_msg)

        # Étape 9: Création des items de distribution
        logger.info("Création des items de distribution")
        try:
            created_items = create_distribution_items(supabase, distribution_id, verified_items)
        except Exception as e:
            error_msg = f"Erreur lors de la création des items de distribution: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

        if not created_items:
            error_msg = "Erreur lors de la création des items de distribution. Vérifiez les permissions et la structure de la table distribution_items."
            logger.error(error_msg)
            raise Exception(error_msg)

        # Étape 10: Mise à jour du statut du stock
        logger.info("Mise à jour du statut du stock_to_dispatch")
        try:
            update_stock_to_dispatch_status(supabase, stock_to_dispatch_id, 'distributed')
        except Exception as e:
            error_msg = f"Erreur lors de la mise à jour du statut: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

        # Retour du résultat avec succès
        logger.info(f"Distribution terminée avec succès - ID: {distribution_id}, Nombre d'items: {len(created_items)}")
        return {
            'success': True,
            'distribution_id': distribution_id,
            'items': created_items
        }

    except Exception as e:
        # Gestion des erreurs
        error_msg = f"Erreur lors du calcul de la distribution: {str(e)}"
        logger.error(error_msg)
        return {
            'success': False,
            'error': error_msg
        }

def fetch_stock_data(supabase: Client, stock_to_dispatch_id: str) -> Dict[str, Any]:
    """
    Récupère les données du stock à dispatcher depuis Supabase.
    
    Args:
        supabase (Client): Client Supabase
        stock_to_dispatch_id (str): ID du stock à dispatcher
        
    Returns:
        Dict[str, Any]: Données du stock ou None en cas d'erreur
    """
    try:
        logger.info(f"Tentative de récupération du stock_to_dispatch avec l'ID: {stock_to_dispatch_id}")
        
        # Vérification que l'ID n'est pas vide
        if not stock_to_dispatch_id:
            error_msg = "L'ID du stock_to_dispatch est vide"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        # Vérification de la connexion Supabase
        logger.info("Vérification de la connexion Supabase")
        try:
            # Test de connexion avec une requête simple
            test_response = supabase.table('stock_to_dispatch').select('id').limit(1).execute()
            logger.info(f"Test de connexion réussi: {test_response}")
            logger.info(f"Données de test: {test_response.data}")
        except Exception as e:
            error_msg = f"Erreur de connexion à Supabase: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Type d'erreur: {type(e)}")
            raise Exception(error_msg)
            
        # Récupération des données
        logger.info("Exécution de la requête principale")
        try:
            # Vérification de l'existence de la table
            logger.info("Vérification de l'existence de la table stock_to_dispatch")
            table_info = supabase.table('stock_to_dispatch').select('id').limit(1).execute()
            logger.info(f"Info table: {table_info}")
            
            # Requête principale
            response = supabase.table('stock_to_dispatch').select('*').eq('id', stock_to_dispatch_id).execute()
            logger.info(f"Réponse brute de Supabase: {response}")
            logger.info(f"Données de la réponse: {response.data}")
            
            # Vérification des données
            if not response.data:
                error_msg = f"Aucune donnée trouvée pour l'ID: {stock_to_dispatch_id}. Vérifiez que l'ID est correct et que la table stock_to_dispatch existe."
                logger.error(error_msg)
                raise Exception(error_msg)
                
            if len(response.data) == 0:
                error_msg = f"Tableau de données vide pour l'ID: {stock_to_dispatch_id}. Vérifiez que l'enregistrement existe dans la table stock_to_dispatch."
                logger.error(error_msg)
                raise Exception(error_msg)
                
            # Log des données récupérées
            logger.info(f"Données récupérées: {response.data[0]}")
            
            return response.data[0]
            
        except Exception as e:
            error_msg = f"Erreur lors de la requête Supabase: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Type d'erreur: {type(e)}")
            raise Exception(error_msg)
        
    except Exception as e:
        error_msg = f"Erreur générale lors de la récupération du stock: {str(e)}"
        logger.error(error_msg)
        logger.error(f"Type d'erreur: {type(e)}")
        raise Exception(error_msg)

def get_active_parameters(supabase: Client) -> Dict[str, Any]:
    """
    Récupère les paramètres actifs depuis la table parameters.
    
    Processus :
    1. Récupération des paramètres actifs
    2. Vérification des données
    3. Retour des paramètres avec les champs min_reference_quantity et min_ean_quantity
    
    Args:
        supabase (Client): Client Supabase
        
    Returns:
        Dict[str, Any]: Paramètres actifs avec les valeurs des champs min_reference_quantity et min_ean_quantity
    """
    try:
        logger.info("Tentative de récupération des paramètres actifs")
        
        # Vérification de l'existence de la table
        try:
            table_info = supabase.table('parameters').select('id').limit(1).execute()
            logger.info(f"Info table parameters: {table_info}")
        except Exception as e:
            error_msg = f"Erreur lors de la vérification de la table parameters: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        # Récupération des paramètres actifs
        response = supabase.table('parameters').select('*').eq('status', 'active').execute()
        logger.info(f"Réponse brute de Supabase pour les paramètres: {response}")
        
        if not response.data:
            error_msg = "Aucun paramètre trouvé dans la table parameters. Vérifiez que la table existe et contient des données."
            logger.error(error_msg)
            raise Exception(error_msg)
            
        if len(response.data) == 0:
            error_msg = "Aucun paramètre actif trouvé. Vérifiez qu'il existe au moins un paramètre avec status = 'active'."
            logger.error(error_msg)
            raise Exception(error_msg)
            
        # Récupération des paramètres
        params = response.data[0]
        logger.info(f"Paramètres bruts récupérés: {params}")
        
        # Vérification des champs requis
        if 'min_reference_quantity' not in params or 'min_ean_quantity' not in params:
            error_msg = "Les champs min_reference_quantity et min_ean_quantity sont requis dans la table parameters"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        # Création du dictionnaire avec les noms de champs corrects
        final_params = {
            'min_quantity_per_reference': params['min_reference_quantity'],
            'min_quantity_per_ean': params['min_ean_quantity']
        }
        
        logger.info(f"Paramètres finaux: {final_params}")
        return final_params
        
    except Exception as e:
        error_msg = f"Erreur lors de la récupération des paramètres: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)

def get_stock_items(supabase: Client, stock_to_dispatch_id: str) -> List[Dict]:
    """
    Récupère les items du stock_to_dispatch.
    
    Args:
        supabase (Client): Client Supabase
        stock_to_dispatch_id (str): ID du stock à dispatcher
        
    Returns:
        List[Dict]: Liste des items ou liste vide en cas d'erreur
    """
    try:
        response = supabase.table('stock_to_dispatch_items').select('*').eq('stock_to_dispatch_id', stock_to_dispatch_id).execute()
        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des items: {str(e)}")
        return []

def get_stores(supabase: Client) -> List[Dict]:
    """
    Récupère tous les magasins actifs.
    
    Args:
        supabase (Client): Client Supabase
        
    Returns:
        List[Dict]: Liste des magasins ou liste vide en cas d'erreur
    """
    try:
        response = supabase.table('stores').select('*').eq('is_active', True).execute()
        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des magasins: {str(e)}")
        return []

def get_reference_quantity(supabase: Client, distribution_id: str) -> Dict[str, int]:
    """
    Calcule la quantité totale par référence pour une distribution donnée.
    
    Processus :
    1. Récupération de tous les distribution_items de la distribution
    2. Extraction des product_ids uniques
    3. Récupération des références correspondantes
    4. Calcul des quantités totales par référence
    
    Args:
        supabase (Client): Client Supabase
        distribution_id (str): ID de la distribution
        
    Returns:
        Dict[str, int]: Dictionnaire avec comme clé la référence et comme valeur la quantité totale
    """
    try:
        # Récupérer tous les distribution_items de cette distribution
        response = supabase.table('distribution_items').select('*').eq('distribution_id', distribution_id).execute()
        if not response.data:
            return {}
            
        # Récupérer les product_ids uniques
        product_ids = list(set(item['product_id'] for item in response.data))
        
        # Récupérer les références correspondantes
        products_response = supabase.table('products').select('id, reference').in_('id', product_ids).execute()
        if not products_response.data:
            return {}
            
        # Créer un mapping product_id -> reference
        product_references = {p['id']: p['reference'] for p in products_response.data}
        
        # Calculer les quantités par référence
        reference_quantities = {}
        for item in response.data:
            reference = product_references.get(item['product_id'])
            if reference:
                if reference not in reference_quantities:
                    reference_quantities[reference] = 0
                reference_quantities[reference] += item['quantity']
                
        return reference_quantities
        
    except Exception as e:
        logger.error(f"Erreur lors du calcul des quantités par référence: {str(e)}")
        return {}

def calculate_store_distribution(supabase: Client, stock_to_dispatch_id: str) -> List[Dict]:
    """
    Calcule la distribution des items du stock vers les magasins
    
    Args:
        supabase: Client Supabase
        stock_to_dispatch_id: ID du stock à distribuer
        
    Returns:
        List[Dict]: Liste des items de distribution créés
        
    Raises:
        Exception: Si aucun item de distribution n'est créé
    """
    try:
        logger.info("Récupération des items à distribuer")
        stock_items = get_stock_items(supabase, stock_to_dispatch_id)
        if not stock_items:
            raise Exception("Aucun item trouvé pour ce stock")
            
        logger.info(f"Nombre d'items à distribuer: {len(stock_items)}")
        
        # Récupération des magasins actifs et tri par poids décroissant
        logger.info("Récupération des magasins actifs")
        stores = supabase.table('stores').select('*').eq('is_active', True).execute()
        if not stores.data:
            raise Exception("Aucun magasin actif trouvé")
            
        # Tri des magasins par poids décroissant
        sorted_stores = sorted(stores.data, key=lambda x: x['weight'], reverse=True)
        logger.info(f"Nombre de magasins actifs: {len(sorted_stores)}")
        
        # Distribution initiale
        logger.info("Début de la distribution initiale")
        distribution_items = []
        
        # Pour chaque item (EAN) à distribuer
        for item in stock_items:
            # Récupération du nombre maximum de magasins pour cet EAN
            nb_max_store = item.get('nb_max_store_final', len(sorted_stores))
            logger.info(f"Nombre maximum de magasins pour l'EAN {item['ean_code']}: {nb_max_store}")
            
            # Sélection des X premiers magasins
            selected_stores = sorted_stores[:nb_max_store]
            
            # Calcul du poids total des magasins sélectionnés
            total_weight = sum(store['weight'] for store in selected_stores)
            
            # Distribution de la quantité selon les poids normalisés
            for store in selected_stores:
                # Normalisation du poids pour que la somme fasse 100%
                normalized_weight = store['weight'] / total_weight
                quantity_for_store = math.floor(item['quantity'] * normalized_weight)
                
                if quantity_for_store > 0:
                    distribution_items.append({
                        'product_id': item['product_id'],
                        'store_id': store['id'],
                        'quantity': quantity_for_store,
                        'ean_code': item['ean_code']
                    })
        
        if not distribution_items:
            raise Exception("Aucun item de distribution créé")
            
        return distribution_items
        
    except Exception as e:
        logger.error(f"Erreur lors du calcul de la distribution: {str(e)}")
        raise

def verify_distribution_criteria(supabase: Client, distribution_items: List[Dict]) -> List[Dict]:
    """
    Vérifie les critères de distribution pour chaque item
    
    Args:
        supabase: Client Supabase
        distribution_items: Liste des items de distribution à vérifier
        
    Returns:
        List[Dict]: Liste des items de distribution avec les critères vérifiés
    """
    try:
        logger.info("Récupération des paramètres actifs")
        params = get_active_parameters(supabase)
        if not params:
            raise Exception("Impossible de continuer sans paramètres actifs")
            
        logger.info(f"Paramètres récupérés - min_quantity_per_ean: {params['min_quantity_per_ean']}, min_quantity_per_reference: {params['min_quantity_per_reference']}")
        
        # Regrouper les items par référence pour calculer les quantités totales
        items_by_reference = {}
        for item in distribution_items:
            if item['product_id'] not in items_by_reference:
                items_by_reference[item['product_id']] = []
            items_by_reference[item['product_id']].append(item)
        
        # Calculer les quantités totales par référence
        total_quantities_by_reference = {
            product_id: sum(item['quantity'] for item in items)
            for product_id, items in items_by_reference.items()
        }
        
        logger.info(f"Quantités totales par référence: {total_quantities_by_reference}")
        
        # Vérification des critères pour chaque item
        for item in distribution_items:
            # Vérification du critère EAN
            item['meets_ean_criteria'] = item['quantity'] >= params['min_quantity_per_ean']
            
            # Vérification du critère référence
            total_reference_quantity = total_quantities_by_reference[item['product_id']]
            item['meets_reference_criteria'] = total_reference_quantity >= params['min_quantity_per_reference']
            
            # Ajout de la quantité totale par référence
            item['total_reference_quantity'] = total_reference_quantity
        
        return distribution_items
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification des critères: {str(e)}")
        raise

def create_distribution(supabase: Client, stock_to_dispatch_id: str, user_id: str) -> Optional[str]:
    """
    Crée une nouvelle distribution dans la base de données
    
    Args:
        supabase: Client Supabase
        stock_to_dispatch_id: ID du stock à distribuer
        user_id: ID de l'utilisateur qui crée la distribution
        
    Returns:
        Optional[str]: ID de la distribution créée ou None en cas d'erreur
    """
    try:
        logger.info("Création de la distribution")
        
        # Récupération du stock_to_dispatch pour le nom
        stock = supabase.table('stock_to_dispatch').select('name').eq('id', stock_to_dispatch_id).execute()
        if not stock.data:
            raise Exception("Stock_to_dispatch non trouvé")
            
        stock_name = stock.data[0]['name']
        distribution_name = f"Distribution pour {stock_name}"
        
        # Création de la distribution
        distribution = supabase.table('distributions').insert({
            'name': distribution_name,
            'status': 'created',
            'created_by': user_id,
            'stock_to_dispatch_id': stock_to_dispatch_id
        }).execute()
        
        if not distribution.data:
            raise Exception("Erreur lors de la création de la distribution")
            
        return distribution.data[0]['id']
        
    except Exception as e:
        logger.error(f"Erreur lors de la création de la distribution: {str(e)}")
        raise Exception("Erreur lors de la création de la distribution. Vérifiez les permissions et la structure de la table distributions.")

def create_distribution_items(supabase: Client, distribution_id: str, items: List[Dict]) -> List[Dict]:
    """
    Crée les items de distribution.
    
    Args:
        supabase (Client): Client Supabase
        distribution_id (str): ID de la distribution
        items (List[Dict]): Liste des items à créer
        
    Returns:
        List[Dict]: Liste des items créés ou liste vide en cas d'erreur
    """
    try:
        # Log de la structure des items
        logger.info(f"Structure des items à créer: {items[0] if items else 'Aucun item'}")
        
        items_to_create = [{
            'distribution_id': distribution_id,
            'product_id': item['product_id'],
            'store_id': item['store_id'],
            'quantity': item['quantity'],
            'ean_code': item['ean_code'],
            'meets_ean_criteria': item['meets_ean_criteria'],
            'meets_reference_criteria': item['meets_reference_criteria']
        } for item in items]

        # Log des items à créer
        logger.info(f"Items à créer: {items_to_create[0] if items_to_create else 'Aucun item'}")

        response = supabase.table('distribution_items').insert(items_to_create).execute()
        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Erreur lors de la création des items de distribution: {str(e)}")
        return []

def update_stock_to_dispatch_status(supabase: Client, stock_to_dispatch_id: str, status: str) -> bool:
    """
    Met à jour le statut du stock_to_dispatch.
    
    Args:
        supabase (Client): Client Supabase
        stock_to_dispatch_id (str): ID du stock à dispatcher
        status (str): Nouveau statut
        
    Returns:
        bool: True si la mise à jour a réussi, False sinon
    """
    try:
        response = supabase.table('stock_to_dispatch').update({
            'status': status
        }).eq('id', stock_to_dispatch_id).execute()
        return bool(response.data)
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du statut: {str(e)}")
        return False 