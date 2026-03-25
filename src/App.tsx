import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import SellPage from './pages/seller/SellPage'
import CertificatePage from './pages/seller/CertificatePage'
import SellerHomePage from './pages/seller/SellerHomePage'
import SellerDetailPage from './pages/seller/SellerDetailPage'
import BurnPage from './pages/seller/BurnPage'
import BuyerHomePage from './pages/buyer/BuyerHomePage'
import BuyerDetailPage from './pages/buyer/BuyerDetailPage'
import MarketplacePage from './pages/buyer/MarketplacePage'
import ModeratorListPage from './pages/moderator/ModeratorListPage'
import ModeratorDetailPage from './pages/moderator/ModeratorDetailPage'
import { useMetaMask } from './hooks/useMetaMask'
import { WalletProvider } from './contexts/WalletContext'
import type { UserRole } from './types'

function AppContent({
  wallet,
  handleConnect,
  role,
  setRole,
  defaultPath
}: any) {
  const location = useLocation()
  const isFullscreenPage = 
    location.pathname === '/seller/burn/destroy' || 
    location.pathname === '/seller/sell/create' ||
    location.pathname === '/seller/burn/certificates' ||
    (/^\/seller\/[^/]+$/.test(location.pathname) && !['/seller/burn', '/seller/sell'].some(p => location.pathname.startsWith(p))) ||
    (/^\/marketplace\/[^/]+$/.test(location.pathname))

  return (
    <div className="min-h-screen flex flex-col">
      {!isFullscreenPage && (
        <Navbar 
          wallet={wallet} 
          onConnect={handleConnect} 
          role={role} 
          onRoleChange={setRole}
        />
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />

          {/* Seller */}
          <Route path="/seller" element={<SellerHomePage />} />
          <Route path="/seller/:id" element={<SellerDetailPage />} />
          <Route path="/seller/burn/destroy" element={<BurnPage />} />
          <Route path="/seller/sell/create" element={<SellPage />} />
          <Route path="/seller/burn/certificates" element={<CertificatePage />} />

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
  )
}

export default function App() {
  const [role, setRole] = useState<UserRole>('seller')
  const { wallet, connect, disconnect, error } = useMetaMask()

  const handleConnect = () => {
    if (wallet.isConnected) {
      disconnect()
    } else {
      connect()
    }
  }

  const defaultPath = !wallet.isConnected ? '/marketplace' : (role === 'seller' ? '/seller' : role === 'buyer' ? '/buyer' : '/moderator')

  return (
    <BrowserRouter>
      <WalletProvider wallet={wallet} error={error}>
        <AppContent 
          wallet={wallet} 
          handleConnect={handleConnect} 
          role={role} 
          setRole={setRole} 
          error={error} 
          defaultPath={defaultPath} 
        />
      </WalletProvider>
    </BrowserRouter>
  )
}
