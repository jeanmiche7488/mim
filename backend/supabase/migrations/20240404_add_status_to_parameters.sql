-- Add status column
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Create an index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_parameters_status ON parameters(status);

-- Create a function to manage parameter versions
CREATE OR REPLACE FUNCTION manage_parameter_versions()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new parameter is being set as active, set all others to archived
    IF NEW.status = 'active' THEN
        UPDATE parameters
        SET status = 'archived'
        WHERE id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically manage versions
DROP TRIGGER IF EXISTS trigger_manage_parameter_versions ON parameters;
CREATE TRIGGER trigger_manage_parameter_versions
    AFTER INSERT OR UPDATE OF status
    ON parameters
    FOR EACH ROW
    EXECUTE FUNCTION manage_parameter_versions();

-- Enable Row Level Security
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON parameters;
CREATE POLICY "Enable read access for authenticated users" ON parameters
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON parameters;
CREATE POLICY "Enable insert access for authenticated users" ON parameters
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON parameters;
CREATE POLICY "Enable update access for authenticated users" ON parameters
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add a comment to explain the status values
COMMENT ON COLUMN parameters.status IS 'Status of the parameters: active (current version) or archived (old version)'; 