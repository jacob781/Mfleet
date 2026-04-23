import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

// ─── PRICING DATA (from Mfleet_services.xlsx) ────────────────────────────────

interface ServiceItem {
  service: string;
  fee: string;
}

const SERVICES: ServiceItem[] = [
  { service: 'Applying for FMCSA account',                                  fee: '$300 + government fee' },
  { service: 'Establishing a new business',                                 fee: '$150 + government fee + $60 Annual report/Amendment' },
  { service: 'Applying for an IRP account',                                 fee: '$100 + government fee' },
  { service: 'Applying for an IFTA account',                                fee: '$100 + government fee' },
  { service: 'Same day getting a plate (WA State)',                         fee: '$400 + government fee' },
  { service: 'Applying for an Oregon ODOT account',                         fee: '$60' },
  { service: 'Adding unit to ODOT account',                                 fee: '$30' },
  { service: 'Applying for a Kentucky HUT account',                         fee: '$60' },
  { service: 'Applying for New Mexico HUT account',                         fee: '$50' },
  { service: 'Oregon Monthly report',                                       fee: '$40 / up to 3 trucks' },
  { service: 'Kentucky Quarterly report',                                   fee: '$40 / up to 3 trucks' },
  { service: 'New Mexico Quarterly report',                                 fee: '$40 / up to 3 trucks' },
  { service: 'New York Quarterly report',                                   fee: '$40 / up to 3 trucks' },
  { service: 'IFTA quarterly reports',                                      fee: '$100 up to 3 vehicles · $30/unit over 3' },
  { service: 'Corporation Annual report',                                   fee: '$60' },
  { service: 'UCR yearly license',                                          fee: '$40 + government fee' },
  { service: 'FMCSA annual MCS-150 form update',                            fee: '$50' },
  { service: 'Clean truck permit',                                          fee: '$50 + government fee' },
  { service: 'BOC-3 filing',                                                fee: '$30 + government fee' },
  { service: 'Drug and Alcohol',                                            fee: '$60 new account · $20 per driver + test fee' },
  { service: 'Clearing House',                                              fee: '$60 new account · $20 per driver' },
  { service: 'Supervisor training course',                                  fee: '$200 + course fee' },
  { service: 'Lease agreement',                                             fee: '$30' },
  { service: 'MC certificate',                                              fee: '$50' },
  { service: 'HVUT Form 2290',                                              fee: '$50 up to 3 vehicles' },
  { service: 'CT permit',                                                   fee: '$50 new account + $50/month' },
  { service: 'SCAC Code',                                                   fee: '$100 + government fee' },
  { service: 'Driver Qualification files',                                  fee: '$100' },
  { service: 'Motor Vehicle records',                                       fee: '$20 + government fee' },
  { service: 'Safety Audit',                                                fee: '$500 + filings' },
  { service: 'Driver/Owner Statements',                                     fee: 'Contact for pricing' },
  { service: 'Beneficial Ownership Information (BOI) Reporting',            fee: '$80' },
  { service: 'Creating Prepass Account',                                    fee: '$100' },
  { service: 'Ordering Prepass',                                            fee: '$30 per device' },
  { service: 'FMCSA PIN',                                                   fee: '$50' },
  { service: 'Creating Department of Revenue Account (DOR) Business License', fee: '$100' },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const PricingPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = SERVICES.filter(item =>
    item.service.toLowerCase().includes(search.toLowerCase()) ||
    item.fee.toLowerCase().includes(search.toLowerCase())
  );

  const isContactPrice = (fee: string) => fee === 'Contact for pricing';

  return (
    <>
      <Helmet>
        {/* Block ALL crawlers from indexing this page */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow" />
        <title>Services & Pricing — Mfleet</title>
      </Helmet>

      <div className="min-h-screen bg-gray-950 text-white">

        {/* ── Header ── */}
        <div className="relative overflow-hidden border-b border-white/10">
          {/* Gradient glow background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/20 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-6 py-16 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src="/images/logo.png"
                alt="Mfleet Logo"
                className="h-28 w-auto drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Services &amp; Pricing
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Mfleet Consulting — complete service catalog with transparent pricing.
              All fees listed are our service fees and do not include government filing costs unless noted otherwise.
            </p>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="max-w-5xl mx-auto px-6 py-12">

          {/* Search row */}
          <div className="flex justify-end mb-8">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                id="pricing-search"
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 transition-all w-64"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto] bg-white/5 border-b border-white/10 px-6 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Service</span>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Fee</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <div className="px-6 py-16 text-center text-gray-600 text-sm">
                  No services match "<span className="text-gray-400">{search}</span>"
                </div>
              ) : (
                filtered.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_auto] items-center px-6 py-4 gap-6 group hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    {/* Service name */}
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0 group-hover:bg-blue-400 transition-colors" />
                      <span className="text-sm text-gray-200 leading-snug">{item.service}</span>
                    </div>

                    {/* Fee */}
                    <div className="text-right flex-shrink-0">
                      {isContactPrice(item.fee) ? (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Contact us
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-blue-300 whitespace-nowrap">
                          {item.fee}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Table footer */}
            <div className="px-6 py-3 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {filtered.length} of {SERVICES.length} services
              </span>
              <span className="text-xs text-gray-600">
                Prices subject to change — contact us for quotes
              </span>
            </div>
          </div>

          {/* Note */}
          <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-blue-950/30 border border-blue-500/15 text-sm text-blue-300/70">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              All prices shown are <strong className="text-blue-300/90">Mfleet service fees only</strong> and do not include
              government filing fees unless explicitly stated. Fees marked "+ government fee" will vary based on state and
              registration requirements. Contact us for a personalized quote.
            </p>
          </div>

          {/* Contact CTA */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:contact@mfleet.org"
              id="pricing-contact-email"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              contact@mfleet.org
            </a>
            <a
              href="https://t.me/mfleet"
              target="_blank"
              rel="noopener noreferrer"
              id="pricing-contact-telegram"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
              Telegram — @mfleet
            </a>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-white/5 mt-8">
          <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
            <span className="text-gray-700 text-xs">© {new Date().getFullYear()} Mfleet Consulting. All rights reserved.</span>
            <span className="text-gray-700 text-xs">This page is private and confidential.</span>
          </div>
        </div>

      </div>
    </>
  );
};

export default PricingPage;
