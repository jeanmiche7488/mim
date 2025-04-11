-- Create stock_to_dispatch table
CREATE TABLE IF NOT EXISTS stock_to_dispatch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parameters_id UUID NOT NULL REFERENCES parameters(id),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create stock_to_dispatch_items table
CREATE TABLE IF NOT EXISTS stock_to_dispatch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_to_dispatch_id UUID NOT NULL REFERENCES stock_to_dispatch(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    ean_code VARCHAR(13),
    size VARCHAR(10),
    quantity INTEGER NOT NULL,
    expedition_date DATE,
    reference_not_found BOOLEAN DEFAULT false,
    calculation_completed BOOLEAN DEFAULT false,
    nb_max_store_m4_ref INTEGER DEFAULT 0,
    nb_max_store_m5_ean INTEGER DEFAULT 0,
    nb_max_store_final INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stock_to_dispatch_items_stock_to_dispatch_id 
    ON stock_to_dispatch_items(stock_to_dispatch_id);
CREATE INDEX IF NOT EXISTS idx_stock_to_dispatch_items_product_id 
    ON stock_to_dispatch_items(product_id);

-- Enable RLS
ALTER TABLE stock_to_dispatch ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_to_dispatch_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les stock_to_dispatch"
    ON stock_to_dispatch FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des stock_to_dispatch"
    ON stock_to_dispatch FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier leurs stock_to_dispatch"
    ON stock_to_dispatch FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Les utilisateurs authentifiés peuvent supprimer leurs stock_to_dispatch"
    ON stock_to_dispatch FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Les utilisateurs authentifiés peuvent voir les stock_to_dispatch_items"
    ON stock_to_dispatch_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des stock_to_dispatch_items"
    ON stock_to_dispatch_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les stock_to_dispatch_items"
    ON stock_to_dispatch_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent supprimer les stock_to_dispatch_items"
    ON stock_to_dispatch_items FOR DELETE
    TO authenticated
    USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_stock_to_dispatch_updated_at
    BEFORE UPDATE ON stock_to_dispatch
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_to_dispatch_items_updated_at
    BEFORE UPDATE ON stock_to_dispatch_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 