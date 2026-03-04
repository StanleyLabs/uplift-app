import React, { useState, useRef, useEffect } from 'react';

export const THEMES = ['All', 'Hope', 'Resilience', 'Healing', 'Wisdom', 'Strength'];

interface ThemeFilterProps {
    selectedTheme: string;
    onSelectTheme: (theme: string) => void;
}

export const ThemeFilter: React.FC<ThemeFilterProps> = ({ selectedTheme, onSelectTheme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="theme-dropdown-container" ref={dropdownRef}>
            <button
                className={`theme-dropdown-button ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="theme-dropdown-text">{selectedTheme}</span>
                <svg
                    className={`theme-dropdown-icon ${isOpen ? 'open' : ''}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {isOpen && (
                <div className="theme-dropdown-menu" role="listbox">
                    {THEMES.map((theme) => (
                        <button
                            key={theme}
                            role="option"
                            aria-selected={selectedTheme === theme}
                            className={`theme-dropdown-item ${selectedTheme === theme ? 'selected' : ''}`}
                            onClick={() => {
                                onSelectTheme(theme);
                                setIsOpen(false);
                            }}
                        >
                            {theme}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
