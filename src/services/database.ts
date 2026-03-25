import { supabase } from '../database/supabase'

// ─── Projects ──────────────────────────────────────────────────────────────
export const getProjects = async () => {
  const { data, error } = await supabase
    .from('PROJECTS')
    .select(`
      project_id,
      project_code,
      project_name,
      project_description,
      sector,
      country,
      province_city,
      ward_commune,
      start_date,
      end_date,
      remaining_emission_reduction,
      remaining_carbon_credit,
      project_status,
      ORGANIZATIONS (
        organization_name,
        business_registration_no,
        tax_code,
        headquarters_address,
        phone_number,
        email,
        legal_representative
      )
    `)

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data || []
}

export const getProjectById = async (id: number) => {
  const { data, error } = await supabase
    .from('PROJECTS')
    .select(`
      *,
      ORGANIZATIONS (
        organization_name,
        business_registration_no,
        tax_code,
        headquarters_address,
        phone_number,
        email,
        legal_representative
      ),
      CREDITS (
        credit_id,
        credit_code,
        amount,
        issuance_year
      )
    `)
    .eq('project_id', id)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  return data
}

// ─── Listings (Marketplace) ─────────────────────────────────────────────────
export const getListings = async () => {
  const { data, error } = await supabase
    .from('LISTINGS')
    .select(`
      listing_id,
      listing_price,
      listed_amount,
      listing_status,
      created_at,
      BATCH_DETAIL (
        batch_credit_id,
        minted_amount,
        TOKEN_BATCHES (
          batch_id,
          token_id_on_chain,
          batch_status
        ),
        CREDITS (
          credit_id,
          credit_code,
          amount,
          issuance_year,
          PROJECTS (
            project_id,
            project_code,
            project_name,
            project_description,
            sector,
            country
          )
        )
      ),
      WALLETS (
        wallet_address,
        ORGANIZATIONS (
          organization_name
        )
      )
    `)
    .eq('listing_status', 'OPEN')

  if (error) {
    console.error('Error fetching listings:', error)
    return []
  }

  return data || []
}

// ─── Trades (Transactions) ──────────────────────────────────────────────────
export const getTrades = async () => {
  const { data, error } = await supabase
    .from('TRADES')
    .select(`
      trade_id,
      trade_amount,
      unit_price,
      fee_amount,
      trade_status,
      executed_at,
      created_at,
      trade_tx_hash,
      LISTINGS (
        listing_price,
        BATCH_DETAIL (
          CREDITS (
            credit_code,
            PROJECTS (
              project_code,
              project_name
            )
          )
        )
      ),
      WALLETS!buyer_wallet_id (
        wallet_address,
        ORGANIZATIONS (
          organization_name
        )
      )
    `)
    .eq('trade_status', 'COMPLETED')
    .order('executed_at', { ascending: false })

  if (error) {
    console.error('Error fetching trades:', error)
    return []
  }

  return data || []
}

// ─── Organizations ─────────────────────────────────────────────────────────
export const getOrganizations = async () => {
  const { data, error } = await supabase
    .from('ORGANIZATIONS')
    .select('*')

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return data || []
}

// Bạn có thể thêm các hàm khác như create, update, delete tùy theo nhu cầu