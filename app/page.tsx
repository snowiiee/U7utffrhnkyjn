'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/Button';
import { OrganicLoader } from '@/components/ui/OrganicLoader';

const KanjiSwarmCanvas = dynamic(() => import('@/components/KanjiSwarmCanvas'), { 
  ssr: false 
});

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const exitProgressRef = useRef(0);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('anilist_token');
    if (token) {
      router.push('/home');
    } else {
      setIsCheckingToken(false);
    }
  }, [router]);

  useGSAP(() => {
    if (isCheckingToken) return;
    
    const tl = gsap.timeline();
    tl.fromTo('.hero-title', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.2 })
      .fromTo('.hero-subtitle', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.6')
      .fromTo('.hero-actions', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.8');
  }, { scope: containerRef, dependencies: [isCheckingToken] });

  const handleExit = (route: string) => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsNavigating(true);
        router.push(route);
      }
    });

    // Animate DOM elements out
    tl.to('.hero-title, .hero-subtitle, .hero-actions', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.in'
    }, 0);

    // Animate WebGL uniform
    tl.to(exitProgressRef, {
      current: 1,
      duration: 1.2,
      ease: 'power2.inOut'
    }, 0);
  };

  if (isCheckingToken) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <OrganicLoader className="w-16 h-16" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
      <KanjiSwarmCanvas exitProgressRef={exitProgressRef} />
      
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto pointer-events-none">
        <div className="overflow-hidden mb-6 mix-blend-difference">
          <h1 className="hero-title font-display text-6xl md:text-8xl font-bold text-white tracking-tight leading-[1.1]">
            Your Anime Journey,<br/>
            <span className="text-zinc-200">Reimagined.</span>
          </h1>
        </div>
        
        <p className="hero-subtitle font-sans text-xl md:text-2xl text-zinc-200 font-light mb-12 max-w-2xl mix-blend-difference">
          A next-generation client for AniList. Track, discover, and share your favorite series with an expressive, fluid experience.
        </p>
        
        <div className="hero-actions flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pointer-events-auto">
          <Button variant="primary" size="lg" onClick={() => handleExit('/profile')} className="w-full sm:w-auto min-w-[200px]">
            Login with AniList
          </Button>
          <Button variant="secondary" size="lg" onClick={() => handleExit('/home')} className="w-full sm:w-auto min-w-[200px]">
            Explore as Guest
          </Button>
        </div>
      </div>

      {isNavigating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-in fade-in duration-500">
          <OrganicLoader className="w-16 h-16" />
        </div>
      )}
    </div>
  );
}
