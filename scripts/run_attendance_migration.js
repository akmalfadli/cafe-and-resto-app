// Run attendance migration via Supabase Management API
// Usage: node scripts/run_attendance_migration.js

const SUPABASE_URL = 'https://egelghutkpdddafmribt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZWxnaHV0a3BkZGRhZm1yaWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDIzMDksImV4cCI6MjEwMDIxODMwOX0.Be4R3FPRhKBi_FxgiltH4pCb3NBonPNcXMmjZevc3Tk';

async function checkTableExists() {
  // Try to query the attendances table
  const res = await fetch(`${SUPABASE_URL}/rest/v1/attendances?select=id&limit=1`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  
  if (res.status === 200) {
    console.log('✅ attendances table EXISTS and is accessible.');
    return true;
  } else {
    const body = await res.text();
    console.log(`❌ attendances table check returned status ${res.status}: ${body}`);
    return false;
  }
}

async function checkSettingsKeys() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value&key=in.(outletLat,outletLng,maxAttendanceRadius,enableGpsValidation)`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });

  if (res.ok) {
    const data = await res.json();
    console.log('Settings GPS keys found:', data);
  } else {
    console.log('Settings query failed:', await res.text());
  }
}

checkTableExists();
checkSettingsKeys();
