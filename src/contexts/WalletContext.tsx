import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { WalletState } from '../types'

interface WalletContextType {
  wallet: WalletState
  error: string
  isInitializing: boolean
  connect: (shouldRedirect?: boolean) => Promise<boolean>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children, wallet, error, isInitializing, connect }: { children: ReactNode; wallet: WalletState; error: string; isInitializing: boolean, connect: (shouldRedirect?: boolean) => Promise<boolean> }) {
  return (
    <WalletContext.Provider value={{ wallet, error, isInitializing, connect }}>
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
