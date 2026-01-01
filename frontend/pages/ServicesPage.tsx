import React from 'react';
import { servicesList } from '../data/services';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const ServicesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-blue-50 min-h-screen pb-20">
            <SEO
                title="Our Services"
                description="Comprehensive trucking compliance solutions: 2290 filing, IFTA/IRP, Safety Audits, Driver Qualifications, and more."
                keywords="trucking services, 2290 filing, IFTA renewal, IRP registration, DOT safety audit, driver qualification file"
            />
            {/* Hero Section for Services */}
            <div className="bg-mfleet-blue-dark text-white py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
                        Our Services
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-blue-100">
                        Comprehensive solutions for all your trucking compliance and business needs.
                    </p>
                </div>
            </div>

            {/* Services Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {servicesList.map((service, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-mfleet-blue flex items-start group"
                        >
                            <div className="flex-shrink-0 mr-4">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-mfleet-blue group-hover:bg-mfleet-blue group-hover:text-white transition-colors duration-300">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900 group-hover:text-mfleet-blue-dark transition-colors duration-300">
                                    {service}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="mt-20 text-center bg-white rounded-2xl p-10 shadow-lg border border-gray-100">
                    <h2 className="text-3xl font-bold text-mfleet-blue-dark mb-4">
                        Need something else?
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        We offer custom consulting services tailored to your specific needs. Contact us directly to discuss your requirements.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => navigate('/#contact')}
                            className="px-8 py-3 bg-mfleet-blue text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Contact Us
                        </button>
                        <a
                            href="https://t.me/mfleet"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-3 bg-white text-mfleet-blue font-bold border-2 border-mfleet-blue rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            Message on Telegram
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
