import { useState, useCallback, useEffect } from 'react'
import { BrowserProvider } from 'ethers'
import type { WalletState } from '../types'

export function useMetaMask() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0',
    isConnected: false,
  })
  const [error, setError] = useState<string>('')

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false
    const eth = (window as any).ethereum
    return !!eth && eth.isMetaMask === true
  }, [])

  // Connect wallet
  const connect = useCallback(async () => {
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
      const balance = await provider.getBalance(address)
      const balanceEth = balance.toString()

      setWallet({
        address,
        balance: (Number(balanceEth) / 1e18).toFixed(4),
        isConnected: true,
      })

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
    })
    setError('')
    localStorage.removeItem('walletAddress')
    localStorage.removeItem('walletBalance')
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return

    const eth = (window as any).ethereum

    const handleAccountsChanged = async (accounts: unknown) => {
      const accountsList = Array.isArray(accounts) ? accounts : []
      if (accountsList.length === 0) {
        disconnect()
      } else {
        const newAddress = String(accountsList[0])
        try {
          const provider = new BrowserProvider(eth)
          const balance = await provider.getBalance(newAddress)
          const balanceEth = (Number(balance) / 1e18).toFixed(4)
          setWallet({
            address: newAddress,
            balance: balanceEth,
            isConnected: true,
          })
        } catch (err) {
          setWallet(prev => ({ ...prev, address: newAddress }))
        }
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
  }, [disconnect, isMetaMaskInstalled])

  return {
    wallet,
    connect,
    disconnect,
    error,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  }
}
