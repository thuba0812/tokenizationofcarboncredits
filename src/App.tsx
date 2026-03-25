import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import SellerHomePage from './pages/seller/SellerHomePage'
import SellerDetailPage from './pages/seller/SellerDetailPage'
import BuyerHomePage from './pages/buyer/BuyerHomePage'
import BuyerDetailPage from './pages/buyer/BuyerDetailPage'
import MarketplacePage from './pages/buyer/MarketplacePage'
import ModeratorListPage from './pages/moderator/ModeratorListPage'
import ModeratorDetailPage from './pages/moderator/ModeratorDetailPage'
import type { UserRole, WalletState } from './types'

const MOCK_ADDRESS = '0x742d35Cc6634C0532925a3b8D4C99'

export default function App() {
  const [role, setRole] = useState<UserRole>('seller')
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '1.25',
    isConnected: false,
  })

  const handleConnect = () => {
    setWallet(prev => prev.isConnected
      ? { address: null, balance: '1.25', isConnected: false }
      : { address: MOCK_ADDRESS, balance: '1.25', isConnected: true }
    )
  }

  const defaultPath = role === 'seller' ? '/seller' : role === 'buyer' ? '/buyer' : '/moderator'

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar wallet={wallet} onConnect={handleConnect} role={role} onRoleChange={setRole} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to={defaultPath} replace />} />

            {/* Seller */}
            <Route path="/seller" element={<SellerHomePage />} />
            <Route path="/seller/:id" element={<SellerDetailPage />} />

            {/* Buyer */}
            <Route path="/buyer" element={<BuyerHomePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:id" element={<BuyerDetailPage />} />

            {/* Moderator */}
            <Route path="/moderator" element={<ModeratorListPage />} />
            <Route path="/moderator/:id" element={<ModeratorDetailPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
