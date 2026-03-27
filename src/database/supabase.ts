import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  'https://ipdtrwebydpevdoxwmxf.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZHRyd2VieWRwZXZkb3h3bXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzc5NDAsImV4cCI6MjA4OTg1Mzk0MH0.xG3KH6ouGuSUc30ensUqtwp4kRDFu6D_N_G-CMxe7h4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
