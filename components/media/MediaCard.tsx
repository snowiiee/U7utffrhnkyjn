// components/media/MediaCard.tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { UniversalTag } from '@/components/ui/UniversalTag';
import { UniversalToolkit } from '@/components/ui/UniversalToolkit';

export function MediaCard({ media }: { media: any }) {
  return (
    <UniversalToolkit media={media}>
      <Link href={`/anime/${media.id}`} className="block w-full h-full">
        <article className='relative flex flex-col gap-3 h-full transition-transform duration-200 hover:-translate-y-1'>
          <div className='relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-800 shadow-lg ring-1 ring-white/10 group-hover:ring-white/20 transition-all'>
            <Image 
              src={media?.coverImage?.extraLarge || media?.coverImage?.large || 'https://picsum.photos/seed/anime/400/600'} 
              fill 
              alt={media?.title?.romaji || 'Anime Cover'} 
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            
            {media?.meanScore && (
              <div className="absolute top-2 right-2 z-10">
                <div className="flex items-center justify-center px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                  <span className="font-sans font-bold text-xs text-white">{media.meanScore}%</span>
                </div>
              </div>
            )}

            {media?.nextAiringEpisode && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-white/10 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md font-medium text-center border border-white/10 truncate">
                  Ep {media.nextAiringEpisode.episode} • {Math.floor(media.nextAiringEpisode.timeUntilAiring / 86400)}d left
                </div>
              </div>
            )}
          </div>
          
          <div className='flex flex-col px-1'>
            <h3 className='font-display font-medium text-base leading-tight line-clamp-1 text-zinc-100 group-hover:text-white transition-colors'>
              {media?.title?.userPreferred || media?.title?.romaji || 'Unknown Title'}
            </h3>
            <div className='flex items-center gap-2 mt-1'>
              {media?.format && (
                <UniversalTag className="px-2 py-0.5 text-[10px] h-auto min-h-0">
                  {media.format === 'TV' ? 'Series' : media.format}
                </UniversalTag>
              )}
              {media?.seasonYear && (
                <span className="text-xs text-zinc-500 font-medium">
                  {media.seasonYear}
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    </UniversalToolkit>
  );
}
