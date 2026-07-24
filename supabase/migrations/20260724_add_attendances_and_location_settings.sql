-- Create attendances table for employee Clock In / Clock Out with GPS validation
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  clock_in_lat NUMERIC,
  clock_in_lng NUMERIC,
  clock_out_lat NUMERIC,
  clock_out_lng NUMERIC,
  distance_meters NUMERIC DEFAULT 0,
  is_valid_location BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for attendances
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for attendances" ON attendances FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for attendances" ON attendances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access for attendances" ON attendances FOR UPDATE USING (true);

-- Insert settings default keys for GPS Geofencing if not exists
INSERT INTO settings (key, value) VALUES
  ('outletLat', -6.200000),
  ('outletLng', 106.816666),
  ('maxAttendanceRadius', 100),
  ('enableGpsValidation', true)
ON CONFLICT (key) DO NOTHING;
