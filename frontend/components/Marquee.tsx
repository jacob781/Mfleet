import React from 'react';

interface MarqueeProps {
    items: string[];
    direction?: 'left' | 'right';
    speed?: number; // Duration in seconds
    className?: string;
}

const Marquee: React.FC<MarqueeProps> = ({
    items,
    direction = 'left',
    speed = 40,
    className = ''
}) => {
    return (
        <div className={`relative flex overflow-hidden user-select-none group ${className}`}>
            <div
                className={`flex whitespace-nowrap animate-marquee ${direction === 'right' ? 'animate-marquee-reverse' : ''} hover:[animation-play-state:paused]`}
                style={{ animationDuration: `${speed}s` }}
            >
                {items.map((item, idx) => (
                    <div
                        key={`${item}-${idx}`}
                        className="mx-4 text-xl md:text-2xl font-semibold text-white/90 bg-white/10 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/10"
                    >
                        {item}
                    </div>
                ))}
                {/* Duplicate items for seamless loop */}
                {items.map((item, idx) => (
                    <div
                        key={`${item}-${idx}-duplicate`}
                        className="mx-4 text-xl md:text-2xl font-semibold text-white/90 bg-white/10 px-6 py-3 rounded-xl backdrop-blur-sm border border-white/10"
                    >
                        {item}
                    </div>
                ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-mfleet-blue-dark to-transparent"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-mfleet-blue-dark to-transparent"></div>
        </div>
    );
};

export default Marquee;
