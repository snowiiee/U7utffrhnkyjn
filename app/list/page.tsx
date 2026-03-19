// app/list/page.tsx
'use client';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import { List, ArrowDownUp, Plus, Play, Check, Pause, X, Bookmark, Search } from 'lucide-react';
import { SigilGhost } from '@/components/icons/SigilGhost';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Flip } from 'gsap/Flip';
import { request, gql } from 'graphql-request';
import { MediaCard } from '@/components/media/MediaCard';
import { OrganicLoader } from '@/components/ui/OrganicLoader';
import { Pill } from '@/components/ui/Pill';
import { saveMediaListEntry } from '@/lib/anilist/queries';
import { useAuthStore } from '@/lib/store';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(Flip);
}

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

const VIEWER_QUERY = gql`
  query {
    Viewer {
      id
    }
  }
`;

const FULL_LIST_QUERY = gql`
  query($userId: Int!) {
    MediaListCollection(userId: $userId, type: ANIME) {
      lists {
        status
        entries {
          id
          score
          progress
          updatedAt
          media {
            id
            title {
              romaji
              english
              userPreferred
            }
            coverImage {
              extraLarge
              large
              color
            }
            format
            episodes
            seasonYear
            meanScore
            startDate {
              year
            }
            nextAiringEpisode {
              episode
              timeUntilAiring
            }
          }
        }
      }
    }
  }
`;

const TABS = [
  { id: 'CURRENT', label: 'Watching', icon: Play },
  { id: 'COMPLETED', label: 'Completed', icon: Check },
  { id: 'PAUSED', label: 'Paused', icon: Pause },
  { id: 'DROPPED', label: 'Dropped', icon: X },
  { id: 'PLANNING', label: 'Planning', icon: Bookmark },
];

const SORTS = [
  { id: 'UPDATED_DESC', label: 'Recently Updated' },
  { id: 'SCORE_DESC', label: 'Highest Score' },
  { id: 'TITLE_ASC', label: 'Title (A-Z)' },
];

