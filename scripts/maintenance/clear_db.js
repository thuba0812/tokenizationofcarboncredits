import { createClient } from '@supabase/supabase-js'




const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearDB() {
  console.log("Clearing LISTINGS...")
  const { error: err1 } = await supabase.from('LISTINGS').delete().neq('listing_id', 0)
  if (err1) console.error("Error clearing LISTINGS:", err1)
  else console.log("✅ LISTINGS cleared")

  console.log("Clearing TOKEN_ACTIVITY_LOGS...")
  const { error: err2 } = await supabase.from('TOKEN_ACTIVITY_LOGS').delete().neq('log_id', 0)
  if (err2) console.error("Error clearing TOKEN_ACTIVITY_LOGS:", err2)
  else console.log("✅ TOKEN_ACTIVITY_LOGS cleared")
}

clearDB()
