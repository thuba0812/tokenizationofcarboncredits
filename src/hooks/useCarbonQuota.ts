import { useEffect, useState } from 'react'
import { supabase } from '../database/supabase'

export function useCarbonQuota(organizationId: number | null) {
  const [allocatedQuota, setAllocatedQuota] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuota() {
      if (!organizationId) {
        setAllocatedQuota(0)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('CARBON_QUOTAS')
          .select('allocated_quota')
          .eq('organization_id', organizationId)

        if (error) {
          console.error('Error fetching carbon quota:', error)
          setAllocatedQuota(0)
          return
        }

        if (data && data.length > 0) {
          const totalQuota = data.reduce((sum, row) => sum + Number(row.allocated_quota || 0), 0)
          setAllocatedQuota(totalQuota)
        } else {
          setAllocatedQuota(0)
        }
      } catch (err) {
        console.error(err)
        setAllocatedQuota(0)
      } finally {
        setLoading(false)
      }
    }

    void fetchQuota()
  }, [organizationId])

  return { allocatedQuota, loading }
}
