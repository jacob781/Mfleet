import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import Header from './components/Header';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="bg-white text-mfleet-gray-dark font-sans">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;