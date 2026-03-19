export const FILTER_OPTIONS = {
  Type: [
    { label: 'Anime', value: 'ANIME' },
    { label: 'Manga', value: 'MANGA' },
  ],
  Genre: [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
    'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
    'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
  ],
  Year: Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() + 1 - i).toString()),
  Status: [
    { label: 'Airing', value: 'RELEASING' },
    { label: 'Finished', value: 'FINISHED' },
    { label: 'Not Yet Released', value: 'NOT_YET_RELEASED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Hiatus', value: 'HIATUS' },
  ],
  Season: [
    { label: 'Winter', value: 'WINTER' },
    { label: 'Spring', value: 'SPRING' },
    { label: 'Summer', value: 'SUMMER' },
    { label: 'Fall', value: 'FALL' },
  ],
};
