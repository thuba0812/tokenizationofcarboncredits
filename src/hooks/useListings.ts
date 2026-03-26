import { useState, useEffect } from 'react';
import { listingRepository } from '../repositories/ListingRepository';
import type { MarketplaceItem } from '../repositories/ListingRepository';

export function useListings() {
  const [listings, setListings] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const data = await listingRepository.getActiveListings();
        setListings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  return { listings, loading };
}
