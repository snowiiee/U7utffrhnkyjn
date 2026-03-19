// lib/anilist/queries.ts
import { request, gql } from 'graphql-request';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

// --- Shared Fragments ---
const MEDIA_FRAGMENT = gql`
  fragment MediaFragment on Media {
    id
    title {
      romaji
      english
      native
      userPreferred
    }
    coverImage {
      extraLarge
      large
      medium
      color
    }
    bannerImage
    format
    episodes
    meanScore
    nextAiringEpisode {
      episode
      timeUntilAiring
    }
  }
`;

// --- Helpers ---
// Use server-side proxy for authenticated requests to hide token from browser
async function authenticatedRequest<T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> {
  const isClient = typeof window !== 'undefined';
  
  if (isClient) {
    // Use proxy on client-side to hide token
    const response = await fetch('/api/anilist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
    });
    
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } else {
    // Direct request on server-side
    return request(ANILIST_ENDPOINT, query, variables, { Authorization: `Bearer ${token}` });
  }
}

function sanitizeSearchInput(input: string): string {
  // Remove potentially dangerous characters and limit length
  return input
    .trim()
    .slice(0, 100) // Limit to 100 chars
    .replace(/[<>{}[\]\\]/g, '') // Remove HTML/script injection chars
    .replace(/\s+/g, ' '); // Normalize whitespace
}

function getCurrentSeason() {
  const month = new Date().getMonth(); // 0-11
  const year = new Date().getFullYear();

  let season = 'WINTER';
  if (month >= 2 && month <= 4) season = 'SPRING';
  else if (month >= 5 && month <= 7) season = 'SUMMER';
  else if (month >= 8 && month <= 10) season = 'FALL';

  // If it's December, it's Winter of the NEXT year in anime terms usually, 
  // but AniList treats Dec as Winter of the current year start.
  // Actually, Winter is Jan-Mar. Dec is part of the next year's Winter season contextually, 
  // but for API queries, we usually query the current year/season.
  // Let's stick to standard:
  // Winter: Jan, Feb, Mar
  // Spring: Apr, May, Jun
  // Summer: Jul, Aug, Sep
  // Fall: Oct, Nov, Dec
  
  return { season, year };
}

// --- Types ---
export interface MediaTitle {
  romaji: string;
  english: string | null;
  native: string;
  userPreferred: string;
}

export interface MediaCoverImage {
  extraLarge: string;
  large: string;
  medium?: string;
  color: string | null;
}

export interface NextAiringEpisode {
  episode: number;
  timeUntilAiring: number;
}

export interface Studio {
  id: number;
  name: string;
}

export interface CharacterName {
  userPreferred: string;
  native: string | null;
}

export interface Character {
  id: number;
  name: CharacterName;
  image: { large: string };
  description: string | null;
  gender: string | null;
  age: string | null;
  dateOfBirth: { year: number | null; month: number | null; day: number | null } | null;
}

export interface CharacterEdge {
  id: number;
  role: 'MAIN' | 'SUPPORTING' | 'BACKGROUND';
  node: Character;
}

export interface RelationEdge {
  relationType: string;
  node: Media;
}

export interface RecommendationNode {
  mediaRecommendation: Media;
}

export interface ExternalLink {
  id: number;
  url: string;
  site: string;
  icon: string | null;
  color: string | null;
  type: string;
}

export interface FuzzyDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface MediaListEntry {
  id: number;
  status: MediaListStatus;
  score: number;
  progress: number;
  repeat: number;
  notes: string;
  startedAt: FuzzyDate | null;
  completedAt: FuzzyDate | null;
}

export type MediaListStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';
export type MediaFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
export type MediaSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
export type MediaStatus = 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';

export interface Media {
  id: number;
  title: MediaTitle;
  coverImage: MediaCoverImage;
  bannerImage: string | null;
  format: MediaFormat;
  episodes: number | null;
  meanScore: number | null;
  nextAiringEpisode: NextAiringEpisode | null;
  season?: MediaSeason;
  seasonYear?: number;
  description?: string | null;
  genres?: string[];
  isFavourite?: boolean;
  mediaListEntry?: MediaListEntry | null;
  studios?: {
    nodes: Studio[];
  };
  characters?: {
    edges: CharacterEdge[];
  };
  relations?: {
    edges: RelationEdge[];
  };
  recommendations?: {
    nodes: RecommendationNode[];
  };
  externalLinks?: ExternalLink[];
}

export interface Viewer {
  id: number;
  name: string;
  mediaListOptions: {
    scoreFormat: string;
  };
}

export interface SearchFilters {
  type?: 'ANIME' | 'MANGA';
  genre?: string[];
  season?: MediaSeason;
  year?: string;
  status?: MediaStatus;
  format?: MediaFormat;
}

interface PageResponse {
  Page: {
    pageInfo: {
      hasNextPage: boolean;
      total: number;
    };
    media: Media[];
  };
}

