import { createContext, useContext, ReactNode } from 'react'
import type { WalletState } from '../types'

interface WalletContextType {
  wallet: WalletState
  error: string
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children, wallet, error }: { children: ReactNode; wallet: WalletState; error: string }) {
  return (
    <WalletContext.Provider value={{ wallet, error }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
