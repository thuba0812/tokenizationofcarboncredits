import { useState, useCallback, useEffect } from 'react'
import { BrowserProvider } from 'ethers'
import type { Contract } from 'ethers'
import type { WalletState, UserRole } from '../types'
import { supabase } from '../database/supabase'
import { CHAIN_ID, NETWORK_NAME, RPC_URL } from '../contracts/contractConfig'

/** Error shape from MetaMask / ethers.js RPC calls */
interface EthersError extends Error {
  code?: number | string
}

export function useMetaMask() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0',
    usdtBalance: '0',
    isConnected: false,
    role: 'GUEST',
  })
  const [error, setError] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState(true)

  const switchNetwork = useCallback(async () => {
    const eth = window.ethereum
    if (!eth) return false

    const hexChainId = `0x${CHAIN_ID.toString(16)}`
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      })
      return true
    } catch (thrown: unknown) {
      const error = thrown as EthersError
      if (error.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: NETWORK_NAME,
                rpcUrls: [RPC_URL],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              },
            ],
          })
          return true
        } catch (addError) {
          console.error('Failed to add network', addError)
          return false
        }
      }
      console.error('Failed to switch network', error)
      return false
    }
  }, [])

  const getNetworkError = useCallback(async (provider: BrowserProvider) => {
    const network = await provider.getNetwork()
    const chainId = Number(network.chainId)
    if (chainId !== CHAIN_ID) {
      return `MetaMask đang ở sai mạng. Hãy chuyển sang ${NETWORK_NAME} (chainId ${CHAIN_ID}).`
    }
    return ''
  }, [])

  // Helper to fetch account details and set state
  const loadAccountData = useCallback(async (address: string, shouldRedirect: boolean = false) => {
    try {
      const eth = window.ethereum
      if (!eth) {
        setError('MetaMask chưa được cài đặt')
        return false
      }
      const provider = new BrowserProvider(eth)
      const networkError = await getNetworkError(provider)
      if (networkError) {
        setError(networkError)
        return false
      }
      const balance = await provider.getBalance(address)
      const balanceEth = balance.toString()

      // Fetch USDT Balance
      let balanceUsdt = '0'
      try {
        const { Contract, formatUnits } = await import('ethers')
        const { MOCK_USDT_ADDRESS, USDT_DECIMALS } = await import('../contracts/contractConfig')
        const { MockUSDTABI } = await import('../contracts/MockUSDTABI')
        const usdtContract = new Contract(MOCK_USDT_ADDRESS, MockUSDTABI, provider)
        const usdtBal = await usdtContract.balanceOf(address)
        balanceUsdt = formatUnits(usdtBal, USDT_DECIMALS)
      } catch (usdtError) {
        console.error('Error fetching USDT balance:', usdtError)
      }

      let assignedRole: UserRole = 'GUEST'
      try {
        const { data } = await supabase
          .from('WALLETS')
          .select(`ORGANIZATIONS ( organization_type )`)
          .ilike('wallet_address', address)
          .single()

        const orgData = data?.ORGANIZATIONS as { organization_type?: string } | { organization_type?: string }[] | null
        assignedRole = ((Array.isArray(orgData) ? orgData[0]?.organization_type : orgData?.organization_type) || 'GUEST') as UserRole
      } catch (dbError) {
        console.error('Error fetching role from DB:', dbError)
      }

      setWallet({
        address,
        balance: (Number(balanceEth) / 1e18).toFixed(4),
        usdtBalance: parseFloat(balanceUsdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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
    } catch (thrown: unknown) {
      const err = thrown as EthersError
      console.error(err)
      setError(err.message || 'Lỗi lấy thông tin tài khoản')
      return false
    }
  }, [getNetworkError])

  const refreshBalance = useCallback(async () => {
    if (wallet.address && wallet.isConnected) {
      await loadAccountData(wallet.address, false)
    }
  }, [wallet.address, wallet.isConnected, loadAccountData])

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false
    const eth = window.ethereum
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

      const eth = window.ethereum!
      let provider = new BrowserProvider(eth)
      let networkError = await getNetworkError(provider)

      if (networkError) {
        const switched = await switchNetwork()
        if (!switched) {
          setError(networkError)
          return false
        }
        // Re-initialize provider after network switch
        provider = new BrowserProvider(eth)
        networkError = await getNetworkError(provider)
        if (networkError) {
          setError(networkError)
          return false
        }
      }

      // Request new account selection every time (won't cache)
      const accounts = await provider.send('eth_requestAccounts', [])

      if (!accounts || accounts.length === 0) {
        setError('Không thể lấy địa chỉ ví')
        return false
      }

      const address = accounts[0]
      await loadAccountData(address, shouldRedirect) // Redirect on explicit connect only if requested

      return true
    } catch (thrown: unknown) {
      const err = thrown as EthersError
      if (err.code === -32002) {
        setError('MetaMask connection request đang pending')
      } else if (err.code === 4001) {
        setError('Bạn đã từ chối kết nối MetaMask')
      } else {
        setError(err.message || 'Lỗi kết nối MetaMask')
      }
      return false
    }
  }, [getNetworkError, isMetaMaskInstalled, loadAccountData, switchNetwork])

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      const eth = window.ethereum

      // Revoke all permissions from MetaMask
      if (eth && eth.request) {
        await eth.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        }).catch(() => {
          // Some MetaMask versions don't support this, that's okay
        })
      }
    } catch {
      // Silently fail if revoke doesn't work
    }

    // Clear all local state
    setWallet({
      address: null,
      balance: '0',
      usdtBalance: '0',
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

    const eth = window.ethereum!

    // Check if already connected (F5 refresh)
    const init = async () => {
      try {
        const accounts = await eth.request({ method: 'eth_accounts' }) as string[]
        if (accounts && accounts.length > 0) {
          const provider = new BrowserProvider(eth)
          const networkError = await getNetworkError(provider)
          if (networkError) {
            setError(networkError)
          } else {
            setError('')
            await loadAccountData(accounts[0], false) // Do NOT redirect on F5
          }
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

    // Listen for contract events to refresh balance
    let usdtContract: Contract | undefined
    let marketContract: Contract | undefined

    const setupListeners = async () => {
      try {
        const { Contract } = await import('ethers')
        const provider = new BrowserProvider(eth)
        const { MOCK_USDT_ADDRESS, MARKETPLACE_ADDRESS } = await import('../contracts/contractConfig')
        const { MockUSDTABI } = await import('../contracts/MockUSDTABI')
        const { CarbonMarketplaceABI } = await import('../contracts/CarbonMarketplaceABI')

        usdtContract = new Contract(MOCK_USDT_ADDRESS, MockUSDTABI, provider)
        marketContract = new Contract(MARKETPLACE_ADDRESS, CarbonMarketplaceABI, provider)

        const filterFrom = usdtContract.filters.Transfer(wallet.address)
        const filterTo = usdtContract.filters.Transfer(null, wallet.address)
        const filterMarket = marketContract.filters.TokenPurchasedByProject(wallet.address)

        usdtContract.on(filterFrom, refreshBalance)
        usdtContract.on(filterTo, refreshBalance)
        marketContract.on(filterMarket, refreshBalance)
      } catch (err) {
        console.error('Failed to setup contract listeners:', err)
      }
    }

    if (wallet.address && wallet.isConnected) {
      setupListeners()
    }

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged)
      eth.removeListener('chainChanged', handleChainChanged)
      if (usdtContract) usdtContract.removeAllListeners()
      if (marketContract) marketContract.removeAllListeners()
    }
  }, [disconnect, getNetworkError, isMetaMaskInstalled, loadAccountData, wallet.address, wallet.isConnected, refreshBalance])

  return {
    wallet,
    connect,
    disconnect,
    refreshBalance,
    error,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    isInitializing,
  }
}
