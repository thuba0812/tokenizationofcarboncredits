import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
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

function AppContent({
  wallet,
  handleConnect,
  defaultPath
}: any) {
  const location = useLocation()
  const isFullscreenPage = 
    location.pathname === '/seller/burn/destroy' || 
    location.pathname === '/seller/sell/create' ||
    location.pathname === '/seller/burn/certificates' ||
    (/^\/seller\/[^/]+$/.test(location.pathname) && !['/seller/burn', '/seller/sell'].some(p => location.pathname.startsWith(p))) ||
    (/^\/marketplace\/[^/]+$/.test(location.pathname)) ||
    (/^\/moderator\/[^/]+$/.test(location.pathname))

  const navigate = useNavigate()

  useEffect(() => {
    if (!wallet.isConnected && !location.pathname.startsWith('/marketplace') && location.pathname !== '/') {
      navigate('/marketplace', { replace: true })
    }
  }, [wallet.isConnected, navigate, location.pathname])

  return (
    <div className="min-h-screen flex flex-col">
      {!isFullscreenPage && (
        <Navbar 
          wallet={wallet} 
          onConnect={handleConnect} 
        />
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />

          {/* Seller / Tài sản */}
          <Route path="/seller" element={<SellerHomePage />} />
          <Route path="/seller/:id" element={<SellerDetailPage />} />
          <Route path="/seller/burn/destroy" element={<BurnPage />} />
          <Route path="/seller/sell/create" element={<SellPage />} />
          <Route path="/seller/burn/certificates" element={<CertificatePage />} />

          {/* Buyer / Mua */}
          <Route path="/buyer" element={<BuyerHomePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:id" element={<BuyerDetailPage />} />

          {/* Moderator / Admin */}
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
  const { wallet, connect, disconnect, error, isInitializing } = useMetaMask()

  const handleConnect = () => {
    if (wallet.isConnected) {
      disconnect()
    } else {
      connect()
    }
  }

  let defaultPath = '/marketplace'
  if (wallet.isConnected) {
    if (wallet.role === 'ENTERPRISE') defaultPath = '/seller'
    else if (wallet.role === 'REGULATORY_AGENCY') defaultPath = '/moderator'
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded-full" />
          <span className="font-heading font-semibold tracking-widest text-sm text-gray-500">CONNECTING...</span>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <WalletProvider wallet={wallet} error={error} isInitializing={isInitializing} connect={connect}>
        <AppContent 
          wallet={wallet} 
          handleConnect={handleConnect} 
          error={error} 
          defaultPath={defaultPath} 
        />
      </WalletProvider>
    </BrowserRouter>
  )
}
