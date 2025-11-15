import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => (
  <section id="home" className="relative bg-mfleet-blue-dark">
    <div className="absolute inset-0">
      <img className="w-full h-full object-cover" src="https://i.ibb.co/mH4C15G/truck-hero.jpg" alt="A modern semi-truck driving on a highway at sunset with motion blur" />
      <div className="absolute inset-0 bg-mfleet-blue-dark bg-opacity-75"></div>
    </div>
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-48 text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
        <span className="block">Expert Consulting for</span>
        <span className="block text-blue-300 mt-2">The Trucking Industry</span>
      </h1>
      <p className="mt-6 max-w-lg mx-auto text-lg md:text-xl text-blue-100">
        Professional services to help individuals and businesses file 2290 tax forms and manage compliance accurately and efficiently.
      </p>
      <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Link to="/pricing" className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-mfleet-blue-dark bg-white hover:bg-blue-50 transition-transform transform hover:scale-105 duration-300">
          View Our Prices
        </Link>
        <a href="#services" className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-mfleet-blue hover:bg-mfleet-blue-light transition-transform transform hover:scale-105 duration-300">
          Explore Services
        </a>
      </div>
    </div>
  </section>
);


// FIX: Replaced JSX.Element with React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
const ServiceCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-2">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-mfleet-blue mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-mfleet-blue-dark mb-3">{title}</h3>
      <p className="text-mfleet-gray">{description}</p>
    </div>
  );

const Services = () => (
  <section id="services" className="py-20 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-base font-semibold text-mfleet-blue tracking-wide uppercase">Our Services</h2>
        <p className="mt-2 text-3xl font-extrabold text-mfleet-blue-dark tracking-tight sm:text-4xl">
          Everything You Need for Compliance
        </p>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-mfleet-gray">
          We handle the paperwork so you can focus on the road. From tax filings to safety audits, we've got you covered.
        </p>
      </div>
      <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        <ServiceCard 
          icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          title="IFTA & IRP Filing"
          description="Stay compliant across states with our expert IFTA and IRP renewal and filing services."
        />
        <ServiceCard 
          icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          title="Quarterly State Taxes"
          description="Accurate and on-time quarterly tax reporting for New Mexico, Kentucky, New York, and Oregon."
        />
        <ServiceCard 
          icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1zM2 12h11" /></svg>}
          title="Form 2290 HVUT Filing"
          description="Effortless Heavy Vehicle Use Tax (HVUT) filing to keep your fleet on the road legally."
        />
        <ServiceCard 
          icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          title="Safety & Audits"
          description="Prepare for and navigate safety audits, DataQ challenges, and maintain excellent records."
        />
        <ServiceCard 
          icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" /></svg>}
          title="Permits & Authorities"
          description="We assist with obtaining necessary permits like Clean Truck, BOC-3, MC certificates, and more."
        />
         <ServiceCard 
          icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3.002 3.002 0 013.39-2.433m-.357-1.857A3 3 0 0112 8c1.657 0 3 1.343 3 3s-1.343 3-3 3m0-6a3 3 0 00-3 3" /></svg>}
          title="Driver Management"
          description="Services for adding drivers, managing qualifications files, and handling drug and alcohol programs."
        />
      </div>
    </div>
  </section>
);


const CtaSection = () => (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8 lg:flex lg:items-center lg:justify-between">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          <span className="block">Ready to simplify your paperwork?</span>
          <span className="block bg-gradient-to-r from-mfleet-blue to-mfleet-blue-light bg-clip-text text-transparent -mt-1 pb-1">Get in touch with us today.</span>
        </h2>
        <div className="mt-6 space-y-4 sm:space-y-0 sm:flex sm:space-x-5">
          <a href="https://t.me/mfleet" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-mfleet-blue-dark hover:bg-mfleet-blue transition-transform transform hover:scale-105 duration-300">
            Contact on Telegram
          </a>
          <Link to="/pricing" className="flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-mfleet-blue-dark bg-white hover:bg-gray-50 transition-transform transform hover:scale-105 duration-300">
            See Full Price List
          </Link>
        </div>
      </div>
    </div>
  );

const Contact = () => (
  <section id="contact" className="py-20 bg-mfleet-blue-dark text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Contact Us
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-blue-100">
          We're here to help. Reach out to us through any of the channels below.
        </p>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-mfleet-blue mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            </div>
            <h3 className="text-xl font-bold">Phone</h3>
            <p className="text-blue-200 mt-2">425 286 8699</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-mfleet-blue mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.78l-1.44 6.84c-.14.68-.56 1.02-1.14.8l-3.34-2.46-1.6 1.54c-.18.18-.32.32-.64.32l.22-3.44 3.08-2.8c.14-.12-.04-.2-.22-.08l-3.8 2.4-3.32-1.04c-.66-.2-1.14-.64-.98-1.28l1.42-6.72c.16-.76.66-1.04 1.3-1.04.42 0 .8.14 1.12.32l9.42 5.24c.72.4.72 1.1.12 1.34z"/></svg>
            </div>
            <h3 className="text-xl font-bold">Telegram</h3>
            <a href="https://t.me/mfleet" target="_blank" rel="noopener noreferrer" className="text-blue-200 mt-2 hover:text-white underline">@mfleet</a>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-mfleet-blue mb-4">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-xl font-bold">Email</h3>
            <p className="text-blue-200 mt-2">mfleetteam@gmail.com</p>
          </div>
      </div>
    </div>
  </section>
);


const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <Services />
      <CtaSection />
      <Contact />
    </>
  );
};

export default HomePage;