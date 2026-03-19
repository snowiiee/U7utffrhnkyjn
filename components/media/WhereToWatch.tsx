import React, { useState } from 'react';

const getSimpleIconSlug = (site: string) => {
  const normalized = site.toLowerCase().replace(/[^a-z0-9]/g, '');
  const map: Record<string, string> = {
    crunchyroll: 'crunchyroll',
    netflix: 'netflix',
    hulu: 'hulu',
    amazonprimevideo: 'amazonprime',
    amazon: 'amazon',
    funimation: 'funimation',
    hidive: 'hidive',
    youtube: 'youtube',
    bilibili: 'bilibili',
    bilibilitv: 'bilibili',
    vrv: 'vrv',
    hbomax: 'hbo',
    disneyplus: 'disneyplus',
    disney: 'disneyplus',
    appletv: 'appletv',
    adultswim: 'adultswim',
    tubitv: 'tubi',
    tubi: 'tubi',
    peacock: 'peacock',
    plutotv: 'plutotv',
    roku: 'roku',
    vudu: 'vudu',
    iqiyi: 'iqiyi',
    retrocrush: 'retrocrush',
    asiancrush: 'asiancrush',
    midnightpulp: 'midnightpulp',
    contv: 'contv',
    yupptv: 'yupptv',
    museasia: 'youtube',
    anioneasia: 'youtube',
    bilibiliglobal: 'bilibili',
    iqiyiglobal: 'iqiyi',
    wetv: 'tencentqq',
    starplus: 'starplus',
    wakanim: 'wakanim',
    animelab: 'animelab',
    animeondemand: 'animeondemand',
    animedigitalnetwork: 'animedigitalnetwork',
    kakanim: 'kakanim',
    kuroba: 'kuroba',
    viz: 'viz',
    mangaplus: 'mangaplus',
    shonenjump: 'shonenjump',
    webtoon: 'webtoon',
    lezhin: 'lezhin',
    tappytoon: 'tappytoon',
    toomics: 'toomics',
    copincomics: 'copincomics',
    tapas: 'tapas',
    manta: 'manta',
    smash: 'smash',
    piccoma: 'piccoma',
    linemanga: 'linemanga',
    kakaopage: 'kakaopage',
    naverwebtoon: 'naver',
    daumwebtoon: 'daum',
    bomtoon: 'bomtoon',
    mrblue: 'mrblue',
    ridibooks: 'ridibooks',
    comico: 'comico',
    bookcube: 'bookcube',
    peanutoon: 'peanutoon',
    mootoon: 'mootoon',
    anytoon: 'anytoon',
    lezhincomics: 'lezhin',
    twitter: 'twitter',
    reddit: 'reddit',
    facebook: 'facebook',
    instagram: 'instagram',
    tiktok: 'tiktok',
    twitch: 'twitch',
    discord: 'discord',
    patreon: 'patreon',
    kofi: 'kofi',
    bilibilicomics: 'bilibili',
    weibo: 'sinaweibo',
  };
  return map[normalized] || null;
};

interface WhereToWatchProps {
  links?: any[];
}

const WatchLink = ({ link }: { link: any }) => {
  const [imgError, setImgError] = useState(false);
  const slug = getSimpleIconSlug(link.site);
  const firstWord = link.site.split(' ')[0];

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col items-center justify-center w-12 h-12 bg-zinc-900/40 backdrop-blur-sm rounded-full outline outline-[0.5px] outline-white/50 hover:outline-rose-500/50 hover:bg-rose-500/5 transition-all duration-500 overflow-hidden shrink-0"
    >
      <div className="absolute inset-0 bg-rose-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-1">
        {slug && !imgError ? (
          <img
            src={`https://cdn.simpleicons.org/${slug}/ffffff`}
            alt={link.site}
            onError={() => setImgError(true)}
            className="w-6 h-6 object-contain group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] transition-all duration-500"
          />
        ) : (
          <span className="text-white font-bold text-[9px] leading-tight group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] transition-all duration-500 truncate px-1 w-full text-center">
            {firstWord}
          </span>
        )}
      </div>
    </a>
  );
};

export function WhereToWatch({ links }: WhereToWatchProps) {
  const streamingLinks = links?.filter((link: any) => link.type === 'STREAMING') || [];

  if (streamingLinks.length === 0) return null;

  return (
    <section className="opacity-0 animate-in">
      <h2 className="font-display text-2xl font-bold text-white mb-6">Where to Watch</h2>
      <div className="flex flex-wrap gap-3">
        {streamingLinks.map((link: any) => (
          <WatchLink key={link.id} link={link} />
        ))}
      </div>
    </section>
  );
}
