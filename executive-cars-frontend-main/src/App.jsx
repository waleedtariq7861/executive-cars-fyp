import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/authContext.js'
import AIAssistantWidget from './components/AIAssistantWidget.jsx'
import RouteEffects from './components/RouteEffects.jsx'
import DemoBanner from './components/DemoBanner.jsx'

import ProtectedRoute from './components/ProtectedRoute.jsx'

const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'))
const AccountSignupPage = lazy(() => import('./pages/AccountSignupPage.jsx'))
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'))
const SellCarPage = lazy(() => import('./pages/SellCarPage.jsx'))
const BecomeSellerPage = lazy(() => import('./pages/BecomeSellerPage.jsx'))
const UsedCarsPage = lazy(() => import('./pages/UsedCarsPage.jsx'))
const UsedCarDetailPage = lazy(() => import('./pages/UsedCarDetailPage.jsx'))
const PricePredictorPage = lazy(() => import('./pages/PricePredictorPage.jsx'))
const BookingConfirmedPage = lazy(() => import('./pages/BookingConfirmedPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const LegalPage = lazy(() => import('./pages/LegalPage.jsx'))
const SavedCarsPage = lazy(() => import('./pages/SavedCarsPage.jsx'))

const AuctionGatePage = lazy(() => import('./pages/auction/AuctionGatePage.jsx'))
const AuctionSignupPage = lazy(() => import('./pages/auction/AuctionSignupPage.jsx'))
const AuctionPaymentPage = lazy(() => import('./pages/auction/AuctionPaymentPage.jsx'))
const AuctionPaymentSuccessPage = lazy(() => import('./pages/auction/AuctionPaymentSuccessPage.jsx'))
const AuctionDashboardPage = lazy(() => import('./pages/auction/AuctionDashboardPage.jsx'))
const AuctionLiveAuctionsPage = lazy(() => import('./pages/auction/AuctionLiveAuctionsPage.jsx'))
const AuctionMyBidsPage = lazy(() => import('./pages/auction/AuctionMyBidsPage.jsx'))
const AuctionWonCarsPage = lazy(() => import('./pages/auction/AuctionWonCarsPage.jsx'))
const AuctionProfilePage = lazy(() => import('./pages/auction/AuctionProfilePage.jsx'))
const AuctionCarDetailPage = lazy(() => import('./pages/auction/AuctionCarDetailPage.jsx'))

const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.jsx'))
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage.jsx'))
const AdminAuctionListPage = lazy(() => import('./pages/admin/AdminAuctionListPage.jsx'))
const AdminUsedCarsListPage = lazy(() => import('./pages/admin/AdminUsedCarsListPage.jsx'))
const AdminUploadAuctionPage = lazy(() => import('./pages/admin/AdminUploadAuctionPage.jsx'))
const AdminUploadUsedCarPage = lazy(() => import('./pages/admin/AdminUploadUsedCarPage.jsx'))
const AdminDataModelsPage = lazy(() => import('./pages/admin/AdminDataModelsPage.jsx'))

const SellerDashboardPage = lazy(() => import('./pages/seller/SellerDashboardPage.jsx'))
const SellerBookingsPage = lazy(() => import('./pages/seller/SellerBookingsPage.jsx'))
const SellerListingsPage = lazy(() => import('./pages/seller/SellerListingsPage.jsx'))
const SellerAuctionStatusPage = lazy(() => import('./pages/seller/SellerAuctionStatusPage.jsx'))
const SellerProfilePage = lazy(() => import('./pages/seller/SellerProfilePage.jsx'))

const AI_ASSISTANT_PATHS = new Set(['/', '/used-cars', '/price-predictor', '/sell-car'])

export const shouldShowAIWidget = pathname => AI_ASSISTANT_PATHS.has(pathname)

function AIWidgetWrapper() {
  const location = useLocation()
  return shouldShowAIWidget(location.pathname) ? <AIAssistantWidget /> : null
}

function AdminGate() {
  const { user, initializing } = useAuth()
  if (initializing) return <PageLoader />
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/admin/login" replace />
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#f5f7f9] flex items-center justify-center">
      <div className="text-center" role="status" aria-live="polite">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-800 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-gray-500 mt-3">Loading Executive Cars…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteEffects />
        <DemoBanner />
        <AIWidgetWrapper />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<AccountSignupPage />} />
          <Route path="/account" element={<ProtectedRoute role="user"><AccountPage /></ProtectedRoute>} />
          <Route path="/sell-car" element={<SellCarPage />} />
          <Route path="/become-a-seller" element={
            <ProtectedRoute role="user" unauthenticatedMessage="Please sign in to book a vehicle inspection.">
              <Navigate to="/seller/book-inspection" replace />
            </ProtectedRoute>
          } />
          <Route path="/used-cars" element={<UsedCarsPage />} />
          <Route path="/used-cars/:id" element={<UsedCarDetailPage />} />
          <Route path="/price-predictor" element={<PricePredictorPage />} />
          <Route path="/booking-confirmed" element={<ProtectedRoute role="user"><BookingConfirmedPage /></ProtectedRoute>} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/saved-cars" element={<SavedCarsPage />} />

          {/* Auction */}
          <Route path="/auction" element={<AuctionGatePage />} />
          <Route path="/auction/signup" element={<AuctionSignupPage />} />
          <Route path="/auction/payment" element={<ProtectedRoute role="user"><AuctionPaymentPage /></ProtectedRoute>} />
          <Route path="/auction/payment-success" element={<ProtectedRoute role="user"><AuctionPaymentSuccessPage /></ProtectedRoute>} />
          <Route path="/auction/dashboard" element={<ProtectedRoute role="user" capability="auction"><AuctionDashboardPage /></ProtectedRoute>} />
          <Route path="/auction/live"      element={<ProtectedRoute role="user" capability="auction"><AuctionLiveAuctionsPage /></ProtectedRoute>} />
          <Route path="/auction/my-bids"   element={<ProtectedRoute role="user" capability="auction"><AuctionMyBidsPage /></ProtectedRoute>} />
          <Route path="/auction/won-cars"  element={<ProtectedRoute role="user" capability="auction"><AuctionWonCarsPage /></ProtectedRoute>} />
          <Route path="/auction/profile"   element={<ProtectedRoute role="user" capability="auction"><AuctionProfilePage /></ProtectedRoute>} />
          <Route path="/auction/car/:id"   element={<ProtectedRoute role="user" capability="auction"><AuctionCarDetailPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminGate />} />
          <Route path="/admin/login"           element={<AdminLoginPage />} />
          <Route path="/admin/dashboard"       element={<ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/users"           element={<ProtectedRoute role="admin"><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/bookings"        element={<ProtectedRoute role="admin"><AdminBookingsPage /></ProtectedRoute>} />
          <Route path="/admin/data-models"     element={<ProtectedRoute role="admin"><AdminDataModelsPage /></ProtectedRoute>} />
          <Route path="/admin/auction-list"    element={<ProtectedRoute role="admin"><AdminAuctionListPage /></ProtectedRoute>} />
          <Route path="/admin/used-cars-list"  element={<ProtectedRoute role="admin"><AdminUsedCarsListPage /></ProtectedRoute>} />
          <Route path="/admin/upload-auction"  element={<ProtectedRoute role="admin"><AdminUploadAuctionPage /></ProtectedRoute>} />
          <Route path="/admin/upload-used-car" element={<ProtectedRoute role="admin"><AdminUploadUsedCarPage /></ProtectedRoute>} />

          {/* Seller */}
          <Route path="/seller/dashboard"      element={<ProtectedRoute role="user"><SellerDashboardPage /></ProtectedRoute>} />
          <Route path="/seller/book-inspection" element={
            <ProtectedRoute role="user" unauthenticatedMessage="Please sign in to book a vehicle inspection.">
              <BecomeSellerPage />
            </ProtectedRoute>
          } />
          <Route path="/seller/bookings"       element={<ProtectedRoute role="user"><SellerBookingsPage /></ProtectedRoute>} />
          <Route path="/seller/listings"       element={<ProtectedRoute role="user"><SellerListingsPage /></ProtectedRoute>} />
          <Route path="/seller/auction-status" element={<ProtectedRoute role="user"><SellerAuctionStatusPage /></ProtectedRoute>} />
          <Route path="/seller/profile"        element={<ProtectedRoute role="user"><SellerProfilePage /></ProtectedRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
