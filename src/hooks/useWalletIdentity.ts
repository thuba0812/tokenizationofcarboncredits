import { useEffect, useState } from 'react'
import { supabase } from '../database/supabase'

interface WalletIdentity {
  walletId: number | null
  organizationId: number | null
}

export function useWalletIdentity(address: string | null) {
  const [identity, setIdentity] = useState<WalletIdentity>({
    walletId: null,
    organizationId: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIdentity() {
      if (!address) {
        setIdentity({ walletId: null, organizationId: null })
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const { data, error } = await supabase
          .from('WALLETS')
          .select('wallet_id, organization_id')
          .ilike('wallet_address', address)
          .single()

        if (error) {
          console.error('Error fetching wallet identity:', error)
          setIdentity({ walletId: null, organizationId: null })
          return
        }

        setIdentity({
          walletId: data?.wallet_id ?? null,
          organizationId: data?.organization_id ?? null,
        })
      } catch (err) {
        console.error(err)
        setIdentity({ walletId: null, organizationId: null })
      } finally {
        setLoading(false)
      }
    }

    void fetchIdentity()
  }, [address])

  return {
    walletId: identity.walletId,
    organizationId: identity.organizationId,
    loading,
  }
}
