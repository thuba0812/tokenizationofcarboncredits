import { useState, useEffect, useCallback } from 'react';
import { portfolioRepository } from '../repositories/PortfolioRepository';
import type { PurchasedCredit, Transaction, Certificate } from '../types';

export function usePortfolio(walletId: number) {
  const [credits, setCredits] = useState<PurchasedCredit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        portfolioRepository.getPurchasedCredits(walletId),
        portfolioRepository.getTransactions(walletId)
      ]);
      setCredits(c);
      setTransactions(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    if (walletId) {
      void fetchData();
    }
  }, [fetchData, walletId]);

  return { credits, transactions, loading, refetch: fetchData };
}

export function useCertificates(orgId: number) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCerts() {
      setLoading(true);
      try {
        const data = await portfolioRepository.getCertificates(orgId);
        setCertificates(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (orgId) fetchCerts();
  }, [orgId]);

  return { certificates, loading };
}
