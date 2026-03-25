// Type definitions for ethereum provider
export interface EthereumProvider {
  isMetaMask?: boolean
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, callback: (...args: unknown[]) => void) => void
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void
  send?: (method: string, params: unknown[]) => Promise<{ result: unknown }>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}
