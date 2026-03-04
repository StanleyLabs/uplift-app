import React from 'react';

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
    return (
        <div className="quote-card">
            {/* Background Image with Overlay */}
            <div
                className="quote-background"
                style={{ backgroundImage: `url(${quote.backgroundUrl})` }}
            />
            <div className="quote-overlay" />

            {/* Content */}
            <div className="quote-content animate-enter">
                <p className="quote-text">{quote.text}</p>
                <p className="quote-author">— {quote.author}</p>
            </div>
        </div>
    );
};
