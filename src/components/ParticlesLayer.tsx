import React, { memo, useCallback, useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';
import type { Container, Engine } from '@tsparticles/engine';

/**
 * Connected dots preset: polygon particles (6 sides) with links.
 * Renders between background and text for parallax depth.
 */
const connectedDotsOptions = {
  background: {
    color: { value: 'transparent' },
  },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: 'attract',
      },
    },
    modes: {
      attract: {
        distance: 150,
        duration: 0.3,
        factor: 1,
        speed: 1,
        maxSpeed: 50,
        easing: 'ease-out-quad',
      },
    },
  },
  particles: {
    color: {
      value: ['#fdfbf7', '#899c85', '#ecdce0'],
    },
    links: {
      color: 'rgba(253, 251, 247, 0.25)',
      distance: 120,
      enable: true,
      opacity: 0.4,
      width: 1,
    },
    move: {
      direction: 'none' as const,
      enable: true,
      outModes: {
        default: 'bounce' as const,
      },
      random: true,
      speed: 1.5,
      straight: false,
    },
    number: {
      density: {
        enable: true,
        area: 600,
      },
      value: 50,
    },
    opacity: {
      value: { min: 0.2, max: 0.5 },
    },
    shape: {
      type: 'polygon' as const,
      options: {
        polygon: {
          sides: 6,
        },
      },
    },
    size: {
      value: { min: 2, max: 4 },
    },
  },
  detectRetina: true,
};

interface ParticlesLayerProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ParticlesLayer: React.FC<ParticlesLayerProps> = memo(({
  id,
  className,
  style,
}) => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (_container?: Container) => {
    // Optional: handle when particles are loaded
  }, []);

  if (!init) return null;

  return (
    <Particles
      id={id}
      className={className}
      style={style}
      particlesLoaded={particlesLoaded}
      options={connectedDotsOptions}
    />
  );
});

ParticlesLayer.displayName = 'ParticlesLayer';
