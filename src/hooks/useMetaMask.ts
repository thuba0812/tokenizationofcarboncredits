import { useState, useCallback, useEffect } from 'react'
import { BrowserProvider } from 'ethers'
import type { WalletState, UserRole } from '../types'
import { supabase } from '../database/supabase'

export function useMetaMask() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0',
    isConnected: false,
    role: 'GUEST',
  })
  const [error, setError] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState(true)

  // Helper to fetch account details and set state
  const loadAccountData = useCallback(async (address: string, shouldRedirect: boolean = false) => {
    try {
      const eth = (window as any).ethereum
      const provider = new BrowserProvider(eth)
      const balance = await provider.getBalance(address)
      const balanceEth = balance.toString()

      let assignedRole: UserRole = 'GUEST'
      try {
        const { data } = await supabase
          .from('WALLETS')
          .select(`ORGANIZATIONS ( organization_type )`)
          .ilike('wallet_address', address)
          .single()
        
        const orgData = data?.ORGANIZATIONS as any
        assignedRole = (Array.isArray(orgData) ? orgData[0]?.organization_type : orgData?.organization_type) || 'GUEST'
      } catch (dbError) {
        console.error('Error fetching role from DB:', dbError)
      }

      setWallet({
        address,
        balance: (Number(balanceEth) / 1e18).toFixed(4),
        isConnected: true,
        role: assignedRole,
      })

      if (shouldRedirect) {
        let defaultPath = '/marketplace'
        if (assignedRole === 'ENTERPRISE') defaultPath = '/seller'
        else if (assignedRole === 'REGULATORY_AGENCY') defaultPath = '/moderator'
        
        // Prevent redirecting if user is currently viewing a detail page on the marketplace
        const isMarketplaceDetail = /^\/marketplace\/[^/]+$/.test(window.location.pathname);
        if (!isMarketplaceDetail && window.location.pathname !== defaultPath) {
          window.location.href = defaultPath
        }
      }

      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }, [])

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false
    const eth = (window as any).ethereum
    return !!eth && eth.isMetaMask === true
  }, [])

  // Connect wallet
  const connect = useCallback(async (shouldRedirect = true) => {
    try {
      setError('')

      if (!isMetaMaskInstalled()) {
        setError('Vui lòng cài đặt MetaMask extension')
        return false
      }

      const eth = (window as any).ethereum
      const provider = new BrowserProvider(eth)
      
      // Request new account selection every time (won't cache)
      const accounts = await provider.send('eth_requestAccounts', [])

      if (!accounts || accounts.length === 0) {
        setError('Không thể lấy địa chỉ ví')
        return false
      }

      const address = accounts[0]
      await loadAccountData(address, shouldRedirect) // Redirect on explicit connect only if requested

      return true
    } catch (err: any) {
      if (err.code === -32002) {
        setError('MetaMask connection request đang pending')
      } else if (err.code === 4001) {
        setError('Bạn đã từ chối kết nối MetaMask')
      } else {
        setError(err.message || 'Lỗi kết nối MetaMask')
      }
      return false
    }
  }, [isMetaMaskInstalled])

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      const eth = (window as any).ethereum
      
      // Revoke all permissions from MetaMask
      if (eth && eth.request) {
        await eth.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        }).catch(() => {
          // Some MetaMask versions don't support this, that's okay
        })
      }
    } catch (err) {
      // Silently fail if revoke doesn't work
    }

    // Clear all local state
    setWallet({
      address: null,
      balance: '0',
      isConnected: false,
      role: 'GUEST',
    })
    setError('')
    localStorage.removeItem('walletAddress')
    localStorage.removeItem('walletBalance')
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) {
      setIsInitializing(false)
      return
    }

    const eth = (window as any).ethereum

    // Check if already connected (F5 refresh)
    const init = async () => {
      try {
        const accounts = await eth.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          await loadAccountData(accounts[0], false) // Do NOT redirect on F5
        }
      } catch (err) {
        console.error('Auto login failed', err)
      } finally {
        setIsInitializing(false)
      }
    }
    init()

    const handleAccountsChanged = async (accounts: unknown) => {
      const accountsList = Array.isArray(accounts) ? accounts : []
      if (accountsList.length === 0) {
        disconnect()
      } else {
        const newAddress = String(accountsList[0])
        await loadAccountData(newAddress, true) // Redirect when account explicitly changed in metamask
      }
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    eth.on('accountsChanged', handleAccountsChanged)
    eth.on('chainChanged', handleChainChanged)

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged)
      eth.removeListener('chainChanged', handleChainChanged)
    }
  }, [disconnect, isMetaMaskInstalled, loadAccountData])

  return {
    wallet,
    connect,
    disconnect,
    error,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    isInitializing,
  }
}
