import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PricingPage from './pages/PricingPage';
import DriverPortal from './pages/DriverPortal';
import AdminApp from './pages/admin/AdminApp';
import { Toaster } from './components/Toast';
import Header from './Header';
import Footer from './Footer';

const ScrollToHash: React.FC = () => {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash.replace('#', ''));
        if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, key]);
  return null;
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToHash />
        <Toaster />
        <Routes>
          {/* ── Private pricing page — standalone, no Header/Footer, no nav links ── */}
          <Route path="/pricing" element={<PricingPage />} />

          {/* ── Driver application portal — standalone, mobile-first, token access ── */}
          <Route path="/apply/:token" element={<DriverPortal />} />

          {/* ── Manager admin panel — standalone, own auth/shell ── */}
          <Route path="/admin/*" element={<AdminApp />} />

          {/* ── Public pages with shared layout ── */}
          <Route path="/*" element={
            <div className="bg-white text-mfleet-gray-dark font-sans">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;