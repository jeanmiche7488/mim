-- Add status column
ALTER TABLE python_scripts ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Create an index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_python_scripts_status ON python_scripts(status);

-- Create a function to manage script versions
CREATE OR REPLACE FUNCTION manage_python_script_versions()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new script is being set as active, set all other scripts with the same name to archived
    IF NEW.status = 'active' THEN
        UPDATE python_scripts
        SET status = 'archived'
        WHERE name = NEW.name 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically manage versions
DROP TRIGGER IF EXISTS trigger_manage_python_script_versions ON python_scripts;
CREATE TRIGGER trigger_manage_python_script_versions
    AFTER INSERT OR UPDATE OF status
    ON python_scripts
    FOR EACH ROW
    EXECUTE FUNCTION manage_python_script_versions();

-- Enable Row Level Security
ALTER TABLE python_scripts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON python_scripts;
CREATE POLICY "Enable read access for authenticated users" ON python_scripts
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON python_scripts;
CREATE POLICY "Enable insert access for authenticated users" ON python_scripts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON python_scripts;
CREATE POLICY "Enable update access for authenticated users" ON python_scripts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add a comment to explain the status values
COMMENT ON COLUMN python_scripts.status IS 'Status of the script: active (current version) or archived (old version)'; 