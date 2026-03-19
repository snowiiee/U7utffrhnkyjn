// components/ui/UniversalToolkit.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { getViewerAndMediaUserData, saveMediaListEntry } from '@/lib/anilist/queries';
import { useAuthStore } from '@/lib/store';

export function UniversalToolkit({ children, media }: { children: React.ReactNode, media: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const toolkitRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isClosingRef = useRef(false);
  
  const [isToolkitOpen, setIsToolkitOpen] = useState(false);
  const [toolkitPos, setToolkitPos] = useState({ top: 0, left: 0, originX: 'left', originY: 'top' });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [mediaEntry, setMediaEntry] = useState<any>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { token, initializeAuth } = useAuthStore();
  const isTouchRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, [initializeAuth]);

  const handleTouchStart = () => {
    isTouchRef.current = true;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (isToolkitOpen) return;

    hoverTimerRef.current = setTimeout(() => {
      openToolkit();
    }, 1200);
  };

  const handleTouchEndOrMove = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    // Reset touch flag after a delay to prevent fake mouse events from triggering
    setTimeout(() => {
      isTouchRef.current = false;
    }, 500);
  };

  const handleMouseEnter = () => {
    if (isTouchRef.current) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (isToolkitOpen) return;

    hoverTimerRef.current = setTimeout(() => {
      openToolkit();
    }, 1200);
  };

  const handleMouseLeave = () => {
    if (isTouchRef.current) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    
    if (isToolkitOpen) {
      closeTimerRef.current = setTimeout(() => {
        closeToolkit();
      }, 300);
    }
  };

  const openToolkit = async () => {
    isClosingRef.current = false;
    if (!containerRef.current || !cardRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const toolkitWidth = 260; 
    const toolkitHeight = 220; 
    const padding = 16;
    
    let left = rect.right + padding;
    let originX = 'left';
    
    if (left + toolkitWidth > window.innerWidth - padding) {
      left = rect.left - toolkitWidth - padding;
      originX = 'right';
    }
    
    if (left < padding) {
      left = (window.innerWidth - toolkitWidth) / 2;
      originX = 'center';
    }

    let top = rect.top;
    let originY = 'top';
    
    if (top + toolkitHeight > window.innerHeight - padding) {
      top = rect.bottom - toolkitHeight;
      originY = 'bottom';
    }
    
    if (top < padding) {
      top = (window.innerHeight - toolkitHeight) / 2;
      originY = 'center';
    }

    setToolkitPos({ top, left, originX, originY });
    setIsToolkitOpen(true);

    gsap.to(cardRef.current, { scale: 0.95, duration: 0.3, ease: 'power2.out' });
    
    if (token && !mediaEntry) {
      setIsLoadingData(true);
      try {
        const data = await getViewerAndMediaUserData(media.id, token);
        if (data?.media?.mediaListEntry) {
          setMediaEntry(data.media.mediaListEntry);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingData(false);
      }
    }
  };

  useEffect(() => {
    if (isToolkitOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isToolkitOpen]);

  useEffect(() => {
    if (isToolkitOpen && toolkitRef.current) {
      gsap.fromTo(toolkitRef.current, 
        { scale: 0, opacity: 0, transformOrigin: `${toolkitPos.originX} ${toolkitPos.originY}` },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }
      );
    }
  }, [isToolkitOpen, toolkitPos]);

  const closeToolkit = () => {
    if (isClosingRef.current) return;
    if (!toolkitRef.current || !cardRef.current) {
      setIsToolkitOpen(false);
      return;
    }
    
    isClosingRef.current = true;
    setIsStatusDropdownOpen(false);
    
    gsap.to(toolkitRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power3.in',
      onComplete: () => setIsToolkitOpen(false)
    });
    
    gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: 'power3.out' });
  };

  const handleAddEpisode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || isSaving) return;

    const currentProgress = mediaEntry?.progress || 0;
    const maxEpisodes = media.episodes;
    if (maxEpisodes && currentProgress >= maxEpisodes) return;

    const newProgress = currentProgress + 1;
    const currentStatus = mediaEntry?.status || 'CURRENT';
    
    setMediaEntry({ ...mediaEntry, progress: newProgress, status: currentStatus });
    
    setIsSaving(true);
    try {
      const result = await saveMediaListEntry({
        mediaId: media.id,
        progress: newProgress,
        status: currentStatus,
      }, token);
      setMediaEntry(result);
    } catch (error) {
      setMediaEntry({ ...mediaEntry, progress: currentProgress });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || isSaving) return;

    const currentStatus = mediaEntry?.status;
    setMediaEntry({ ...mediaEntry, status: newStatus });
    setIsStatusDropdownOpen(false);
    
    setIsSaving(true);
    try {
      const result = await saveMediaListEntry({
        mediaId: media.id,
        status: newStatus,
        progress: mediaEntry?.progress || 0,
      }, token);
      setMediaEntry(result);
    } catch (error) {
      setMediaEntry({ ...mediaEntry, status: currentStatus });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const toolkitContent = isToolkitOpen && mounted ? createPortal(
    <>
      <div 
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onMouseEnter={closeToolkit}
        onClick={closeToolkit}
        onTouchStart={closeToolkit}
      />
      <div 
        ref={toolkitRef}
        className="fixed z-[100] w-64 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-4"
        style={{ top: toolkitPos.top, left: toolkitPos.left }}
        onMouseEnter={() => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        {!token ? (
          <div className="text-center py-4">
            <p className="text-sm text-zinc-400">Login to update progress</p>
          </div>
        ) : isLoadingData ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <div className="border-b border-white/10 pb-3 mb-1">
              <h4 className="font-display font-medium text-sm text-zinc-100 line-clamp-2 leading-tight">
                {media?.title?.userPreferred || media?.title?.romaji || media?.title?.english || 'Unknown Title'}
              </h4>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Progress</span>
                <span className="text-xl font-display font-bold text-white">
                  {mediaEntry?.progress || 0} <span className="text-zinc-500 text-sm">/ {media.episodes || '?'}</span>
                </span>
              </div>
              <button 
                onClick={handleAddEpisode}
                disabled={isSaving || (media.episodes && (mediaEntry?.progress || 0) >= media.episodes)}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
              </button>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                }}
                className="w-full flex items-center justify-between bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/20 transition-colors hover:bg-zinc-700 text-sm"
              >
                <span>
                  {{
                    CURRENT: 'Watching',
                    PLANNING: 'Plan to watch',
                    COMPLETED: 'Completed',
                    REPEATING: 'Rewatching',
                    PAUSED: 'Paused',
                    DROPPED: 'Dropped'
                  }[mediaEntry?.status || 'CURRENT'] || 'Select Status'}
                </span>
                <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-[110] overflow-hidden">
                  {[
                    { value: 'CURRENT', label: 'Watching' },
                    { value: 'PLANNING', label: 'Plan to watch' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'REPEATING', label: 'Rewatching' },
                    { value: 'PAUSED', label: 'Paused' },
                    { value: 'DROPPED', label: 'Dropped' }
                  ].map((option) => (
                        <button
                          key={option.value}
                          onClick={(e) => handleStatusChange(option.value, e)}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            (mediaEntry?.status || 'CURRENT') === option.value
                              ? 'bg-white/10 text-white'
                              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                          }`}
                        >
                          {option.label}
                        </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div 
      ref={containerRef}
      className={`relative block w-full h-full group select-none [-webkit-touch-callout:none] ${isToolkitOpen ? 'z-[100]' : 'z-10'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEndOrMove}
      onTouchMove={handleTouchEndOrMove}
      onTouchCancel={handleTouchEndOrMove}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={cardRef} className="block w-full h-full">
        {children}
      </div>
      {toolkitContent}
    </div>
  );
}
