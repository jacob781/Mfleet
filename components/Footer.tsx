
import React from 'react';
import MfleetLogo from './MfleetLogo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-mfleet-blue-dark text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
             <MfleetLogo className="h-12 w-auto" />
            <p className="text-gray-300 text-base">
              Your trusted partner in trucking compliance and consulting.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Services</h3>
                <ul className="mt-4 space-y-4">
                  <li><a href="/#services" className="text-base text-gray-300 hover:text-white">IFTA Filing</a></li>
                  <li><a href="/#services" className="text-base text-gray-300 hover:text-white">Quarterly State Taxes</a></li>
                  <li><a href="/#services" className="text-base text-gray-300 hover:text-white">Form 2290 HVUT Filing</a></li>
                  <li><a href="/#services" className="text-base text-gray-300 hover:text-white">And more...</a></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Company</h3>
                <ul className="mt-4 space-y-4">
                  <li><a href="/#home" className="text-base text-gray-300 hover:text-white">Home</a></li>
                  <li><a href="/#services" className="text-base text-gray-300 hover:text-white">About Us</a></li>
                  <li><a href="/#/pricing" className="text-base text-gray-300 hover:text-white">Pricing</a></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-1 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Contact</h3>
                <ul className="mt-4 space-y-4">
                  <li className="flex items-center">
                    <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <span>425 286 8699</span>
                  </li>
                  <li className="flex items-center">
                     <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.24 16.658c-.34.196-1.83.901-2.003.958-.175.058-1.025.347-1.396.347-.28 0-.7-.087-1.12-.29-.42-.202-2.815-1.423-3.08-1.684-.265-.26-.87-.863-.988-1.04-.117-.175-.235-.347-.117-.61.118-.26.29-.408.438-.556.148-.147.29-.32.41-.525.118-.204.06-.378-.06-.555-.117-.178-1.025-2.48-1.422-3.38-.398-.9-.813-1.012-1.12-1.012-.283 0-.61.03-.84.03-.418 0-.96.203-1.45.698-.49.493-.84 1.17-.84 1.226 0 .058.058.147.117.235.06.088 1.115 2.607 2.696 4.12 1.58 1.513 2.92 2.02 3.4 2.223.48.203.84.175 1.145.117.305-.058.988-.41 1.175-.494.188-.084.555-.262.642-.35.088-.088.06-.147 0-.262-.058-.117-.348-.175-.7-.348z"/></svg>
                    <span>425 286 8699</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    <span>mfleetteam@gmail.com</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8 flex justify-between items-center">
          <p className="text-base text-gray-400">&copy; {new Date().getFullYear()} Mfleet Consulting. All rights reserved.</p>
           <a href="https://t.me/mfleet" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.78l-1.44 6.84c-.14.68-.56 1.02-1.14.8l-3.34-2.46-1.6 1.54c-.18.18-.32.32-.64.32l.22-3.44 3.08-2.8c.14-.12-.04-.2-.22-.08l-3.8 2.4-3.32-1.04c-.66-.2-1.14-.64-.98-1.28l1.42-6.72c.16-.76.66-1.04 1.3-1.04.42 0 .8.14 1.12.32l9.42 5.24c.72.4.72 1.1.12 1.34z"/></svg>
            <span className="sr-only">Telegram</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
