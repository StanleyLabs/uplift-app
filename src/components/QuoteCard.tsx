import React, { useState, useEffect } from 'react';

export interface QuoteData {
    id: string;
    text: string;
    author: string;
    backgroundUrl: string;
    theme?: string;
}

interface QuoteCardProps {
    quote: QuoteData;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const img = new Image();
        img.src = quote.backgroundUrl;
        img.onload = () => {
            if (isMounted) setIsLoaded(true);
        };

        return () => {
            isMounted = false;
            setIsLoaded(false); // Reset on unmount/change
        };
    }, [quote.backgroundUrl]);

    return (
        <div className="quote-card">
            {/* Background Image with Overlay */}
            <div
                className={`quote-background ${isLoaded ? 'loaded' : ''}`}
                style={{ backgroundImage: isLoaded ? `url(${quote.backgroundUrl})` : 'none' }}
            />
            <div className="quote-overlay" />

            {/* Content */}
            <div className={`quote-content ${isLoaded ? 'animate-enter' : ''}`} style={{ opacity: isLoaded ? 1 : 0 }}>
                <p className="quote-text">{quote.text}</p>
                <p className="quote-author">— {quote.author}</p>
            </div>
        </div>
    );
};
