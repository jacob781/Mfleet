import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { servicesList } from '../data/services';
import Marquee from '../components/Marquee';
import SEO from '../components/SEO';

// Custom hook for typewriter effect
const useTypewriter = (phrases: string[], delay: number = 2000) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];

    const timer = setTimeout(() => {
      if (isDeleting) {
        // Deleting text
        setCurrentText(currentPhrase.substring(0, currentText.length - 1));
        setTypingSpeed(50);
      } else {
        // Typing text
        setCurrentText(currentPhrase.substring(0, currentText.length + 1));
        setTypingSpeed(100);
      }

      // Check if phrase is fully typed
      if (!isDeleting && currentText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), delay);
      }
      // Check if phrase is fully deleted
      else if (isDeleting && currentText === '') {
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentPhraseIndex, phrases, delay, typingSpeed]);

  return currentText;
};

const Hero = () => {
  // Services for the typewriter effect
  const services = [
    "file 2290 tax forms",
    "obtain MC certificates",
    "manage IFTA & IRP filings",
    "handle safety audits",
    "process driver qualifications",
    "secure CT permits and more..."
  ];

  const animatedText = useTypewriter(services, 2000);

  // Split services into two rows for visual interest
  const firstRow = servicesList.slice(0, Math.ceil(servicesList.length / 2));
  const secondRow = servicesList.slice(Math.ceil(servicesList.length / 2));

  return (
    <section id="home" className="relative bg-mfleet-blue-dark min-h-[90vh] flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img className="w-full h-full object-cover opacity-40" src="./images/hero_background.jpg" alt="Semi-truck on the road" />
        <div className="absolute inset-0 bg-gradient-to-b from-mfleet-blue-dark/80 via-mfleet-blue-dark/60 to-mfleet-blue-dark"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-12">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
          <span className="block mb-2">Expert Consulting for</span>
          <span className="block text-blue-400 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-500">
            The Trucking Industry
          </span>
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-xl md:text-2xl text-blue-100 leading-relaxed">
          Professional services to help individuals <br className="hidden sm:block" />
          and businesses <span className="font-semibold text-white">{animatedText}</span>
          <span className="ml-1 inline-block w-1 h-6 bg-white align-middle animate-pulse"></span>
        </p>

        <div className="mt-12 mb-20 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/#contact" className="px-8 py-4 bg-white text-mfleet-blue-dark font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:bg-blue-50 transition-all transform hover:-translate-y-1 text-lg inline-block">
            Get Started
          </Link>
          <a href="https://t.me/mfleet" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-mfleet-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 transition-all transform hover:-translate-y-1 text-lg flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z" /></svg>
            Contact on Telegram
          </a>
        </div>
      </div>

      {/* Infinite Services Marquee */}
      <div className="relative w-full py-10 space-y-8 mb-10">
        <Marquee items={firstRow} direction="left" speed={60} />
        <Marquee items={secondRow} direction="right" speed={60} />
      </div>
    </section>
  );
};






