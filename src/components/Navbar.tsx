import { Wallet, WifiOff } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { WalletState } from '../types'

interface NavbarProps {
  wallet: WalletState
  onConnect: () => void
}

export default function Navbar({ wallet, onConnect }: NavbarProps) {
  const location = useLocation()
  
  const role = wallet.role || 'GUEST'

  let navLinks: { label: string; path: string }[] = []
  if (role === 'ENTERPRISE') {
    navLinks = [
      { label: 'Thị trường', path: '/marketplace' },
      { label: 'Tài sản', path: '/seller' }
    ]
  } else if (role === 'REGULATORY_AGENCY') {
    navLinks = [
      { label: 'Phát hành token', path: '/moderator' },
      { label: 'Thị trường', path: '/marketplace' }
    ]
  } else {
    // GUEST or unconnected
    navLinks = [
      { label: 'Thị trường', path: '/marketplace' }
    ]
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="font-heading font-bold text-base tracking-widest text-gray-900 whitespace-nowrap hover:text-green-700 transition-colors duration-150">
          CARBON X
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => {
            const active = location.pathname === link.path || location.pathname.startsWith(link.path + '/')
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`font-heading font-semibold text-sm tracking-wider pb-0.5 transition-colors duration-150 border-b-2 ${
                  active
                    ? 'text-green-700 border-green-700'
                    : 'text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Wallet badge */}
          {wallet.isConnected ? (
            <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="font-mono text-xs text-gray-700">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </span>
              <span className="text-xs font-medium text-gray-700">{wallet.balance} ETH</span>
            </div>
          ) : null}

        {/* Connect button */}
          <button
            onClick={() => {
              onConnect()
            }}
            className={`flex items-center gap-2 font-heading font-bold text-xs tracking-widest px-4 py-2 rounded transition-colors duration-150 whitespace-nowrap ${
              wallet.isConnected
                ? 'bg-red-700 hover:bg-red-800 text-white cursor-pointer'
                : 'bg-green-700 hover:bg-green-800 text-white cursor-pointer'
            }`}
          >
            {wallet.isConnected ? (
              <><WifiOff className="w-4 h-4" /> NGẮT KẾT NỐI</>
            ) : (
              <><Wallet className="w-4 h-4" /> KẾT NỐI METAMASK</>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
