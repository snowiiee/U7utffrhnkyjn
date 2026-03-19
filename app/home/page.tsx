// app/page.tsx
import { getHomeData } from '@/lib/anilist/queries';
import { HeroCarousel } from '@/components/media/HeroCarousel';
import { MediaShelf } from '@/components/media/MediaShelf';
import { Suspense } from 'react';

export default async function Home() {
  const { trending, thisSeason, topRated } = await getHomeData();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 pb-24">
      <HeroCarousel items={trending} />
      
      <div className="relative z-20 space-y-10 -mt-20 md:-mt-32">
        <Suspense fallback={<div className="h-64 animate-pulse bg-zinc-900/50 rounded-xl mx-4" />}>
          <MediaShelf title="Trending Now" items={trending} viewAllHref="/explore/trending" />
        </Suspense>
        
        <Suspense fallback={<div className="h-64 animate-pulse bg-zinc-900/50 rounded-xl mx-4" />}>
          <MediaShelf title="This Season" items={thisSeason} viewAllHref="/explore/this-season" />
        </Suspense>
        
        <Suspense fallback={<div className="h-64 animate-pulse bg-zinc-900/50 rounded-xl mx-4" />}>
          <MediaShelf title="Top Rated" items={topRated} viewAllHref="/explore/top-rated" />
        </Suspense>
      </div>
    </div>
  );
}
