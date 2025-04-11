-- Créer la fonction exec_sql qui permet d'exécuter du SQL dynamique
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated; 