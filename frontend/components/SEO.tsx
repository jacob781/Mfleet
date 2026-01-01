import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    canonicalUrl?: string;
    ogImage?: string;
    type?: 'website' | 'article';
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    canonicalUrl,
    ogImage,
    type = 'website'
}) => {
    const defaultTitle = "Mfleet | Expert Trucking Compliance & Consulting Services";
    const defaultDescription = "Professional trucking compliance services for individuals and businesses. Mfleet handles 2290 tax forms, CT permits, MC certificates, IFTA & IRP filings, safety audits, and driver qualifications.";
    const defaultKeywords = "trucking, compliance, 2290, IRP, IFTA, MC certificate, CT permit, safety audit, driver qualification, mfleet";
    const defaultOgImage = "/images/logo.png";
    const siteUrl = "https://mfleet.org"; // Replace with actual domain if known, or assume/env var

    const finalTitle = title ? `${title} | Mfleet` : defaultTitle;
    const finalDescription = description || defaultDescription;
    const finalKeywords = keywords || defaultKeywords;
    const finalUrl = canonicalUrl || siteUrl;
    const finalOgImage = ogImage || defaultOgImage;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            <meta name="keywords" content={finalKeywords} />
            <link rel="canonical" href={finalUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={finalUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={finalOgImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={finalUrl} />
            <meta property="twitter:title" content={finalTitle} />
            <meta property="twitter:description" content={finalDescription} />
            <meta property="twitter:image" content={finalOgImage} />
        </Helmet>
    );
};

export default SEO;
