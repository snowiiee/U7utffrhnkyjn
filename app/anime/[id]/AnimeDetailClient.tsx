// app/anime/[id]/AnimeDetailClient.tsx
'use client';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { Heart, Share2, Plus, Edit2, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UniversalPagination } from '@/components/ui/UniversalPagination';
import { CharacterModal } from '@/components/media/CharacterModal';
import { UniversalTag } from '@/components/ui/UniversalTag';
import { MediaShelf } from '@/components/media/MediaShelf';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { OrganicLoader } from '@/components/ui/OrganicLoader';
import { WhereToWatch } from '@/components/media/WhereToWatch';
import { saveMediaListEntry, toggleFavourite, getViewerAndMediaUserData, type MediaListStatus } from '@/lib/anilist/queries';
import { useAuthStore } from '@/lib/store';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function AnimeDetailClient({ media }: { media: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [mediaEntry, setMediaEntry] = useState<any>(null);
  const [scoreFormat, setScoreFormat] = useState<string>('POINT_100');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  const { token, initializeAuth } = useAuthStore();

  const [formState, setFormState] = useState<{
    status: MediaListStatus;
    score: number;
    progress: number;
    repeat: number;
    notes: string;
  }>({
    status: 'CURRENT',
    score: 0,
    progress: 0,
    repeat: 0,
    notes: '',
  });

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (token === null) return; // Not initialized yet
    
    setIsCheckingUser(true);
    if (token) {
      getViewerAndMediaUserData(media.id, token).then((data) => {
        if (data) {
          const { viewer, media: mediaData } = data;
          
          if (viewer?.mediaListOptions?.scoreFormat) {
            setScoreFormat(viewer.mediaListOptions.scoreFormat);
          }

          if (mediaData) {
            setIsFavourite(mediaData.isFavourite ?? false);
            if (mediaData.mediaListEntry) {
              setMediaEntry(mediaData.mediaListEntry);
              setFormState({
                status: mediaData.mediaListEntry.status || 'CURRENT',
                score: mediaData.mediaListEntry.score || 0,
                progress: mediaData.mediaListEntry.progress || 0,
                repeat: mediaData.mediaListEntry.repeat || 0,
                notes: mediaData.mediaListEntry.notes || '',
              });
            }
          }
        }
      }).finally(() => {
        setIsCheckingUser(false);
      });
    } else {
      setIsCheckingUser(false);
    }
  }, [media.id, token]);

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const result = await saveMediaListEntry({
        mediaId: media.id,
        status: formState.status,
        score: formState.score,
        progress: formState.progress,
        repeat: formState.repeat,
        notes: formState.notes,
      }, token);
      setMediaEntry(result);
      setIsSheetOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavourite = async () => {
    if (!token) return;
    const previousState = isFavourite;
    setIsFavourite(!isFavourite); // Optimistic update
    try {
      await toggleFavourite(media.id, token);
    } catch (error) {
      setIsFavourite(previousState); // Revert on failure
      console.error(error);
    }
  };

  const relations = media.relations?.edges?.map((edge: any) => edge.node).filter(Boolean) || [];
  const recommendations = media.recommendations?.nodes?.map((node: any) => node.mediaRecommendation).filter(Boolean) || [];

  useGSAP(() => {
    // Hero Parallax
    if (heroImageRef.current) {
      gsap.to(heroImageRef.current, {
        yPercent: 50,
        opacity: 0,
        ease: 'none',
        force3D: true,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
      });
    }

    // Content Entrance
    const animateElements = gsap.utils.toArray('.animate-in');
    if (animateElements.length > 0) {
      gsap.fromTo(animateElements,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.05,
          ease: 'power2.out',
          delay: 0.2,
          force3D: true
        }
      );
    }
  }, { scope: containerRef });

  useGSAP(() => {
    if (isStatusDropdownOpen && dropdownRef.current) {
      gsap.fromTo('.dropdown-menu',
        { opacity: 0, scaleY: 0.8, y: -10 },
        { opacity: 1, scaleY: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, { scope: dropdownRef, dependencies: [isStatusDropdownOpen] });

  return (
    <div ref={containerRef} className="min-h-screen pb-32 bg-zinc-950 text-zinc-100">
      {/* Hero Section */}
      <div className="relative w-full h-[60vh] md:h-[70vh] min-h-[500px] overflow-hidden">
        <div ref={heroImageRef} className="absolute inset-0 w-full h-full bg-black">
          <Image
            src={media.bannerImage || media.coverImage?.extraLarge || 'https://picsum.photos/seed/anime-banner/1920/1080'}
            alt={media.title?.romaji || 'Hero Banner'}
            fill
            className="object-cover opacity-50"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            {/* Cover Art (Hidden on mobile hero, shown in grid below) */}
            <div className="hidden md:block md:col-span-3 lg:col-span-3 relative opacity-0 animate-in">
              <div className="aspect-[2/3] w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <Image
                  src={media.coverImage?.extraLarge || 'https://picsum.photos/seed/anime/400/600'}
                  alt={media.title?.romaji || 'Cover Art'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              </div>
            </div>

            {/* Title & Info */}
            <div className="md:col-span-9 lg:col-span-9 mb-4 md:mb-8">
              <div>
                <div className="flex flex-wrap gap-3 mb-4 opacity-0 animate-in">
                  {media.format && (
                    <UniversalTag className="bg-white/10 backdrop-blur-md border-white/10 text-zinc-200 uppercase tracking-wider">{media.format}</UniversalTag>
                  )}
                  {media.status && (
                    <UniversalTag className="bg-white/10 backdrop-blur-md border-white/10 text-zinc-200 uppercase tracking-wider">{media.status}</UniversalTag>
                  )}
                  {media.season && media.seasonYear && (
                    <UniversalTag className="bg-white/10 backdrop-blur-md border-white/10 text-zinc-200 uppercase tracking-wider">{media.season} {media.seasonYear}</UniversalTag>
                  )}
                </div>
                
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-2 tracking-tight opacity-0 animate-in">
                  {media.title?.english || media.title?.romaji}
                </h1>
                <p className="font-sans text-xl md:text-2xl text-zinc-400 font-light italic opacity-0 animate-in">
                  {media.title?.native}
                </p>

                {/* Mobile Action Buttons */}
                <div className="flex md:hidden gap-3 mt-6 opacity-0 animate-in">
                  <Button className="flex-1" onClick={() => setIsSheetOpen(true)} disabled={isCheckingUser}>
                    {isCheckingUser ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : mediaEntry ? (
                      <><Edit2 className="w-5 h-5" /> Update</>
                    ) : (
                      <><Plus className="w-5 h-5" /> Add</>
                    )}
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={handleToggleFavourite}>
                    <Heart className={`w-5 h-5 ${isFavourite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Sidebar (Desktop) */}
        <div className="hidden md:block md:col-span-3 lg:col-span-3 space-y-6">
          <div className="flex flex-col gap-3 opacity-0 animate-in">
            <Button className="w-full" onClick={() => setIsSheetOpen(true)} disabled={isCheckingUser}>
              {isCheckingUser ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Loading...</>
              ) : mediaEntry ? (
                <><Edit2 className="w-5 h-5" /> Update</>
              ) : (
                <><Plus className="w-5 h-5" /> Add to List</>
              )}
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleToggleFavourite}>
                <Heart className={`w-5 h-5 ${isFavourite ? 'fill-red-500 text-red-500' : ''}`} />
                Favorite
              </Button>
              <Button variant="secondary" className="flex-1">
                <Share2 className="w-5 h-5" />
                Share
              </Button>
            </div>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-6 opacity-0 animate-in">
            <div>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Episodes</span>
                  <span className="font-mono text-white">{media.episodes || 'TBA'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Duration</span>
                  <span className="font-mono text-white">{media.duration ? `${media.duration}m` : 'TBA'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Score</span>
                  <span className="font-mono text-white">{media.meanScore ? `${media.meanScore}%` : 'TBA'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Studios</h3>
              <div className="flex flex-wrap gap-2">
                {media.studios?.nodes?.map((s: any) => (
                  <span key={s.id} className="text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {media.genres?.map((genre: string) => (
                  <UniversalTag key={genre}>
                    {genre}
                  </UniversalTag>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-9 lg:col-span-9 space-y-12">
          {/* Mobile Cover Art & Info (Visible only on mobile) */}
          <div className="md:hidden flex gap-6 opacity-0 animate-in">
            <div className="w-32 flex-shrink-0">
              <div className="aspect-[2/3] w-full rounded-lg overflow-hidden shadow-lg ring-1 ring-white/10 relative">
                <Image
                  src={media.coverImage?.extraLarge || 'https://picsum.photos/seed/anime/400/600'}
                  alt={media.title?.romaji || 'Cover Art'}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Score</span>
                <span className="text-white font-bold">{media.meanScore ? `${media.meanScore}%` : 'TBA'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Episodes</span>
                <span className="text-white">{media.episodes || 'TBA'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Year</span>
                <span className="text-white">{media.seasonYear || 'TBA'}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Duration</span>
                <span className="text-white">{media.duration ? `${media.duration}m` : 'TBA'}</span>
              </div>
              {media.studios?.nodes?.length > 0 && (
                <div className="flex flex-col border-b border-zinc-800 pb-2 gap-1">
                  <span className="text-zinc-500">Studios</span>
                  <div className="flex flex-wrap gap-1">
                    {media.studios.nodes.map((s: any) => (
                      <span key={s.id} className="text-white text-xs">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {media.genres?.length > 0 && (
                <div className="flex flex-col pb-2 gap-1">
                  <span className="text-zinc-500">Genres</span>
                  <div className="flex flex-wrap gap-1">
                    {media.genres.map((genre: string) => (
                      <UniversalTag key={genre}>
                        {genre}
                      </UniversalTag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="opacity-0 animate-in">
            <h2 className="font-display text-2xl font-bold text-white mb-4">Overview</h2>
            <div className="prose prose-invert prose-lg max-w-none text-zinc-400 leading-relaxed">
              <ReactMarkdown 
                rehypePlugins={[rehypeRaw, rehypeSanitize]} 
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({node, ...props}) => <a {...props} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" />,
                  strong: ({node, ...props}) => <strong {...props} className="text-white font-bold" />
                }}
              >
                {media.description || 'No description available.'}
              </ReactMarkdown>
            </div>
          </section>

          <WhereToWatch links={media.externalLinks} />

          <section className="opacity-0 animate-in">
            <h2 className="font-display text-2xl font-bold text-white mb-6">Characters</h2>
            <UniversalPagination
              items={media.characters?.edges || []}
              itemsPerPage={6}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              renderItem={(edge: any) => (
                <div 
                  key={edge.id} 
                  onClick={() => setSelectedCharacter(edge)}
                  className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden relative flex-shrink-0 ring-1 ring-white/10">
                    <Image src={edge.node.image?.large} alt={edge.node.name?.userPreferred} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium text-sm text-zinc-200 truncate group-hover:text-white transition-colors">{edge.node.name?.userPreferred}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">{edge.role?.toLowerCase()}</span>
                  </div>
                </div>
              )}
            />
          </section>
        </div>
      </div>

      {relations.length > 0 && (
        <div className="mt-12">
          <MediaShelf title="Franchise & Relations" items={relations} />
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-4">
          <MediaShelf title="Recommendations" items={recommendations} />
        </div>
      )}

      {selectedCharacter && (
        <CharacterModal 
          character={selectedCharacter} 
          bannerImage={media.bannerImage}
          onClose={() => setSelectedCharacter(null)} 
        />
      )}

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={mediaEntry ? "Update Entry" : "Add to List"}
      >
        {isSaving ? (
          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <OrganicLoader />
            <p className="text-zinc-400 font-sans animate-pulse">Saving changes...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-zinc-400">Status</label>
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="w-full flex items-center justify-between bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/20 transition-colors hover:bg-zinc-700"
              >
                <span>
                  {{
                    CURRENT: 'Watching',
                    PLANNING: 'Plan to watch',
                    COMPLETED: 'Completed',
                    REPEATING: 'Rewatching',
                    PAUSED: 'Paused',
                    DROPPED: 'Dropped'
                  }[formState.status] || 'Select Status'}
                </span>
                <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

                {isStatusDropdownOpen && (
                  <div
                    className="dropdown-menu absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {([
                      { value: 'CURRENT', label: 'Watching' },
                      { value: 'PLANNING', label: 'Plan to watch' },
                      { value: 'COMPLETED', label: 'Completed' },
                      { value: 'REPEATING', label: 'Rewatching' },
                      { value: 'PAUSED', label: 'Paused' },
                      { value: 'DROPPED', label: 'Dropped' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFormState({ ...formState, status: option.value });
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          formState.status === option.value
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Score {scoreFormat === 'POINT_100' ? '(0-100)' : scoreFormat.includes('10') ? '(0-10)' : scoreFormat === 'POINT_5' ? '(0-5)' : '(1-3)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={scoreFormat === 'POINT_100' ? 100 : scoreFormat.includes('10') ? 10 : scoreFormat === 'POINT_5' ? 5 : 3}
                  step={scoreFormat === 'POINT_10_DECIMAL' ? 0.1 : 1}
                  value={formState.score}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value) || 0;
                    const maxScore = scoreFormat === 'POINT_100' ? 100 : scoreFormat.includes('10') ? 10 : scoreFormat === 'POINT_5' ? 5 : 3;
                    if (val > maxScore) val = maxScore;
                    if (val < 0) val = 0;
                    setFormState({ ...formState, score: val });
                  }}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Episode Progress {media.episodes ? `(Max: ${media.episodes})` : ''}
                </label>
                <input
                  type="number"
                  min="0"
                  max={media.episodes || undefined}
                  value={formState.progress}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || 0;
                    if (media.episodes && val > media.episodes) val = media.episodes;
                    if (val < 0) val = 0;
                    setFormState({ ...formState, progress: val });
                  }}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Total Rewatches</label>
              <input
                type="number"
                min="0"
                value={formState.repeat}
                onChange={(e) => setFormState({ ...formState, repeat: parseInt(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Notes</label>
              <textarea
                value={formState.notes}
                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                rows={3}
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/20 resize-none"
                placeholder="Add your thoughts..."
              />
            </div>

            <Button onClick={handleSave} className="w-full py-6 text-lg">
              Save Changes
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
