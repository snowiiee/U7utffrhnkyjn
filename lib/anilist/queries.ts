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
export interface Media {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
    userPreferred: string;
  };
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
    color: string;
  };
  bannerImage: string;
  format: string;
  episodes: number;
  meanScore: number;
  nextAiringEpisode: {
    episode: number;
    timeUntilAiring: number;
  };
  season?: string;
  seasonYear?: number;
  description?: string;
  genres?: string[];
  studios?: {
    nodes: {
      id: number;
      name: string;
    }[];
  };
  characters?: {
    edges: any[];
  };
  relations?: {
    edges: any[];
  };
  recommendations?: {
    nodes: any[];
  };
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

export const getViewerAndMediaUserData = async (mediaId: number, token: string) => {
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
    const data: any = await request(ANILIST_ENDPOINT, query, { mediaId }, { Authorization: `Bearer ${token}` });
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

export const searchMedia = async (search: string, filters: any = {}) => {
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

  const variables = {
    search: search || undefined,
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
export const getMediaDetail = async (id: number) => {
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
    const data: any = await request(ANILIST_ENDPOINT, query, undefined, { Authorization: `Bearer ${token}` });
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
    const data: any = await request(ANILIST_ENDPOINT, query, { mediaId }, { Authorization: `Bearer ${token}` });
    return data.Media;
  } catch (error) {
    console.error('Error fetching media user data:', error);
    return null;
  }
};

export const saveMediaListEntry = async (variables: any, token: string) => {
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
    const data: any = await request(ANILIST_ENDPOINT, mutation, variables, { Authorization: `Bearer ${token}` });
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
    const data: any = await request(ANILIST_ENDPOINT, mutation, { animeId }, { Authorization: `Bearer ${token}` });
    return data.ToggleFavourite;
  } catch (error) {
    console.error('Error toggling favourite:', error);
    throw error;
  }
};
