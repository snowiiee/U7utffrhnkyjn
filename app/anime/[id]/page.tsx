// app/anime/[id]/page.tsx
import { getMediaDetail } from '@/lib/anilist/queries';
import { notFound } from 'next/navigation';
import { AnimeDetailClient } from './AnimeDetailClient';

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await getMediaDetail(parseInt(id, 10));

  if (!media) {
    notFound();
  }

  return <AnimeDetailClient media={media} />;
}
