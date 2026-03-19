// app/search/SearchClient.tsx
'use client';
import { useState, useTransition, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { searchMedia } from '@/lib/anilist/queries';
import { MediaCard } from '@/components/media/MediaCard';
import { SearchFilters } from './SearchFilters';
import { OrganicLoader } from '@/components/ui/OrganicLoader';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function SearchClient() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const filtersWrapperRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!searchContainerRef.current || !filtersWrapperRef.current) return;

    if (isExpanded) {
      gsap.set([searchContainerRef.current, filtersWrapperRef.current], { overflow: 'hidden' });
      
      gsap.to(searchContainerRef.current, {
        maxWidth: '48rem', // max-w-3xl
        borderRadius: '1.5rem',
        duration: 0.5,
        ease: 'power3.out',
        onComplete: () => { gsap.set(searchContainerRef.current, { overflow: 'visible' }); }
      });
      
      gsap.to(filtersWrapperRef.current, {
        height: 'auto',
        opacity: 1,
        duration: 0.5,
        ease: 'power3.out',
        onComplete: () => { gsap.set(filtersWrapperRef.current, { overflow: 'visible' }); }
      });
    } else {
      gsap.set([searchContainerRef.current, filtersWrapperRef.current], { overflow: 'hidden' });
      
      gsap.to(searchContainerRef.current, {
        maxWidth: '36rem', // max-w-xl
        borderRadius: '9999px',
        duration: 0.5,
        ease: 'power3.out'
      });
      
      gsap.to(filtersWrapperRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out'
      });
    }
  }, [isExpanded]);

  useGSAP(() => {
    if (results.length > 0 && resultsContainerRef.current) {
      gsap.fromTo(resultsContainerRef.current.children,
        { opacity: 0, y: 20, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.4, 
          stagger: 0.05, 
          ease: 'power2.out',
          // clearProps: 'all' // Removed to prevent reverting to opacity-0
        }
      );
    }
  }, { scope: resultsContainerRef, dependencies: [results, isPending] });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2 || Object.keys(filters).length > 0) {
        startTransition(async () => {
          const data = await searchMedia(query, filters);
          setResults(data);
        });
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 pt-12 md:pt-24">
      <div 
        ref={searchContainerRef}
        className={`mx-auto bg-zinc-800 ${
          isExpanded 
            ? 'ring-1 ring-white/10 shadow-2xl shadow-black/50' 
            : ''
        }`}
        style={{ maxWidth: '36rem', borderRadius: '9999px', overflow: 'hidden' }}
      >
        <div className="flex flex-col">
          <div className="flex items-center px-6 py-3.5 gap-4">
            {isExpanded ? (
              <button onClick={() => setIsExpanded(false)} className="p-1 -ml-2 hover:bg-zinc-700 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </button>
            ) : (
              <Search className="w-5 h-5 text-zinc-400" />
            )}
            
            <input 
              type="text"
              value={query}
              onChange={handleSearch}
              onFocus={() => setIsExpanded(true)}
              placeholder="Search anime..."
              className={`flex-1 bg-transparent outline-none text-lg font-sans text-white placeholder:text-zinc-400 transition-all duration-300 ${
                isExpanded ? 'text-left' : 'text-center'
              }`}
            />
            
            {(query || Object.keys(filters).length > 0) && (
              <button onClick={() => { setQuery(''); setFilters({}); setResults([]); }} className="p-1 hover:bg-zinc-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            )}
          </div>

          <div
            ref={filtersWrapperRef}
            className="px-6 border-t border-white/5"
            style={{ height: 0, opacity: 0, overflow: 'hidden' }}
          >
            <div className="pb-4 pt-2">
              <SearchFilters filters={filters} setFilters={setFilters} />
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div 
          className="max-w-7xl mx-auto mt-12"
        >
          {isPending && (
            <div className="flex flex-col items-center justify-center gap-6 py-12">
              <OrganicLoader />
              <div className="text-zinc-500 font-sans text-xl animate-pulse">Searching the database...</div>
            </div>
          )}
          
          {!isPending && results.length > 0 && (
            <div 
              ref={resultsContainerRef}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
            >
              {results.map((media) => (
                <div 
                  key={media.id}
                  className="opacity-0" // Start hidden for GSAP to animate in
                >
                  <MediaCard media={media} />
                </div>
              ))}
            </div>
          )}

          {!isPending && (query.length > 2 || Object.keys(filters).length > 0) && results.length === 0 && (
            <div className="text-center text-zinc-500 py-24 font-display text-2xl font-bold">
              No results found{query ? <span> for &quot;<span className="text-white">{query}</span>&quot;</span> : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
