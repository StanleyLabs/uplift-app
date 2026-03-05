import React, { useState, useEffect, useRef } from 'react';

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
    const bgParallaxRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const targetOffset = useRef({ x: 0, y: 0 });
    const requestRef = useRef<number>(0);

    useEffect(() => {
        let isMounted = true;

        const img = document.createElement('img');
        img.src = quote.backgroundUrl;
        img.onload = () => {
            if (isMounted) setIsLoaded(true);
        };

        return () => {
            isMounted = false;
            setIsLoaded(false); // Reset on unmount/change
        };
    }, [quote.backgroundUrl]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            targetOffset.current = { x, y };
        };

        let isOrientationStarted = false;

        const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
            if (!isOrientationStarted) isOrientationStarted = true;
            if (e.gamma !== null && e.beta !== null) {
                // gamma is left/right (-90 to 90), beta is front/back (-180 to 180)
                let x = e.gamma / 45;
                let y = (e.beta - 45) / 45; // Assume resting angle of phone is 45 degrees

                // Clamp values
                x = Math.max(-1, Math.min(1, x));
                y = Math.max(-1, Math.min(1, y));
                targetOffset.current = { x, y };
            }
        };

        const startDeviceOrientation = () => {
            if (typeof (DeviceOrientationEvent as any) !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                // iOS 13+ requires permission
                (DeviceOrientationEvent as any).requestPermission()
                    .then((permissionState: string) => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', handleDeviceOrientation as EventListener);
                        }
                    })
                    .catch(console.error);
            } else {
                // Non iOS 13+ devices
                window.addEventListener('deviceorientation', handleDeviceOrientation as EventListener);
            }
        };

        const handleFirstInteraction = () => {
            if (!isOrientationStarted) {
                startDeviceOrientation();
            }
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('touchstart', handleFirstInteraction);
        };

        // If it's iOS 13+, we MUST wait for a user interaction to request permission.
        // If it's anything else, we can start listening immediately.
        if (typeof (DeviceOrientationEvent as any) !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            document.addEventListener('click', handleFirstInteraction);
            document.addEventListener('touchstart', handleFirstInteraction);
        } else {
            startDeviceOrientation();
        }

        // --- End Parallax Logic --- 
        let currentOffset = { x: 0, y: 0 };
        const updateOffset = () => {
            // Smooth lerp towards target
            const dx = targetOffset.current.x - currentOffset.x;
            const dy = targetOffset.current.y - currentOffset.y;
            currentOffset.x += dx * 0.03; // Much slower catch-up
            currentOffset.y += dy * 0.03;

            if (bgParallaxRef.current) {
                // Background moves slightly opposite and requires a scale to avoid edge clipping
                // Adding subtle tilt/rotation
                const bgX = currentOffset.x * -2.5; // Reduced from -4 to -2.5
                const bgY = currentOffset.y * -2.5;
                const rotX = currentOffset.y * 1.5; // Reduced from 3 to 1.5
                const rotY = currentOffset.x * -1.5; // Reduced from -3 to -1.5

                bgParallaxRef.current.style.transform = `perspective(1000px) translate3d(${bgX}%, ${bgY}%, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.1)`;
            }
            if (contentRef.current) {
                // Content moves slightly towards cursor
                const contentX = currentOffset.x * 3.5; // Reduced from 6 to 3.5
                const contentY = currentOffset.y * 3.5;
                const rotX = currentOffset.y * 2.5; // Reduced from 5 to 2.5
                const rotY = currentOffset.x * -2.5;

                contentRef.current.style.transform = `perspective(1000px) translate3d(${contentX}%, ${contentY}%, 30px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
            }

            requestRef.current = requestAnimationFrame(updateOffset);
        };
        requestRef.current = requestAnimationFrame(updateOffset);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('deviceorientation', handleDeviceOrientation as EventListener);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div className="quote-card">
            {/* Background Image with Parallax Wrapper */}
            <div ref={bgParallaxRef} className="quote-background-parallax">
                <div
                    className={`quote-background ${isLoaded ? 'loaded' : ''}`}
                    style={{ backgroundImage: isLoaded ? `url(${quote.backgroundUrl})` : 'none' }}
                />
            </div>

            <div className="quote-overlay" />

            {/* Content */}
            <div ref={contentRef} className={`quote-content ${isLoaded ? 'animate-enter' : ''}`} style={{ opacity: isLoaded ? 1 : 0 }}>
                <p className="quote-text">{quote.text}</p>
                <p className="quote-author">— {quote.author}</p>
            </div>
        </div>
    );
};
