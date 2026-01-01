import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinkClasses = 'text-white hover:text-blue-200 transition-colors duration-300 py-2 px-3 rounded-md text-sm font-medium';
  const activeLinkClasses = 'bg-mfleet-blue-dark';

  return (
    <header className="bg-mfleet-blue-dark sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/#home" className="flex items-center space-x-2 text-white">
              <img src="images/logo.png" alt="Mfleet Logo" className="h-16 w-auto drop-shadow-[0_2px_2px_rgba(255,255,255,0.5)]" />
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to="/#home" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} end>Home</NavLink>
              <Link to="/#about" className={navLinkClasses}>About Us</Link>
              <NavLink to="/services" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>Services</NavLink>

              <Link
                to="/#contact"
                className={navLinkClasses}
              >
                Contact Us
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <a href="https://t.me/mfleet" target="_blank" rel="noopener noreferrer" className="bg-white text-mfleet-blue-dark font-bold py-2 px-4 rounded-full hover:bg-blue-100 transition-all duration-300 ease-in-out transform hover:scale-105">
              eFile Now
            </a>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="bg-mfleet-blue-dark inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-mfleet-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-mfleet-blue-dark focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/#home" className={`block ${navLinkClasses}`} onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/#about" className={`block ${navLinkClasses}`} onClick={() => setIsOpen(false)}>About Us</Link>
            <NavLink to="/services" className={({ isActive }) => `block ${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} onClick={() => setIsOpen(false)}>Services</NavLink>

            <Link
              to="/#contact"
              className={`block ${navLinkClasses}`}
              onClick={() => setIsOpen(false)}
            >
              Contact Us
            </Link>
            <a href="https://t.me/mfleet" target="_blank" rel="noopener noreferrer" className="block text-center bg-white text-mfleet-blue-dark font-bold mt-2 py-2 px-4 rounded-full hover:bg-blue-100 transition-all duration-300 ease-in-out">
              eFile Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
