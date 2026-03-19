'use client';

import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { MediaCard } from '@/components/media/MediaCard';
import { OrganicLoader } from '@/components/ui/OrganicLoader';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface MediaGridProps {
  items: any[];
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function MediaGrid({ items, hasNextPage, isLoading, onLoadMore }: MediaGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '400px', // Load before the user reaches the very bottom
  });

  useEffect(() => {
    if (inView && hasNextPage && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isLoading, onLoadMore]);

  // GSAP load animation for new items
  useGSAP(() => {
    if (!gridRef.current) return;
    
    // Initial entrance animation for the container
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "all" }
      );
    }

    // Select only cards that have the 'is-new' class
    const newCards = gsap.utils.toArray('.media-card-inner.is-new', gridRef.current);
    
    if (newCards.length === 0) return;
    
    gsap.fromTo(newCards, 
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.02,
        ease: "back.out(1.2)",
        force3D: true,
        onComplete: () => {
          // Remove the 'is-new' class and opacity-0 so they aren't animated again and stay visible
          newCards.forEach((card: any) => {
            card.classList.remove('is-new');
            card.classList.remove('opacity-0');
          });
        }
      }
    );
  }, { scope: containerRef, dependencies: [items] });

  return (
    <div ref={containerRef}>
      <div 
        ref={gridRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
      >
        {items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="media-card-inner is-new opacity-0">
            <MediaCard media={item} />
          </div>
        ))}
      </div>
      
      {hasNextPage && (
        <div ref={ref} className="w-full py-12 flex justify-center items-center">
          <OrganicLoader />
        </div>
      )}
      
      {!hasNextPage && items.length > 0 && (
        <div className="w-full py-12 text-center text-zinc-500 text-sm">
          You&apos;ve reached the end of the list.
        </div>
      )}
    </div>
  );
}
