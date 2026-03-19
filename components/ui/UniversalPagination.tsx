'use client';
import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface UniversalPaginationProps<T> {
  items: T[];
  itemsPerPage?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function UniversalPagination<T>({ 
  items = [], 
  itemsPerPage = 6, 
  renderItem,
  className 
}: UniversalPaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginate = (newDirection: number) => {
    if (!containerRef.current) return;

    // Animate Out
    gsap.to(containerRef.current, {
      x: newDirection > 0 ? -20 : 20,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        setDirection(newDirection);
        setCurrentPage((prev) => {
          const nextPage = prev + newDirection;
          if (nextPage < 0) return totalPages - 1;
          if (nextPage >= totalPages) return 0;
          return nextPage;
        });
      }
    });
  };

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Animate In (triggered when currentPage changes)
    gsap.fromTo(containerRef.current,
      { x: direction > 0 ? 20 : -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
    );
  }, { scope: containerRef, dependencies: [currentPage] });

  if (!items || items.length === 0) {
    return null;
  }

  if (totalPages <= 1) {
    return (
      <div className={className}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    );
  }

  const currentItems = items.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="w-full space-y-6">
      <div className="relative overflow-hidden">
        <div
          ref={containerRef}
          className={className}
        >
          {currentItems.map((item, index) => renderItem(item, index))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => paginate(-1)}
          className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-1.5">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentPage ? 'w-6 bg-white' : 'w-1.5 bg-zinc-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => paginate(1)}
          className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
