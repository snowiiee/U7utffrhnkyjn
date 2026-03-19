'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface OrganicLoaderProps {
  className?: string;
}

const generateWavyPolygon = (numPoints: number, radius: number, amplitude: number) => {
  const steps = 200;
  const points = [];
  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const r = radius + amplitude * Math.sin(numPoints * theta);
    const x = 50 + r * Math.cos(theta);
    const y = 50 + r * Math.sin(theta);
    points.push(`${x.toFixed(3)},${y.toFixed(3)}`);
  }
  return points.join(' ');
};

export function OrganicLoader({ className = '' }: OrganicLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<SVGPolygonElement>(null);
  const outerRef = useRef<SVGCircleElement>(null);

  useGSAP(() => {
    if (!polygonRef.current || !outerRef.current) return;

    // Outer Aura Pulse
    gsap.to(outerRef.current, {
      scale: 1.15,
      duration: 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      transformOrigin: "50% 50%"
    });

    // Inner Blob Rotation
    gsap.to(polygonRef.current, {
      rotation: 360,
      duration: 12,
      ease: "none",
      repeat: -1,
      transformOrigin: "50% 50%"
    });

    // Inner Blob Morphing (Amplitude pulsing)
    const proxy = { amplitude: 2 };
    gsap.to(proxy, {
      amplitude: 4.5,
      duration: 1.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (polygonRef.current) {
          polygonRef.current.setAttribute(
            'points', 
            generateWavyPolygon(10, 28, proxy.amplitude)
          );
        }
      }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={`relative flex items-center justify-center w-12 h-12 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Outer Aura */}
        <circle 
          ref={outerRef}
          cx="50" 
          cy="50" 
          r="40" 
          className="fill-zinc-500/30"
        />
        {/* Inner Blob */}
        <polygon 
          ref={polygonRef}
          points={generateWavyPolygon(10, 28, 2)}
          className="fill-zinc-200"
        />
      </svg>
    </div>
  );
}
