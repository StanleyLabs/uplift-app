import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

const AUDIO_FILES = [
    { name: 'Korean Library', path: '/audio/a-small-library-in-korea.mp3' },
    { name: 'Angelic Pad', path: '/audio/angelic-pad-loop.mp3' },
    { name: 'British Woods', path: '/audio/british-woods-ambient-noise.mp3' },
    { name: 'City Soundscape', path: '/audio/city-soundscape.mp3' },
    { name: 'Distance Commun.', path: '/audio/communication-over-distances-soundscape.mp3' },
    { name: 'Forest Bath', path: '/audio/forest-bath-soundscape.mp3' },
    { name: 'Lower Deck Atmo', path: '/audio/lower-deck-atmo.mp3' },
    { name: 'Nature Birds Bees', path: '/audio/nature-ambience-with-crickets-birds-and-bee-flight.mp3' },
    { name: 'Rainy Town', path: '/audio/rainy-day-in-town-with-birds-singing.mp3' },
    { name: 'Rainy Night', path: '/audio/rainy-night.mp3' }
];

export const AudioPlayer: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [volume, setVolume] = useState(0); // Start at 0 volume
    const [previousVolume, setPreviousVolume] = useState(1); // Remember volume before mute
    const [isMuted, setIsMuted] = useState(true); // Start muted
    const [currentTrack, setCurrentTrack] = useState(AUDIO_FILES[0]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial setup and random track selection
    useEffect(() => {
        const randomTrack = AUDIO_FILES[Math.floor(Math.random() * AUDIO_FILES.length)];
        setCurrentTrack(randomTrack);
        audioRef.current = new Audio(randomTrack.path);
        audioRef.current.loop = true;
        audioRef.current.volume = volume;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []); // Run only on mount

    // Update volume whenever the state changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;

            // If user drags volume to 0 but it's playing, mute it
            if (volume === 0 && isPlaying && !isMuted) {
                audioRef.current.pause();
                setIsPlaying(false);
                setIsMuted(true);
            }
            // If user drags volume up from 0 and it was intentionally muted, unmute and play
            else if (volume > 0 && isMuted) {
                setIsMuted(false);
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch(error => {
                    console.error("Audio playback failed on un-mute:", error);
                });
            }
        }
    }, [volume, isPlaying, isMuted]);

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;

        // Mute and pause behavior (if playing, or if it isn't playing but has volume)
        if (isPlaying || volume > 0) {
            setPreviousVolume(volume > 0 ? volume : 1); // Save the volume before muting
            setVolume(0); // This drops the slider
            audioRef.current.pause();
            setIsPlaying(false);
            setIsMuted(true);
        } else {
            // Unmute and play behavior
            const restoreVolume = previousVolume > 0 ? previousVolume : 1;
            setVolume(restoreVolume); // Restore slider to previous value
            setIsMuted(false);

            // Set volume directly to ensure it plays immediately before the useEffect catches it
            audioRef.current.volume = restoreVolume;
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.error("Audio playback failed:", error);
                setIsPlaying(false);
                setIsMuted(true);
            });
        }
    };

    const handleSelectTrack = (track: typeof AUDIO_FILES[0]) => {
        setCurrentTrack(track);
        setIsOpen(false);

        if (audioRef.current) {
            const wasPlaying = isPlaying;
            audioRef.current.pause();
            audioRef.current.src = track.path;
            audioRef.current.volume = volume;

            if (wasPlaying) {
                audioRef.current.play().catch(error => {
                    console.error("Audio playback failed:", error);
                    setIsPlaying(false);
                });
            }
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };

    return (
        <div className="audio-player-container" ref={dropdownRef}>
            <div className="audio-mode-controls">
                <button
                    className={`auto-mode-play-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause Background Sound" : "Play Background Sound"}
                    title={isPlaying ? "Pause Audio" : "Play Audio"}
                    style={{ padding: '0' }}
                >
                    {isPlaying && volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                    aria-label="Volume Control"
                />

                <div className="audio-separator" style={{ width: '1px', height: '16px', background: 'rgba(253, 251, 247, 0.15)' }}></div>
                <button
                    className="auto-mode-duration-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    style={{ gap: '0.25rem' }}
                >
                    <Music size={14} />
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentTrack.name}
                    </span>
                    <svg
                        className={`theme-dropdown-icon ${isOpen ? 'open' : ''}`}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div className="theme-dropdown-menu" style={{ bottom: 'calc(100% + 0.5rem)', right: 0, top: 'auto', transformOrigin: 'bottom right' }} role="listbox">
                    {AUDIO_FILES.map(track => (
                        <button
                            key={track.path}
                            role="option"
                            aria-selected={currentTrack.path === track.path}
                            className={`theme-dropdown-item ${currentTrack.path === track.path ? 'selected' : ''}`}
                            onClick={() => handleSelectTrack(track)}
                            style={{ whiteSpace: 'nowrap', textAlign: 'left' }}
                        >
                            {track.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
