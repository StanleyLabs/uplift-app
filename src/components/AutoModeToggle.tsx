import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AutoModeToggleProps {
    isAutoMode: boolean;
    duration: number;
    onToggle: () => void;
    onSelectDuration: (duration: number) => void;
}

export const AutoModeToggle: React.FC<AutoModeToggleProps> = ({
    isAutoMode,
    duration,
    onToggle,
    onSelectDuration
}) => {
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

    const radius = 10;
    const circumference = 2 * Math.PI * radius;

    // Key change: when duration changes we want the animation to restart smoothly
    // We can just rely on React re-rendering the circle with the new animation property

    return (
        <div className="auto-mode-container" ref={dropdownRef}>
            <div className="auto-mode-controls">
                <button
                    className="auto-mode-play-btn"
                    onClick={onToggle}
                    aria-label={isAutoMode ? "Disable Auto Mode" : "Enable Auto Mode"}
                    title={isAutoMode ? `Auto scroll: ON (${duration}s)` : "Auto scroll: OFF"}
                >
                    <svg className="progress-ring" width="24" height="24">
                        <circle
                            className="progress-ring-circle-bg"
                            stroke="rgba(253, 251, 247, 0.15)"
                            strokeWidth="2"
                            fill="transparent"
                            r={radius}
                            cx="12"
                            cy="12"
                        />
                        {isAutoMode && (
                            <circle
                                className="progress-ring-circle"
                                stroke="var(--shoji-white)"
                                strokeWidth="2"
                                fill="transparent"
                                r={radius}
                                cx="12"
                                cy="12"
                                style={{
                                    strokeDasharray: circumference,
                                    strokeDashoffset: circumference,
                                    animation: `progressTimer ${duration}s linear infinite`
                                }}
                                key={duration}
                            />
                        )}
                    </svg>
                    <div className="auto-mode-icon">
                        {isAutoMode ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    </div>
                </button>

                <button
                    className="auto-mode-duration-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    {duration}s
                    <svg
                        className={`theme-dropdown-icon ${isOpen ? 'open' : ''}`}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                        style={{ marginLeft: '4px' }}
                    >
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div className="theme-dropdown-menu" style={{ top: 'calc(100% + 0.5rem)', left: 0, right: 'auto', transformOrigin: 'top left' }} role="listbox">
                    {[15, 30, 60].map(opt => (
                        <button
                            key={opt}
                            role="option"
                            aria-selected={duration === opt}
                            className={`theme-dropdown-item ${duration === opt ? 'selected' : ''}`}
                            style={{ textAlign: 'left' }}
                            onClick={() => {
                                onSelectDuration(opt);
                                setIsOpen(false);
                            }}
                        >
                            {opt}s
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
