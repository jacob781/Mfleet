import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ScrollToHash from './components/ScrollToHash';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PricingPage from './pages/PricingPage';
import Header from './Header';
import Footer from './Footer';

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          {/* ── Private pricing page — standalone, no Header/Footer, no nav links ── */}
          <Route path="/pricing" element={<PricingPage />} />

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