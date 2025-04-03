-- Enable RLS on stores table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON stores;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON stores;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON stores
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert access for all users" ON stores
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON stores
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON stores
    FOR DELETE
    USING (true); 