export default function ListPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  const [token, setToken] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lists, setLists] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState('CURRENT');
  const [sortOrder, setSortOrder] = useState('UPDATED_DESC');
  const [isDealing, setIsDealing] = useState(false);
  const [dealOrigin, setDealOrigin] = useState<{centerX: number, centerY: number} | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [isToolkitOpen, setIsToolkitOpen] = useState(false);
  const [listQuery, setListQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const dealingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { token: authToken, initializeAuth, isInitialized } = useAuthStore();

  // For GSAP context
  const { contextSafe } = useGSAP({ scope: containerRef });

  // Search pill expand/collapse animation
  useGSAP(() => {
    if (!searchContainerRef.current) return;
    if (isSearchExpanded) {
      gsap.to(searchContainerRef.current, {
        maxWidth: '32rem',
        borderRadius: '1rem',
        duration: 0.4,
        ease: 'power3.out',
      });
    } else {
      gsap.to(searchContainerRef.current, {
        maxWidth: '14rem',
        borderRadius: '9999px',
        duration: 0.4,
        ease: 'power3.out',
      });
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized) {
      setToken(authToken);
      setIsAuthChecking(false);
    }
  }, [authToken, isInitialized]);

  useEffect(() => {
    if (!token) return;

    const fetchLists = async () => {
      setIsLoading(true);
      try {
        const viewerData: any = await request(ANILIST_ENDPOINT, VIEWER_QUERY, undefined, {
          Authorization: `Bearer ${token}`,
        });
        
        const userId = viewerData.Viewer.id;
        
        const listData: any = await request(ANILIST_ENDPOINT, FULL_LIST_QUERY, { userId }, {
          Authorization: `Bearer ${token}`,
        });

        const listsObj: Record<string, any[]> = {};
        listData.MediaListCollection.lists.forEach((list: any) => {
          listsObj[list.status] = list.entries;
        });

        // Ensure all tabs exist even if empty
        TABS.forEach(tab => {
          if (!listsObj[tab.id]) listsObj[tab.id] = [];
        });

        setLists(listsObj);
      } catch (error) {
        console.error('Failed to fetch lists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [token]);

  // Unauthenticated Animation
  useGSAP(() => {
    if (isAuthChecking || token) return;
    
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    tl.fromTo(iconRef.current,
      { scale: 0, rotation: -45, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' }
    )
    .fromTo(contentRef.current?.children || [],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
      "-=0.4"
    );
  }, [isAuthChecking, token]);

  // Authenticated Initial Entrance (The Magician)
  useGSAP(() => {
    if (!token || isLoading || isAuthChecking || Object.keys(lists).length === 0) return;

    // Header slides up
    gsap.fromTo(headerRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );

    setIsDealing(true);
    if (dealingTimeoutRef.current) clearTimeout(dealingTimeoutRef.current);
    dealingTimeoutRef.current = setTimeout(() => setIsDealing(false), 2700);
  }, [isLoading]); // Only run on initial load when loading finishes

  // Tab Switch (Retrace Exit)
  const handleTabChange = contextSafe((newTab: string) => {
    if (newTab === activeTab) return;
    setIsDealing(true);

    const cards = gsap.utils.toArray('.list-card', containerRef.current).slice(0, 24);
    const emptyState = document.querySelector('.empty-state-card');

    const completeTransition = () => {
      setDealOrigin(null);
      // flushSync triggers the re-render → useLayoutEffect fires after commit
      flushSync(() => {
        setActiveTab(newTab);
        setVisibleCount(24);
        setListQuery('');
        setIsSearchExpanded(false);
      });
      if (dealingTimeoutRef.current) clearTimeout(dealingTimeoutRef.current);
      dealingTimeoutRef.current = setTimeout(() => setIsDealing(false), 1300);
    };

    if (cards.length > 0) {
      // Retrace exit
      gsap.to(cards, {
        y: window.innerHeight,
        opacity: 0,
        rotationX: 45,
        scale: 0.8,
        duration: 0.6,
        ease: 'power3.in',
        stagger: 0.02,
        onComplete: completeTransition
      });
    } else if (emptyState) {
      // Retrace empty state
      gsap.to(emptyState, {
        y: window.innerHeight,
        opacity: 0,
        rotationX: 45,
        scale: 0.8,
        duration: 0.6,
        ease: 'power3.in',
        onComplete: completeTransition
      });
    } else {
      completeTransition();
    }
  });

  // Quick Action: +1 Episode
  const handleIncrement = async (entry: any) => {
    if (!token) return;
    
    const newProgress = (entry.progress || 0) + 1;
    
    // Optimistic update
    setLists(prev => {
      const newLists = { ...prev };
      const currentList = [...(newLists['CURRENT'] || [])];
      const index = currentList.findIndex(e => e.media.id === entry.media.id);
      if (index !== -1) {
        currentList[index] = { ...currentList[index], progress: newProgress };
        newLists['CURRENT'] = currentList;
      }
      return newLists;
    });

    try {
      await saveMediaListEntry({ mediaId: entry.media.id, progress: newProgress }, token);
    } catch (error) {
      console.error('Failed to increment progress:', error);
      // Revert optimistic update
      setLists(prev => {
        const newLists = { ...prev };
        const currentList = [...(newLists['CURRENT'] || [])];
        const index = currentList.findIndex(e => e.media.id === entry.media.id);
        if (index !== -1) {
          currentList[index] = { ...currentList[index], progress: entry.progress };
          newLists['CURRENT'] = currentList;
        }
        return newLists;
      });
    }
  };

  // Sorting (The Table Shuffle)
  const handleSortChange = contextSafe((newSort: string) => {
    if (newSort === sortOrder) return;
    
    const state = Flip.getState('.list-card');
    
    // Force React to render the new sort order synchronously
    flushSync(() => {
      setSortOrder(newSort);
      setVisibleCount(24);
    });
    
    // Now Flip can accurately measure the before/after states
    Flip.from(state, {
      duration: 0.8,
      ease: 'power3.inOut',
      absolute: true,
      stagger: 0.02,
      scale: true,
      onEnter: elements => gsap.fromTo(elements, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.4 }),
      onLeave: elements => gsap.to(elements, { opacity: 0, scale: 0, duration: 0.4 })
    });
  });

  // Process and sort current list
  const currentEntries = lists[activeTab] || [];
  const sortedEntries = [...currentEntries].sort((a, b) => {
    if (sortOrder === 'UPDATED_DESC') return b.updatedAt - a.updatedAt;
    if (sortOrder === 'SCORE_DESC') return b.score - a.score;
    if (sortOrder === 'TITLE_ASC') {
      const titleA = a.media.title.english || a.media.title.romaji;
      const titleB = b.media.title.english || b.media.title.romaji;
      return titleA.localeCompare(titleB);
    }
    return 0;
  });

  const filteredEntries = listQuery.trim()
    ? sortedEntries.filter(entry => {
        const q = listQuery.toLowerCase();
        return (
          entry.media.title.userPreferred?.toLowerCase().includes(q) ||
          entry.media.title.romaji?.toLowerCase().includes(q) ||
          entry.media.title.english?.toLowerCase().includes(q)
        );
      })
    : sortedEntries;

  const visibleEntries = filteredEntries.slice(0, visibleCount);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 24);
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [visibleEntries.length, filteredEntries.length]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.overflow === 'hidden') {
        setIsToolkitOpen(true);
      } else {
        setTimeout(() => { setIsToolkitOpen(false); }, 150);
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  if (isAuthChecking) return null;

  if (!token) {
    return (
      <div ref={containerRef} className="min-h-screen bg-zinc-950 p-6 md:p-12 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950" />
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div>
            <div ref={iconRef} className="w-24 h-24 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl ring-1 ring-white/10 opacity-0">
              <List className="w-10 h-10 text-white" />
            </div>
            
            <div ref={contentRef}>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight opacity-0">
                My Lists
              </h1>
              
              <p className="font-sans text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12 opacity-0">
                Track what you&apos;re watching, plan your next binge, and share your favorites with the world.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-300 text-sm font-medium opacity-0">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                login first &lt;(￣︶￣)↗
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-zinc-950 relative overflow-hidden pt-24 pb-12 px-6 md:px-12">
      {/* The Void - Radial Gradient Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-950 to-zinc-950 pointer-events-none" />

      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <OrganicLoader />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div ref={headerRef} className="mb-12 opacity-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                  <List className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold text-white tracking-tight">My Lists</h1>
                  <p className="text-zinc-400 mt-1">Manage your anime journey</p>
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl border border-white/5 text-sm font-medium text-zinc-300 transition-colors">
                    <ArrowDownUp className="w-4 h-4" />
                    {SORTS.find(s => s.id === sortOrder)?.label}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {SORTS.map(sort => (
                      <button
                        key={sort.id}
                        onClick={() => handleSortChange(sort.id)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortOrder === sort.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                      >
                        {sort.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {TABS.map(tab => {
                const count = lists[tab.id]?.length || 0;
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <Pill
                    key={tab.id}
                    isActive={isActive}
                    onClick={() => handleTabChange(tab.id)}
                    icon={<Icon className="w-5 h-5" />}
                    title={tab.label}
                    subtitle={`${count} Anime`}
                  />
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div
              ref={searchContainerRef}
              className={`bg-zinc-800 flex items-center px-4 py-3.5 gap-3 transition-shadow ${isSearchExpanded ? 'ring-1 ring-white/10 shadow-xl shadow-black/40' : ''}`}
              style={{ maxWidth: '14rem', borderRadius: '9999px', overflow: 'hidden' }}
            >
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={listQuery}
                onChange={e => setListQuery(e.target.value)}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={() => { if (!listQuery) setIsSearchExpanded(false); }}
                placeholder="Search list..."
                className="flex-1 bg-transparent outline-none text-sm font-sans text-white placeholder:text-zinc-400 min-w-0"
              />
              {listQuery && (
                <button
                  onClick={() => { setListQuery(''); searchInputRef.current?.focus(); }}
                  className="p-0.5 hover:bg-zinc-700 rounded-full transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div ref={gridRef} className="relative min-h-[50vh]">
            {filteredEntries.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {visibleEntries.map((entry, index) => (
                    <TiltCard 
                      key={entry.media.id} 
                      entry={entry} 
                      isDealing={isDealing} 
                      dealOrigin={dealOrigin} 
                      index={index} 
                      isToolkitOpen={isToolkitOpen} 
                      isActiveTabWatching={activeTab === 'CURRENT'}
                      onIncrement={() => handleIncrement(entry)}
                    />
                  ))}
                </div>
                {visibleCount < filteredEntries.length && (
                  <div ref={observerTarget} className="w-full h-20 mt-8 flex items-center justify-center">
                    <OrganicLoader className="w-8 h-8" />
                  </div>
                )}
              </>
            ) : (
              /* The Shrug (Empty State) */
              <EmptyStateCard dealOrigin={dealOrigin} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TiltCard({ entry, isDealing, dealOrigin, index, isToolkitOpen, isActiveTabWatching, onIncrement }: { entry: any, isDealing: boolean, dealOrigin: {centerX: number, centerY: number} | null, index: number, isToolkitOpen?: boolean, isActiveTabWatching?: boolean, onIncrement?: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (isToolkitOpen && cardRef.current) {
      gsap.to(cardRef.current, {
        rotateX: 0,
        rotateY: 0,
        ease: 'power3.out',
        duration: 0.6
      });
    }
  }, [isToolkitOpen]);

  useLayoutEffect(() => {
    if (!cardRef.current || hasMounted.current) return;
    hasMounted.current = true;

    if (index >= 24) {
      gsap.set(cardRef.current, { opacity: 1 });
      return;
    }

    if (dealOrigin) {
      // Tab switch animation
      gsap.fromTo(cardRef.current,
        { x: dealOrigin.centerX, y: dealOrigin.centerY, scale: 0.5, rotationY: -180, opacity: 0 },
        {
          x: 0, y: 0, scale: 1, rotationY: 0, opacity: 1,
          duration: 0.8, ease: 'power3.out', delay: index * 0.02,
          clearProps: 'transform'
        }
      );
    } else {
      // Initial load animation
      gsap.fromTo(cardRef.current,
        { y: window.innerHeight, opacity: 0, rotationX: 45, scale: 0.8 },
        { 
          y: 0, 
          opacity: 1, 
          rotationX: 0, 
          scale: 1, 
          duration: 1.5, 
          delay: index * 0.05, 
          ease: 'power3.out',
          clearProps: 'transform'
        }
      );
    }
  }, [dealOrigin, index]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isDealing || isToolkitOpen) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    gsap.to(cardRef.current, {
      rotateX,
      rotateY,
      transformPerspective: 1000,
      ease: 'power2.out',
      duration: 0.4
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || isDealing || isToolkitOpen) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      ease: 'power3.out',
      duration: 0.6
    });
  };

  return (
    <div 
      ref={cardRef}
      className="list-card will-change-transform opacity-0 relative group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <MediaCard media={entry.media} />
      {isActiveTabWatching && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onIncrement?.();
          }}
          className="absolute top-2 left-2 z-20 bg-black/80 hover:bg-rose-600 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-md border border-white/20 transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100 shadow-lg"
        >
          <Plus className="w-3 h-3" />
          <span>+1 Ep</span>
        </button>
      )}
    </div>
  );
}

function EmptyStateCard({ dealOrigin }: { dealOrigin: {centerX: number, centerY: number} | null }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  useLayoutEffect(() => {
    if (!cardRef.current || hasMounted.current) return;
    hasMounted.current = true;
    
    if (dealOrigin) {
      gsap.fromTo(cardRef.current,
        { x: dealOrigin.centerX, y: dealOrigin.centerY, scale: 0.5, rotationY: -180, opacity: 0 },
        { x: 0, y: 0, scale: 1, rotationY: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.5)', clearProps: 'transform' }
      );
    } else {
      gsap.fromTo(cardRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform' }
      );
    }
  }, [dealOrigin]);

  return (
    <div ref={cardRef} className="empty-state-card absolute inset-0 flex flex-col items-center justify-center text-center opacity-0">
      <div className="w-32 h-48 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center mb-6 shadow-2xl transform -rotate-6">
        <SigilGhost className="w-16 h-16 text-zinc-600" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Nothing here yet</h3>
      <p className="text-zinc-400 max-w-sm">
        This list is as empty as a protagonist&apos;s wallet. Time to add some anime!
      </p>
    </div>
  );
}