const AboutSection = () => (
  <section id="about" className="py-24 bg-white relative overflow-hidden">
    {/* Decorative background elements */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute top-1/2 -right-24 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
        {/* Text Content */}
        <div className="mb-12 lg:mb-0">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-mfleet-blue font-semibold text-sm mb-6 tracking-wide uppercase">
            About Mfleet
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-mfleet-blue-dark leading-tight mb-8">
            Empowering Your Business via <span className="text-mfleet-blue">Compliance</span>
          </h2>

          <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
            <p>
              Efficient fleet operations depend on accurate and consistent regulatory management.
              <span className="font-semibold text-mfleet-blue-dark"> Mfleet LLC</span> assists carriers and professional drivers
              by navigating the complexities of state and federal safety requirements, enabling business
              owners to concentrate on growth and operational performance.
            </p>
            <p>
              Our mission is to ensure full compliance with FMCSA rules while delivering practical,
              results-driven solutions. We focus on reducing risk, preventing costly violations,
              and optimizing daily operations—helping our clients save time, control expenses,
              and maintain long-term financial stability.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 text-mfleet-blue-dark font-medium">
              <svg className="w-5 h-5 text-mfleet-blue" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span>Full Compliance</span>
            </div>
            <div className="flex items-center space-x-2 text-mfleet-blue-dark font-medium">
              <svg className="w-5 h-5 text-mfleet-blue" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span>Rick Reduction</span>
            </div>
            <div className="flex items-center space-x-2 text-mfleet-blue-dark font-medium">
              <svg className="w-5 h-5 text-mfleet-blue" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span>Practical Solutions</span>
            </div>
          </div>
        </div>

        {/* Visual Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-mfleet-blue rounded-3xl rotate-3 transform opacity-10"></div>
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform duration-300">
                <svg className="w-12 h-12 text-mfleet-blue mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="font-bold text-gray-800">FMCSA Ready</span>
              </div>
              <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform duration-300">
                <svg className="w-12 h-12 text-mfleet-blue mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span className="font-bold text-gray-800">Fast Process</span>
              </div>
              <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform duration-300">
                <svg className="w-12 h-12 text-mfleet-blue mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="font-bold text-gray-800">Cost Saving</span>
              </div>
              <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform duration-300">
                <svg className="w-12 h-12 text-mfleet-blue mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <span className="font-bold text-gray-800">Expert Team</span>
              </div>
            </div>
          </div>
        </div>
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

      </div>
    </div>
  </div>
);

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');

    // Use relative path in production, localhost in development
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

    try {
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setStatus('success');
      alert('Thank you for your message! We will get back to you soon.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('error');
      alert('There was an error sending your message. Please try again.');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-white to-mfleet-blue-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-mfleet-blue-dark">
            Get In Touch
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-mfleet-gray">
            Have questions? We're here to help. Reach out to us or fill out the form below.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-mfleet-blue-dark mb-6">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-mfleet-gray">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="py-3 px-4 block w-full shadow-sm text-mfleet-gray-dark focus:ring-mfleet-blue focus:border-mfleet-blue border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-mfleet-gray">Email</label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="py-3 px-4 block w-full shadow-sm text-mfleet-gray-dark focus:ring-mfleet-blue focus:border-mfleet-blue border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-mfleet-gray">Message</label>
                <div className="mt-1">
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="py-3 px-4 block w-full shadow-sm text-mfleet-gray-dark focus:ring-mfleet-blue focus:border-mfleet-blue border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-mfleet-blue-dark hover:bg-mfleet-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mfleet-blue transition-colors duration-300 ${status === 'submitting' ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center p-6 bg-mfleet-blue rounded-2xl">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white mb-4">
                <svg className="w-8 h-8 text-mfleet-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              </div>
              <h3 className="text-xl font-bold">Phone</h3>
              <a href="tel:+14252868699" className="text-blue-200 mt-2 text-lg hover:text-white underline">425 286 8699</a>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-mfleet-blue rounded-2xl">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white mb-4">
                <svg className="w-8 h-8 text-mfleet-blue" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Telegram</h3>
              <a href="https://t.me/mfleet" target="_blank" rel="noopener noreferrer" className="text-blue-200 mt-2 text-lg hover:text-white underline">@mfleet</a>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-mfleet-blue rounded-2xl">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white mb-4">
                <svg className="w-8 h-8 text-mfleet-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold">Email</h3>
              <a href="mailto:contact@mfleet.org" className="text-blue-200 mt-2 text-lg hover:text-white underline">contact@mfleet.org</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


const HomePage: React.FC = () => {
  return (
    <>
      <SEO
        title="Home"
        description="Mfleet offers expert trucking compliance services including 2290 tax filings, MC certificates, IFTA & IRP management, and safety audits."
        keywords="trucking compliance, 2290 tax, IFTA, IRP, MC certificate, DOT audit, safety audit, driver qualification"
      />
      <Hero />
      <AboutSection />
      <CtaSection />
      <Contact />
    </>
  );
};

export default HomePage;