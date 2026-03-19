import { getCategoryAnime } from '@/lib/anilist/queries';
import { ExploreClient } from './ExploreClient';

export default async function ExplorePage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  
  const validCategories = ['trending', 'this-season', 'top-rated'];
  if (!validCategories.includes(category)) {
    return <div className="min-h-screen bg-zinc-950 text-white p-24 text-center">Category not found</div>;
  }

  const initialData = await getCategoryAnime(category, 1, 50);

  let title = 'Explore';
  if (category === 'trending') title = 'Trending Now';
  if (category === 'this-season') title = 'This Season';
  if (category === 'top-rated') title = 'Top Rated';

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-24 md:pt-32">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
          {title}
        </h1>
        <ExploreClient initialData={initialData} category={category} />
      </div>
    </div>
  );
}
