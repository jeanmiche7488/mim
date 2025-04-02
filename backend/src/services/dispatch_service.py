from typing import List, Optional, Dict
from datetime import datetime
from ..config.supabase import supabase, TABLES
from ..models.dispatch import (
    DispatchRequest,
    DispatchResult,
    DispatchCalculation,
    DispatchHistory,
    DispatchStatus,
    StoreCategory
)
from ..services.parameter_service import ParameterService

class DispatchService:
    @staticmethod
    async def calculate_dispatch(requests: List[DispatchRequest]) -> DispatchCalculation:
        """Calcule la distribution optimale des produits"""
        # Récupérer les paramètres de la plateforme
        parameters = await ParameterService.get_parameters()
        
        # M2: Filtrage par catégorie
        m2_results = await DispatchService._filter_by_category(requests)
        
        # M3: Contrainte de quantité minimale au niveau référence
        m3_results = await DispatchService._apply_min_quantity_constraint(m2_results, parameters.min_reference_quantity)
        
        # M4: Min(M2, M3)
        m4_results = await DispatchService._apply_min_constraint(m2_results, m3_results)
        
        # M5: Calcul du nombre max de magasins basé sur la diversité des tailles (niveau EAN)
        m5_results = await DispatchService._apply_diversity_criterion(m4_results, parameters.min_ean_quantity)
        
        # M6: Min(M4, M5) pour le nombre final de magasins
        m6_results = await DispatchService._apply_store_count_constraint(m4_results, m5_results)
        
        return DispatchCalculation(
            m2_result=m2_results,
            m3_result=m3_results,
            m4_result=m4_results,
            m5_result=m5_results,
            m6_result=m6_results
        )

    @staticmethod
    async def _filter_by_category(requests: List[DispatchRequest]) -> List[DispatchResult]:
        """M2: Filtre les magasins par catégorie"""
        results = []
        for req in requests:
            if req.category in [StoreCategory.A, StoreCategory.B, StoreCategory.C]:
                results.append(DispatchResult(
                    store_id=req.store_id,
                    product_id=req.product_id,
                    quantity=req.quantity,
                    status=DispatchStatus.PENDING,
                    category=req.category
                ))
        return results

    @staticmethod
    async def _apply_min_quantity_constraint(results: List[DispatchResult], min_reference_quantity: int) -> List[DispatchResult]:
        """M3: Applique la contrainte de quantité minimale au niveau référence"""
        filtered_results = []
        for result in results:
            if result.quantity >= min_reference_quantity:
                filtered_results.append(result)
        return filtered_results

    @staticmethod
    async def _apply_min_constraint(m2: List[DispatchResult], m3: List[DispatchResult]) -> List[DispatchResult]:
        """M4: Applique le minimum entre M2 et M3"""
        m4_results = []
        for result_m2 in m2:
            for result_m3 in m3:
                if result_m2.store_id == result_m3.store_id and result_m2.product_id == result_m3.product_id:
                    m4_results.append(DispatchResult(
                        store_id=result_m2.store_id,
                        product_id=result_m2.product_id,
                        quantity=min(result_m2.quantity, result_m3.quantity),
                        status=DispatchStatus.PENDING,
                        category=result_m2.category
                    ))
        return m4_results

    @staticmethod
    async def _apply_diversity_criterion(results: List[DispatchResult], min_ean_quantity: int) -> List[DispatchResult]:
        """M5: Calcule le nombre maximum de magasins basé sur la diversité des tailles (niveau EAN)"""
        # Grouper les résultats par produit
        product_groups: Dict[int, List[DispatchResult]] = {}
        for result in results:
            if result.product_id not in product_groups:
                product_groups[result.product_id] = []
            product_groups[result.product_id].append(result)

        m5_results = []
        for product_id, product_results in product_groups.items():
            # Calculer le nombre maximum de magasins pour ce produit
            total_quantity = sum(r.quantity for r in product_results)
            max_stores = total_quantity // min_ean_quantity

            # Créer un résultat M5 pour chaque magasin avec le nombre max de magasins
            for result in product_results:
                m5_results.append(DispatchResult(
                    store_id=result.store_id,
                    product_id=result.product_id,
                    quantity=result.quantity,
                    status=DispatchStatus.PENDING,
                    category=result.category,
                    diversity_score=max_stores  # Utiliser le nombre max de magasins comme score
                ))

        return m5_results

    @staticmethod
    async def _apply_store_count_constraint(m4_results: List[DispatchResult], m5_results: List[DispatchResult]) -> List[DispatchResult]:
        """M6: Calcule le nombre final de magasins (Min(M4, M5))"""
        # Grouper les résultats par produit
        product_groups: Dict[int, List[DispatchResult]] = {}
        for result in m4_results:
            if result.product_id not in product_groups:
                product_groups[result.product_id] = []
            product_groups[result.product_id].append(result)

        m6_results = []
        for product_id, product_results in product_groups.items():
            # Trouver le score de diversité (M5) pour ce produit
            m5_score = next(
                (r.diversity_score for r in m5_results if r.product_id == product_id),
                float('inf')
            )

            # Calculer le nombre final de magasins (Min(M4, M5))
            max_stores = min(len(product_results), int(m5_score))

            # Récupérer les ventes historiques pour ce produit
            historical_sales = await DispatchService._get_historical_sales(product_id)
            
            # Trier les magasins par ventes historiques décroissantes
            sorted_stores = sorted(
                product_results,
                key=lambda x: historical_sales.get(x.store_id, 0),
                reverse=True
            )

            # Prendre les max_stores premiers magasins
            for result in sorted_stores[:max_stores]:
                m6_results.append(DispatchResult(
                    store_id=result.store_id,
                    product_id=result.product_id,
                    quantity=result.quantity,
                    status=DispatchStatus.COMPLETED,
                    category=result.category,
                    diversity_score=m5_score
                ))

        return m6_results

    @staticmethod
    async def _get_historical_sales(product_id: int) -> Dict[int, float]:
        """Récupère les ventes historiques par magasin pour un produit"""
        try:
            response = supabase.table(TABLES["historical_sales"]).select(
                "store_id",
                "quantity"
            ).eq("product_id", product_id).execute()
            
            return {item["store_id"]: item["quantity"] for item in response.data}
        except Exception:
            return {}  # En cas d'erreur, retourner un dictionnaire vide

    @staticmethod
    async def save_dispatch_history(calculation: DispatchCalculation) -> List[DispatchHistory]:
        """Sauvegarde l'historique des dispatches"""
        history_items = []
        for result in calculation.m6_result:
            history = DispatchHistory(
                calculation_id=calculation.id,
                store_id=result.store_id,
                product_id=result.product_id,
                quantity=result.quantity,
                status=result.status,
                timestamp=result.timestamp,
                category=result.category
            )
            response = supabase.table(TABLES["dispatch_history"]).insert(history.dict()).execute()
            history_items.append(DispatchHistory(**response.data[0]))
        return history_items

    @staticmethod
    async def get_dispatch_history() -> List[DispatchHistory]:
        """Récupère l'historique des dispatches"""
        response = supabase.table(TABLES["dispatch_history"]).select("*").order("timestamp", desc=True).execute()
        return [DispatchHistory(**item) for item in response.data]

    @staticmethod
    async def get_dispatch_details(dispatch_id: int) -> Optional[DispatchHistory]:
        """Récupère les détails d'un dispatch spécifique"""
        response = supabase.table(TABLES["dispatch_history"]).select("*").eq("id", dispatch_id).execute()
        if response.data:
            return DispatchHistory(**response.data[0])
        return None 