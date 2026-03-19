// components/media/HeroCarousel.tsx
'use client';
import { useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UniversalTag } from '@/components/ui/UniversalTag';

gsap.registerPlugin(ScrollTrigger);

import { useAnimationStore } from '@/lib/store';

export function HeroCarousel({ items }: { items: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const { hasVisitedHome, setHasVisitedHome } = useAnimationStore();

  const featured = items[0];

  useGSAP(() => {
    if (!containerRef.current || !featured) return;

    // Parallax effect for the background image
    gsap.to(imageRef.current, {
      yPercent: 30,
      scale: 1.1,
      opacity: 0,
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    // Text entrance animation
    const tl = gsap.timeline({ 
      defaults: { ease: 'power3.out', force3D: true },
      onComplete: () => setHasVisitedHome(true)
    });
    
    if (hasVisitedHome) {
      gsap.set('.hero-text-element', { y: 0, opacity: 1 });
      gsap.set('.hero-image-wrapper', { opacity: 1, scale: 1 });
    } else {
      tl.fromTo(
        '.hero-image-wrapper',
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 1.5, ease: 'power2.out' },
        0
      )
      .fromTo(
        '.hero-text-element',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.1, delay: 0.2 },
        0.2
      );
    }

  }, { scope: containerRef, dependencies: [featured] });

  if (!featured) return null;

  return (
    <div ref={containerRef} className="relative w-full h-[80vh] min-h-[600px] overflow-hidden">
      <div className="hero-image-wrapper absolute inset-0 w-full h-full opacity-0">
        <div ref={imageRef} className="absolute inset-0 w-full h-full bg-black">
          <Image
            src={featured.bannerImage || featured.coverImage?.extraLarge || 'https://picsum.photos/seed/anime-banner/1920/1080'}
            alt={featured.title?.romaji || 'Hero Banner'}
            fill
            className="object-cover opacity-60"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-16 z-10 flex flex-col justify-end h-full pb-24 md:pb-32">
        <div
          ref={textRef}
          className="max-w-7xl mx-auto w-full"
        >
          <div className="hero-text-element flex flex-wrap items-center gap-3 md:gap-4 mb-6 opacity-0">
            <UniversalTag className="bg-white/10 backdrop-blur-md border-white/10 text-white uppercase tracking-wider">Trending Now</UniversalTag>
            
            {featured.format && (
              <UniversalTag className="bg-white/10 backdrop-blur-md border-white/10 text-white uppercase tracking-wider">{featured.format}</UniversalTag>
            )}
          </div>
          
          <h1 className="hero-text-element font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.95] mb-4 tracking-tight drop-shadow-xl line-clamp-2 opacity-0">
            {featured.title?.english || featured.title?.romaji}
          </h1>
          <p className="hero-text-element font-sans text-xl md:text-2xl text-zinc-300 max-w-3xl font-light line-clamp-2 leading-relaxed opacity-0">
            {featured.description?.replace(/<[^>]*>/g, '') || featured.title?.native}
          </p>
        </div>
      </div>
    </div>
  );
}
