'use client';

import { useState } from 'react';
import { getCategoryAnime } from '@/lib/anilist/queries';
import { MediaGrid } from '@/components/media/MediaGrid';

export function ExploreClient({ initialData, category }: { initialData: any, category: string }) {
  const [items, setItems] = useState<any[]>(initialData.media || []);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialData.pageInfo?.hasNextPage || false);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const nextPage = page + 1;
    
    try {
      const data = await getCategoryAnime(category, nextPage, 50);
      
      if (data && data.media) {
        setItems(prev => [...prev, ...data.media]);
        setPage(nextPage);
        setHasNextPage(data.pageInfo?.hasNextPage || false);
      } else {
        setHasNextPage(false);
      }
    } catch (error) {
      console.error("Failed to load more items", error);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MediaGrid 
      items={items} 
      hasNextPage={hasNextPage} 
      isLoading={isLoading} 
      onLoadMore={loadMore} 
    />
  );
}
