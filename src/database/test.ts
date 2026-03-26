import { createClient } from '@supabase/supabase-js'
import process from 'process'

import 'dotenv/config'

// Kết nối Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test function
async function testSelectProjects() {
  console.log('Đang kết nối Supabase...')
  console.log(`URL: ${supabaseUrl}`)
  console.log('')

  try {
    // Query: SELECT * FROM "PROJECTS"
    console.log('Gửi query: SELECT * FROM "PROJECTS"')
    const { data, error } = await supabase
      .from('PROJECTS')
      .select('*')

    if (error) {
      console.error('   Lỗi từ Supabase:')
      console.error('   Code:', error.code)
      console.error('   Message:', error.message)
      console.error('   Details:', error.details)
      return
    }

    // In kết quả
    console.log('')
    console.log('Kết nối thành công!')
    console.log('')
    console.log(`Số lượng PROJECTS: ${data?.length || 0}`)
    console.log('')

    if (data && data.length > 0) {
      console.log('Dữ liệu chi tiết:')
      console.log('─'.repeat(80))
      data.forEach((project, index) => {
        console.log(`\n[${index + 1}] Project ID: ${project.project_id}`)
        console.log(`    Code: ${project.project_code}`)
        console.log(`    Name: ${project.project_name}`)
        console.log(`    Sector: ${project.sector}`)
        console.log(`    Country: ${project.country}`)
        console.log(`    Status: ${project.project_status}`)
        console.log(`    CO2 Credit: ${project.remaining_carbon_credit}`)
        console.log(`    Created: ${project.created_at}`)
      })
      console.log('\n' + '─'.repeat(80))
    } else {
      console.log('Không có dữ liệu trong bảng PROJECTS')
      console.log('   Suggestion: Chạy seed data SQL từ supabase-schema.sql')
    }

    // In toàn bộ JSON
    console.log('\nDữ liệu JSON (raw):')
    console.log(JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Lỗi JavaScript:')
    console.error(err)
  }
}

// Chạy test
testSelectProjects().then(() => {
  console.log('\nTest hoàn thành!')
  process.exit(0)
}).catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
