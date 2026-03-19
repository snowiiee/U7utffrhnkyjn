// app/profile/page.tsx
'use client';
import { useRef, useState, useEffect } from 'react';
import { User, ExternalLink, Save, LogOut, Share2, Download, Sparkles, Swords, Heart, Laugh, Brain, Ghost, Coffee, Rocket, Shield, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { request, gql } from 'graphql-request';
import Image from 'next/image';
import * as htmlToImage from 'html-to-image';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

import { UnauthenticatedProfile } from '@/components/profile/UnauthenticatedProfile';
import { MediaShelf } from '@/components/media/MediaShelf';
import { OrganicLoader } from '@/components/ui/OrganicLoader';

import { ProfileStats } from '@/components/profile/ProfileStats';
import { useAuthStore } from '@/lib/store';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

const getTasteTitle = (genres: any[]) => {
  if (!genres || genres.length === 0) return { title: 'Anime Watcher', icon: Sparkles };
  const topGenre = genres[0].genre.toLowerCase();
  
  switch (topGenre) {
    case 'action': return { title: 'Shounen Junkie', icon: Swords };
    case 'romance': return { title: 'Rom-Com Connoisseur', icon: Heart };
    case 'comedy': return { title: 'Laugh Track Enthusiast', icon: Laugh };
    case 'drama': return { title: 'Tearjerker Veteran', icon: Sparkles };
    case 'sci-fi': return { title: 'Sci-Fi Visionary', icon: Rocket };
    case 'fantasy': return { title: 'Isekai Traveler', icon: Shield };
    case 'slice of life': return { title: 'Slice of Life Enjoyer', icon: Coffee };
    case 'mecha': return { title: 'Mecha Pilot', icon: Rocket };
    case 'sports': return { title: 'Sports Champion', icon: Trophy };
    case 'psychological': return { title: 'Mind Game Master', icon: Brain };
    case 'thriller': return { title: 'Edge of Seat Watcher', icon: Brain };
    case 'horror': return { title: 'Horror Survivor', icon: Ghost };
    case 'mystery': return { title: 'Mystery Solver', icon: Brain };
    default: return { title: `${genres[0].genre} Enthusiast`, icon: Sparkles };
  }
};

const VIEWER_QUERY = gql`
  query {
    Viewer {
      id
      name
      avatar {
        large
      }
      bannerImage
      statistics {
        anime {
          count
          minutesWatched
          episodesWatched
          meanScore
          genres(limit: 6, sort: COUNT_DESC) {
            genre
            count
          }
          scores(sort: ID_DESC) {
            score
            count
          }
          startYears(limit: 50, sort: COUNT_DESC) {
            startYear
            count
          }
        }
      }
      favourites {
        anime(page: 1, perPage: 15) {
          nodes {
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

const FULL_LIST_QUERY = gql`
  query($userId: Int!) {
    MediaListCollection(userId: $userId, type: ANIME) {
      lists {
        status
        entries {
          progress
          startedAt {
            year
            month
            day
          }
          completedAt {
            year
            month
            day
          }
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

export default function ProfilePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const { token, setToken, initializeAuth, logout } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (token) {
      validateAndFetchUser(token);
    } else {
      setIsLoading(false);
    }

    // Listen for OAuth success from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ANILIST_AUTH_SUCCESS' && event.data.token) {
        const newToken = event.data.token;
        setToken(newToken);
        validateAndFetchUser(newToken);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [token, setToken]);

  const validateAndFetchUser = async (accessToken: string) => {
    setIsLoading(true);
    setError('');
    try {
      const data: any = await request(
        ANILIST_ENDPOINT, 
        VIEWER_QUERY, 
        {}, 
        { Authorization: `Bearer ${accessToken}` }
      );
      
      if (data.Viewer) {
        let currentList = [];
        try {
          const listData: any = await request(
            ANILIST_ENDPOINT,
            FULL_LIST_QUERY,
            { userId: data.Viewer.id },
            { Authorization: `Bearer ${accessToken}` }
          );
          
          const lists = listData.MediaListCollection?.lists || [];
          
          // Get current list for the shelf
          const currentListObj = lists.find((l: any) => l.status === 'CURRENT');
          currentList = currentListObj ? currentListObj.entries : [];

          // Calculate Era Timeline from watched anime
          const yearCounts = new Map<number, number>();
          
          lists.forEach((list: any) => {
            // Skip 'PLANNING' list as it's not watched yet
            if (list.status === 'PLANNING') return;
            
            list.entries.forEach((entry: any) => {
              const year = entry.media.startDate?.year;
              if (year) {
                yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
              }
            });
          });

          const calculatedStartYears = Array.from(yearCounts.entries())
            .map(([startYear, count]) => ({ startYear, count }))
            .sort((a, b) => a.startYear - b.startYear);

          // Override the API statistics with our calculated data
          if (data.Viewer.statistics?.anime) {
            data.Viewer.statistics.anime.startYears = calculatedStartYears;
          }

          // Collect completed entries with startedAt and completedAt for Watch Pace
          const completedListObj = lists.find((l: any) => l.status === 'COMPLETED');
          const completedEntries = completedListObj ? completedListObj.entries.filter((entry: any) => 
            entry.startedAt?.year && entry.completedAt?.year
          ) : [];

          setUserData({ ...data.Viewer, currentList, completedEntries });
          return;

        } catch (e) {
          console.error("Failed to fetch user lists", e);
        }
        
        setUserData({ ...data.Viewer, currentList: [], completedEntries: [] });
      } else {
        throw new Error('Invalid token');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid token. Please try again.');
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToken = () => {
    if (!token) return;
    validateAndFetchUser(token);
  };

  const handleLogout = () => {
    logout();
    setUserData(null);
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingCard(true);
    try {
      const dataUrl = await htmlToImage.toPng(shareCardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#09090b', // zinc-950
      });
      
      const link = document.createElement('a');
      link.download = `${userData.name}-anime-stats.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    if (iconRef.current) {
      tl.fromTo(iconRef.current,
        { scale: 0, rotation: -45, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' }
      );
    }
    
    if (contentRef.current) {
      tl.fromTo(contentRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
        "-=0.4"
      );
    }
  }, { scope: containerRef, dependencies: [userData] }); // Re-run animation when view changes

  if (isLoading && !userData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <OrganicLoader />
      </div>
    );
  }

  if (userData) {
    return (
      <div key="logged-in" ref={containerRef} className="min-h-screen bg-zinc-950 relative overflow-x-hidden pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950 pointer-events-none" />
        
        {userData.bannerImage && (
          <div className="absolute top-0 left-0 right-0 h-80 opacity-20 pointer-events-none">
            <Image src={userData.bannerImage} alt="Banner" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/80 to-zinc-950" />
          </div>
        )}

        <div className="relative z-10 pt-20 md:pt-32">
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center w-full mb-16">
            <div ref={contentRef}>
              <div className={userData.avatar?.large?.toLowerCase().includes('.png') ? "w-32 h-32 mx-auto mb-6 relative drop-shadow-2xl" : "w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 ring-4 ring-zinc-800 shadow-2xl relative"}>
                <Image 
                  src={userData.avatar?.large || 'https://picsum.photos/seed/avatar/200'} 
                  alt={userData.name} 
                  fill
                  className={userData.avatar?.large?.toLowerCase().includes('.png') ? "object-contain" : "object-cover"}
                />
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                {userData.name}
              </h1>
              
              {userData.statistics?.anime?.genres && (
                <div className="flex items-center justify-center gap-2 text-zinc-400 mb-6">
                  {(() => {
                    const { title, icon: Icon } = getTasteTitle(userData.statistics.anime.genres);
                    return (
                      <>
                        <Icon className="w-5 h-5 text-zinc-300" />
                        <span className="font-medium text-zinc-300">{title}</span>
                      </>
                    );
                  })()}
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 mb-8 text-left">
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Total Anime</div>
                  <div className="text-3xl font-display font-bold text-white">{userData.statistics?.anime?.count || 0}</div>
                </div>
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Episodes</div>
                  <div className="text-3xl font-display font-bold text-white">{userData.statistics?.anime?.episodesWatched || 0}</div>
                </div>
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Hours Watched</div>
                  <div className="text-3xl font-display font-bold text-white">{Math.round((userData.statistics?.anime?.minutesWatched || 0) / 60)}</div>
                </div>
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Mean Score</div>
                  <div className="text-3xl font-display font-bold text-white">{userData.statistics?.anime?.meanScore || 0}</div>
                </div>
                
                {userData.statistics?.anime?.genres && userData.statistics.anime.genres.length > 0 && (
                  <div className="col-span-2 md:col-span-4 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-4">Top Genres</div>
                    <div className="flex flex-wrap gap-2">
                      {userData.statistics.anime.genres.map((g: any) => (
                        <div key={g.genre} className="px-3 py-1.5 bg-zinc-800/50 rounded-lg text-sm flex items-center gap-2 border border-white/5">
                          <span className="text-zinc-200 font-medium">{g.genre}</span>
                          <span className="text-zinc-500 text-xs">{g.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button 
                  variant="secondary"
                  onClick={handleShare}
                  disabled={isGeneratingCard}
                  className="text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700"
                >
                  {isGeneratingCard ? <OrganicLoader className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                  Share Profile
                </Button>
                <Button 
                  variant="secondary"
                  onClick={handleLogout}
                  className="text-zinc-400 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {userData.currentList && userData.currentList.length > 0 && (
              <MediaShelf title="Continue Watching" items={userData.currentList.map((entry: any) => entry.media)} />
            )}
            
            {userData.favourites?.anime?.nodes && userData.favourites.anime.nodes.length > 0 && (
              <MediaShelf title="Favorite Anime" items={userData.favourites.anime.nodes} />
            )}

            {userData.statistics && (
              <ProfileStats 
                statistics={userData.statistics} 
                listEntries={userData.completedEntries || []} 
              />
            )}
          </div>
        </div>

        {/* Hidden Share Card */}
        <div className="fixed -left-[9999px] top-0 pointer-events-none">
          <div 
            ref={shareCardRef} 
            className="w-[800px] bg-zinc-950 p-10 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ backgroundImage: 'radial-gradient(circle at center, rgba(39,39,42,0.5) 0%, rgba(9,9,11,1) 100%)' }}
          >
            {userData.bannerImage && (
              <div className="absolute top-0 left-0 right-0 h-48 opacity-30">
                <img src={userData.bannerImage} alt="Banner" className="w-full h-full object-cover" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950" />
              </div>
            )}
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className={userData.avatar?.large?.toLowerCase().includes('.png') ? "w-32 h-32 mx-auto mb-6 relative drop-shadow-2xl" : "w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 ring-4 ring-zinc-800 shadow-2xl relative"}>
                <img 
                  src={userData.avatar?.large || 'https://picsum.photos/seed/avatar/200'} 
                  alt={userData.name} 
                  className={userData.avatar?.large?.toLowerCase().includes('.png') ? "w-full h-full object-contain" : "w-full h-full object-cover"}
                  crossOrigin="anonymous"
                />
              </div>
              <h1 className="font-display text-5xl font-bold text-white mb-2 tracking-tight">
                {userData.name}
              </h1>
              {userData.statistics?.anime?.genres && (
                <div className="flex items-center justify-center gap-2 text-zinc-300 mb-8 text-xl">
                  {(() => {
                    const { title, icon: Icon } = getTasteTitle(userData.statistics.anime.genres);
                    return (
                      <>
                        <Icon className="w-6 h-6" />
                        <span className="font-medium">{title}</span>
                      </>
                    );
                  })()}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-8 w-full mb-8">
                {/* Left Column: Stats & Top Anime */}
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 text-center">
                      <div className="text-sm text-zinc-400 uppercase tracking-wider font-medium mb-2">Total Anime</div>
                      <div className="text-4xl font-display font-bold text-white">{userData.statistics?.anime?.count || 0}</div>
                    </div>
                    <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 text-center">
                      <div className="text-sm text-zinc-400 uppercase tracking-wider font-medium mb-2">Hours Watched</div>
                      <div className="text-4xl font-display font-bold text-white">{Math.round((userData.statistics?.anime?.minutesWatched || 0) / 60)}</div>
                    </div>
                  </div>

                  {/* Top 3 Anime */}
                  {userData.favourites?.anime?.nodes && userData.favourites.anime.nodes.length > 0 && (
                    <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6">
                      <div className="text-sm text-zinc-400 uppercase tracking-wider font-medium mb-4 text-center">Top Favorites</div>
                      <div className="flex justify-center gap-4">
                        {userData.favourites.anime.nodes.slice(0, 3).map((anime: any) => (
                          <div key={anime.id} className="w-24 flex flex-col gap-2 items-center">
                            <div className="w-24 h-36 rounded-lg overflow-hidden relative shadow-lg">
                              <img 
                                src={anime.coverImage?.large} 
                                alt={anime.title?.userPreferred}
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                              />
                            </div>
                            <span className="text-xs text-zinc-300 text-center line-clamp-2 font-medium">
                              {anime.title?.userPreferred}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Radar Chart */}
                {userData.statistics?.anime?.genres && userData.statistics.anime.genres.length > 0 && (
                  <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
                    <div className="text-sm text-zinc-400 uppercase tracking-wider font-medium mb-2 text-center">Taste Radar</div>
                    <div className="w-full h-[240px] flex items-center justify-center">
                      <RadarChart 
                        cx="50%" cy="50%" 
                        outerRadius="70%" 
                        width={300} 
                        height={240}
                        data={userData.statistics.anime.genres.slice(0, 6).map((g: any) => ({
                          subject: g.genre,
                          A: g.count,
                          fullMark: Math.max(...userData.statistics.anime.genres.map((g: any) => g.count)),
                        }))}
                      >
                        <PolarGrid stroke="#3f3f46" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar
                          name="Genres"
                          dataKey="A"
                          stroke="#ffffff"
                          strokeWidth={2}
                          fill="#ffffff"
                          fillOpacity={0.2}
                          isAnimationActive={false}
                        />
                      </RadarChart>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-zinc-500 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>AniList Stats</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UnauthenticatedProfile 
      token={token}
      setToken={setToken}
      handleSaveToken={handleSaveToken}
      isLoading={isLoading}
      error={error}
    />
  );
}
