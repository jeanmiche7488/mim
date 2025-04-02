-- Mise à jour des tables existantes et ajout de nouvelles tables

-- Table des magasins
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(20) NOT NULL UNIQUE,
    ean VARCHAR(13),
    designation VARCHAR(255) NOT NULL,
    segment VARCHAR(100),
    subfamily VARCHAR(255),
    pvp DECIMAL(10,2),
    price_category CHAR(1),
    dispatch_category CHAR(1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des stocks
CREATE TABLE IF NOT EXISTS stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    store_id UUID REFERENCES stores(id),
    quantity INTEGER NOT NULL,
    available_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, store_id, available_date)
);

-- Table des distributions
CREATE TABLE IF NOT EXISTS distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des items de distribution
CREATE TABLE IF NOT EXISTS distribution_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_id UUID REFERENCES distributions(id),
    product_id UUID REFERENCES products(id),
    source_store_id UUID REFERENCES stores(id),
    target_store_id UUID REFERENCES stores(id),
    quantity INTEGER NOT NULL,
    available_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_store ON stock(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_date ON stock(available_date);
CREATE INDEX IF NOT EXISTS idx_distribution_items_distribution ON distribution_items(distribution_id);
CREATE INDEX IF NOT EXISTS idx_distribution_items_product ON distribution_items(product_id);
CREATE INDEX IF NOT EXISTS idx_distribution_items_stores ON distribution_items(source_store_id, target_store_id);

-- Triggers pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_updated_at
    BEFORE UPDATE ON stock
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributions_updated_at
    BEFORE UPDATE ON distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distribution_items_updated_at
    BEFORE UPDATE ON distribution_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_items ENABLE ROW LEVEL SECURITY;

-- Policies pour les magasins
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les magasins"
    ON stores FOR SELECT
    TO authenticated
    USING (true);

-- Policies pour les produits
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les produits"
    ON products FOR SELECT
    TO authenticated
    USING (true);

-- Policies pour le stock
CREATE POLICY "Les utilisateurs authentifiés peuvent voir le stock"
    ON stock FOR SELECT
    TO authenticated
    USING (true);

-- Policies pour les distributions
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les distributions"
    ON distributions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des distributions"
    ON distributions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Policies pour les items de distribution
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les items de distribution"
    ON distribution_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des items de distribution"
    ON distribution_items FOR INSERT
    TO authenticated
    WITH CHECK (true); 