interface HomeDataResponse {
  trending: { media: Media[] };
  thisSeason: { media: Media[] };
  topRated: { media: Media[] };
}

// --- Queries ---

export const getHomeData = async () => {
  const { season, year } = getCurrentSeason();

  const query = gql`
    ${MEDIA_FRAGMENT}

    query($season: MediaSeason, $seasonYear: Int) {
      trending: Page(page: 1, perPage: 10) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ...MediaFragment
        }
      }
      thisSeason: Page(page: 1, perPage: 10) {
        media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ...MediaFragment
        }
      }
      topRated: Page(page: 1, perPage: 10) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          ...MediaFragment
        }
      }
    }
  `;

  try {
    const data = await request<HomeDataResponse>(ANILIST_ENDPOINT, query, { season, seasonYear: year });
    return {
      trending: data.trending.media,
      thisSeason: data.thisSeason.media,
      topRated: data.topRated.media,
    };
  } catch (error) {
    console.error('Error fetching home data:', error);
    return {
      trending: [],
      thisSeason: [],
      topRated: [],
    };
  }
};

export const getViewerAndMediaUserData = async (mediaId: number, token: string): Promise<{ viewer: Viewer; media: Media } | null> => {
  const query = gql`
    query ($mediaId: Int) {
      Viewer {
        id
        name
        mediaListOptions {
          scoreFormat
        }
      }
      Media(id: $mediaId) {
        id
        isFavourite
        mediaListEntry {
          id
          status
          score
          progress
          repeat
          notes
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
        }
      }
    }
  `;
  try {
    const data: any = await authenticatedRequest(query, { mediaId }, token);
    return {
      viewer: data.Viewer,
      media: data.Media
    };
  } catch (error) {
    console.error('Error fetching viewer and media user data:', error);
    return null;
  }
};

export const getTrendingAnime = async () => {
  const query = gql`
    ${MEDIA_FRAGMENT}
    query {
      Page(page: 1, perPage: 10) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          ...MediaFragment
        }
      }
    }
  `;

  try {
    const data = await request<PageResponse>(ANILIST_ENDPOINT, query);
    return data.Page.media;
  } catch (error) {
    console.error('Error fetching trending anime:', error);
    return [];
  }
};

export const getThisSeasonAnime = async () => {
  const { season, year } = getCurrentSeason();
  const query = gql`
    ${MEDIA_FRAGMENT}
    query($season: MediaSeason, $seasonYear: Int) {
      Page(page: 1, perPage: 10) {
        media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          ...MediaFragment
        }
      }
    }
  `;

  try {
    const data = await request<PageResponse>(ANILIST_ENDPOINT, query, { season, seasonYear: year });
    return data.Page.media;
  } catch (error) {
    console.error('Error fetching this season anime:', error);
    return [];
  }
};

export const getTopRatedAnime = async () => {
  const query = gql`
    ${MEDIA_FRAGMENT}
    query {
      Page(page: 1, perPage: 10) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          ...MediaFragment
        }
      }
    }
  `;

  try {
    const data = await request<PageResponse>(ANILIST_ENDPOINT, query);
    return data.Page.media;
  } catch (error) {
    console.error('Error fetching top rated anime:', error);
    return [];
  }
};

export const getCategoryAnime = async (category: string, page: number = 1, perPage: number = 50) => {
  let sort = 'POPULARITY_DESC';
  let season: string | undefined = undefined;
  let seasonYear: number | undefined = undefined;
  
  if (category === 'trending') {
    sort = 'TRENDING_DESC';
  } else if (category === 'this-season') {
    sort = 'POPULARITY_DESC';
    const current = getCurrentSeason();
    season = current.season;
    seasonYear = current.year;
  } else if (category === 'top-rated') {
    sort = 'SCORE_DESC';
  }

  const query = gql`
    ${MEDIA_FRAGMENT}
    query($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          total
        }
        media(sort: $sort, type: ANIME, isAdult: false, season: $season, seasonYear: $seasonYear) {
          ...MediaFragment
        }
      }
    }
  `;

  try {
    const variables = { 
      page, 
      perPage, 
      sort: [sort], 
      season, 
      seasonYear 
    };
    const data = await request<PageResponse>(ANILIST_ENDPOINT, query, variables);
    return data.Page;
  } catch (error) {
    console.error('Error fetching category anime:', error);
    return { media: [], pageInfo: { hasNextPage: false, total: 0 } };
  }
};

