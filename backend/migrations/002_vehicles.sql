CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('truck', 'mini_truck', 'van', 'bike')),
  plate VARCHAR(60) NOT NULL,
  capacity_kg INTEGER NOT NULL CHECK (capacity_kg > 0),
  odometer_km NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (odometer_km >= 0),
  status VARCHAR(40) NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'on_trip', 'maintenance', 'out_of_service', 'retired')
  ),
  region VARCHAR(80),
  price_per_km NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_per_km >= 0),
  retired BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, plate)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_organization_id ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);

DROP TRIGGER IF EXISTS set_vehicles_updated_at ON vehicles;
CREATE TRIGGER set_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
