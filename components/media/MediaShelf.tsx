// components/media/MediaShelf.tsx
'use client';
import { MediaCard } from './MediaCard';
import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useAnimationStore } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

export const MediaShelf = React.memo(function MediaShelf({ title, items, viewAllHref }: { title: string, items: any[], viewAllHref?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hasVisitedHome } = useAnimationStore();

  useGSAP(() => {
    if (!scrollRef.current || !containerRef.current) return;

    const cards = scrollRef.current.querySelectorAll('.media-card-inner');
    const header = containerRef.current.querySelector('.shelf-header');
    
    if (hasVisitedHome) {
      gsap.set(cards, { opacity: 1, y: 0 });
      gsap.set(header, { opacity: 1, y: 0 });
    } else {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });

      tl.fromTo(header,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", force3D: true }
      )
      .fromTo(cards, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "back.out(1.2)", force3D: true },
        "-=0.3"
      );
    }
  }, { scope: containerRef, dependencies: [] }); // Empty dependency array to run only once on mount

  if (!items || items.length === 0) return null;

  return (
    <section ref={containerRef} className="py-6 md:py-10 relative">
      <div className="shelf-header opacity-0 max-w-7xl mx-auto px-6 md:px-12 mb-6 flex items-end justify-between w-full">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
          {title}
        </h2>
        
        {viewAllHref && (
          <Link href={viewAllHref} className="group flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x snap-proximity scrollbar-hide scroll-pl-6 md:scroll-pl-12 xl:scroll-pl-[calc((100vw-80rem)/2+3rem)]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex-none w-2 md:w-6 xl:w-[calc((100vw-80rem)/2+1.5rem)]" aria-hidden="true" />
        {items.map((item) => (
          <div 
            key={item.id}
            className="media-card-wrapper flex-none w-[40vw] min-w-[140px] max-w-[180px] md:w-[200px] md:max-w-none lg:w-[220px] snap-start"
          >
            <div className="media-card-inner opacity-0 h-full">
              <MediaCard media={item} />
            </div>
          </div>
        ))}
        <div className="flex-none w-2 md:w-6 xl:w-[calc((100vw-80rem)/2+1.5rem)]" aria-hidden="true" />
      </div>
    </section>
  );
});