export const searchMedia = async (search: string, filters: SearchFilters = {}): Promise<Media[]> => {
  const query = gql`
    query ($search: String, $type: MediaType, $genre_in: [String], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $format: MediaFormat) {
      Page(page: 1, perPage: 20) {
        media(search: $search, type: $type, genre_in: $genre_in, season: $season, seasonYear: $seasonYear, status: $status, format: $format, isAdult: false, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
            userPreferred
          }
          coverImage {
            extraLarge
            large
            color
          }
          bannerImage
          format
          episodes
          meanScore
          nextAiringEpisode {
            episode
            timeUntilAiring
          }
        }
      }
    }
  `;

  const sanitizedSearch = search ? sanitizeSearchInput(search) : undefined;
  
  const variables = {
    search: sanitizedSearch || undefined,
    type: filters.type || 'ANIME',
    genre_in: filters.genre?.length ? filters.genre : undefined,
    season: filters.season || undefined,
    seasonYear: filters.year ? parseInt(filters.year) : undefined,
    status: filters.status || undefined,
    format: filters.format || undefined,
  };

  try {
    const data = await request<PageResponse>(ANILIST_ENDPOINT, query, variables);
    return data.Page.media;
  } catch (error) {
    console.error('Error searching media:', error);
    return [];
  }
};
export const getMediaDetail = async (id: number): Promise<Media | null> => {
  const query = gql`
    query ($id: Int) {
      Media(id: $id) {
        id
        title {
          romaji
          english
          native
          userPreferred
        }
        coverImage {
          extraLarge
          large
          color
        }
        bannerImage
        format
        episodes
        meanScore
        season
        seasonYear
        description
        genres
        studios(isMain: true) {
          nodes {
            id
            name
          }
        }
        nextAiringEpisode {
          episode
          timeUntilAiring
        }
        characters(sort: ROLE, perPage: 50) {
          edges {
            id
            role
            node {
              id
              name {
                userPreferred
                native
              }
              image {
                large
              }
              description
              gender
              age
              dateOfBirth {
                year
                month
                day
              }
            }
          }
        }
        externalLinks {
          id
          url
          site
          icon
          color
          type
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
              coverImage {
                extraLarge
                large
                color
              }
              bannerImage
              format
              meanScore
              nextAiringEpisode {
                episode
                timeUntilAiring
              }
            }
          }
        }
        recommendations(sort: RATING_DESC, perPage: 15) {
          nodes {
            mediaRecommendation {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
              coverImage {
                extraLarge
                large
                color
              }
              bannerImage
              format
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

  try {
    const data: any = await request(ANILIST_ENDPOINT, query, { id });
    return data.Media;
  } catch (error) {
    console.error('Error fetching media detail:', error);
    return null;
  }
};

export const getViewer = async (token: string) => {
  const query = gql`
    query {
      Viewer {
        id
        name
        mediaListOptions {
          scoreFormat
        }
      }
    }
  `;
  try {
    const data: any = await authenticatedRequest(query, {}, token);
    return data.Viewer;
  } catch (error) {
    console.error('Error fetching viewer:', error);
    return null;
  }
};

export const getMediaUserData = async (mediaId: number, token: string) => {
  const query = gql`
    query ($mediaId: Int) {
      Media(id: $mediaId) {
        id
        isFavourite
        mediaListEntry {
          id
          status
          score
          progress
          repeat
          notes
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
        }
      }
    }
  `;
  try {
    const data: any = await authenticatedRequest(query, { mediaId }, token);
    return data.Media;
  } catch (error) {
    console.error('Error fetching media user data:', error);
    return null;
  }
};

export interface SaveMediaListEntryVariables {
  mediaId: number;
  status?: MediaListStatus;
  score?: number;
  progress?: number;
  repeat?: number;
  notes?: string;
  startedAt?: FuzzyDate;
  completedAt?: FuzzyDate;
}

export const saveMediaListEntry = async (variables: SaveMediaListEntryVariables, token: string): Promise<MediaListEntry> => {
  const mutation = gql`
    mutation ($mediaId: Int, $status: MediaListStatus, $score: Float, $progress: Int, $repeat: Int, $notes: String, $startedAt: FuzzyDateInput, $completedAt: FuzzyDateInput) {
      SaveMediaListEntry(mediaId: $mediaId, status: $status, score: $score, progress: $progress, repeat: $repeat, notes: $notes, startedAt: $startedAt, completedAt: $completedAt) {
        id
        status
        score
        progress
        repeat
        notes
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
      }
    }
  `;
  try {
    const data: any = await authenticatedRequest(mutation, variables, token);
    return data.SaveMediaListEntry;
  } catch (error) {
    console.error('Error saving media list entry:', error);
    throw error;
  }
};

export const toggleFavourite = async (animeId: number, token: string) => {
  const mutation = gql`
    mutation ($animeId: Int) {
      ToggleFavourite(animeId: $animeId) {
        anime {
          pageInfo {
            total
          }
        }
      }
    }
  `;
  try {
    const data: any = await authenticatedRequest(mutation, { animeId }, token);
    return data.ToggleFavourite;
  } catch (error) {
    console.error('Error toggling favourite:', error);
    throw error;
  }
};
