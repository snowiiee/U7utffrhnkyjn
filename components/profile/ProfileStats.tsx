'use client';

import { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  LabelList,
  Cell,
} from 'recharts';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FuzzyDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

interface ListEntry {
  startedAt: FuzzyDate;
  completedAt: FuzzyDate;
  media: {
    id: number;
    title: {
      userPreferred: string;
    };
  };
}

interface ProfileStatsProps {
  statistics: {
    anime: {
      count: number;
      meanScore: number;
      minutesWatched: number;
      episodesWatched: number;
      genres: Array<{ genre: string; count: number }>;
      scores: Array<{ score: number; count: number }>;
      statuses: Array<{ status: string; count: number }>;
      startYears: Array<{ startYear: number; count: number }>;
    };
  };
  listEntries?: ListEntry[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl">
        <p className="text-zinc-400 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-lg">
          {payload[0].value}
          <span className="text-zinc-500 text-xs font-normal ml-1">
            {payload[0].name === 'count' ? 'entries' : ''}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export function ProfileStats({ statistics, listEntries = [] }: ProfileStatsProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const pauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = 4;

  // Auto-play timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPaused) {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // GSAP Animation
  useGSAP(() => {
    // Carousel Animation
    if (carouselRef.current) {
      gsap.to(carouselRef.current, {
        xPercent: -100 * currentSlide,
        duration: 0.6,
        ease: "power3.inOut"
      });
    }

    // Desktop Grid Entrance Animation
    const cards = containerRef.current?.querySelectorAll('.stats-card');
    if (cards && cards.length > 0) {
      gsap.fromTo(cards, 
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, { scope: containerRef, dependencies: [currentSlide] });

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) { // Swipe threshold
      if (diff > 0) {
        // Swipe left -> Next
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      } else {
        // Swipe right -> Prev
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
      }
    }

    // Resume after 1 second
    pauseTimeout.current = setTimeout(() => {
      setIsPaused(false);
    }, 1000);
  };

  if (!statistics?.anime) return null;

  const { genres = [], scores = [], startYears = [] } = statistics.anime || {};

  // Process Genre Data for Radar Chart
  // Take top 6 genres
  const radarData = genres.slice(0, 6).map((g) => ({
    subject: g.genre,
    A: g.count,
    fullMark: Math.max(...genres.map((g) => g.count)),
  }));

  // Process Score Data for Bar Chart
  // Normalize scores to 1-10 range to handle different scoring systems (100-point, 10-point, etc.)
  const scoreMap = new Map();
  scores.forEach((s) => {
    let score = s.score;
    // If score is on 100-point scale (e.g. 85), convert to 1-10 (e.g. 9)
    if (score > 10) {
      score = Math.round(score / 10);
    }
    if (score === 0) return; 
    scoreMap.set(score, (scoreMap.get(score) || 0) + s.count);
  });

  const barData = Array.from({ length: 10 }, (_, i) => i + 1).map((score) => ({
    score: score.toString(),
    count: scoreMap.get(score) || 0,
  }));

  const uniqueCounts = Array.from(new Set(barData.map(d => d.count).filter(c => c > 0))).sort((a, b) => b - a);

  // --- Score Personality Insights ---
  const GLOBAL_MEAN_SCORE = 68;
  const totalRatings = barData.reduce((sum, d) => sum + d.count, 0);
  
  // Most given score (comfort zone)
  const mostGivenScore = barData.reduce((max, d) => d.count > max.count ? d : max, { score: '0', count: 0 });
  
  // Percentage in 7-8 range
  const midRangeCount = barData.filter(d => d.score === '7' || d.score === '8').reduce((sum, d) => sum + d.count, 0);
  const midRangePercent = totalRatings > 0 ? Math.round((midRangeCount / totalRatings) * 100) : 0;
  
  // Scores never given
  const neverGivenScores = barData.filter(d => d.count === 0).map(d => d.score);
  
  // Compare to global average
  const userMeanScore = statistics.anime?.meanScore || 0;
  const isHarshRater = userMeanScore < GLOBAL_MEAN_SCORE;

  // --- Watch Pace Computations ---
  const dateToMs = (d: FuzzyDate) => {
    if (!d.year || !d.month || !d.day) return null;
    return new Date(d.year, d.month - 1, d.day).getTime();
  };

  const completionData = listEntries
    .map(entry => {
      const startMs = dateToMs(entry.startedAt);
      const endMs = dateToMs(entry.completedAt);
      if (!startMs || !endMs || endMs < startMs) return null;
      const days = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
      return {
        title: entry.media.title.userPreferred,
        days,
        completedAt: entry.completedAt,
      };
    })
    .filter((d): d is { title: string; days: number; completedAt: FuzzyDate } => d !== null);

  // Average days to finish
  const avgDays = completionData.length > 0 
    ? Math.round(completionData.reduce((sum, d) => sum + d.days, 0) / completionData.length) 
    : 0;

  // Fastest completion
  const fastestCompletion = completionData.length > 0 
    ? completionData.reduce((min, d) => d.days < min.days ? d : min, completionData[0])
    : null;

  // Day of week distribution
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayDistribution = dayNames.map(day => ({ day, count: 0 }));
  
  listEntries.forEach(entry => {
    const ms = dateToMs(entry.completedAt);
    if (ms) {
      const dayIndex = new Date(ms).getDay();
      dayDistribution[dayIndex].count++;
    }
  });
  
  const mostActiveDay = dayDistribution.reduce((max, d) => d.count > max.count ? d : max, { day: 'N/A', count: 0 });

  // Process Year Data for Area Chart
  // Sort by year ascending
  const areaData = [...startYears]
    .sort((a, b) => a.startYear - b.startYear)
    .filter((y) => y.startYear && y.startYear > 1960)
    .map((y) => ({
      year: y.startYear.toString(),
      count: y.count,
    }));

  // --- Radar Personality Insights ---
  const radarTotal = radarData.reduce((sum, d) => sum + d.A, 0);
  const topGenre = radarData.length > 0 ? radarData.reduce((max, d) => d.A > max.A ? d : max, radarData[0]) : null;
  const dominantPercent = radarTotal > 0 && topGenre ? Math.round((topGenre.A / radarTotal) * 100) : 0;
  const radarMin = radarData.length > 0 ? Math.min(...radarData.map(d => d.A)) : 0;
  const radarMax = radarData.length > 0 ? Math.max(...radarData.map(d => d.A)) : 0;
  const radarSpread = radarMax > 0 ? ((radarMax - radarMin) / radarMax) * 100 : 0;
  const tasteFocus = dominantPercent > 40
    ? `laser focused on ${topGenre?.subject}`
    : radarSpread < 20
      ? 'genre agnostic'
      : `leaning ${topGenre?.subject}`;

  const RadarContent = (
    <>
      <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 w-full text-left">Taste Radar</h3>
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData} style={{ outline: 'none' }}>
            <PolarGrid stroke="#3f3f46" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            <Radar
              name="Genres"
              dataKey="A"
              stroke="#ffffff"
              strokeWidth={2}
              fill="#ffffff"
              fillOpacity={0.2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {radarData.length > 0 && (
        <div className="w-full mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{dominantPercent}%</span>
            <span className="text-zinc-400 text-sm">of your top genres is {topGenre?.subject}</span>
          </div>
          <div className="text-sm text-zinc-400">
            You are <span className="text-white font-semibold">{tasteFocus}</span>
          </div>
        </div>
      )}
    </>
  );

  const ScoreContent = (
    <>
      <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 w-full text-left">Score Distribution</h3>
      <div className="w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
          <BarChart data={barData} style={{ outline: 'none' }} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="score" 
              tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }} 
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: '#27272a', opacity: 0.4 }} 
            />
            <Bar 
              dataKey="count" 
              radius={[6, 6, 6, 6]}
              barSize={32}
              activeBar={{ fill: '#ffffff' }}
            >
              {barData.map((entry, index) => {
                const rank = entry.count > 0 ? uniqueCounts.indexOf(entry.count) : -1;
                const opacity = rank >= 0 ? 1 - (rank * 0.025) : 0.05;
                const fill = `rgba(255, 255, 255, ${opacity})`;
                
                return <Cell key={`cell-${index}`} fill={fill} className="transition-all duration-300" />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Personality Insights */}
      <div className="w-full mt-4 space-y-2">
        {mostGivenScore.count > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-2xl font-bold text-white">{mostGivenScore.score}</span>
            <span className="text-zinc-400">is your comfort zone</span>
          </div>
        )}
        {midRangePercent > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-2xl font-bold text-white">{midRangePercent}%</span>
            <span className="text-zinc-400">of your ratings are 7-8</span>
          </div>
        )}
        {neverGivenScores.length > 0 && neverGivenScores.length <= 3 && (
          <div className="text-sm text-zinc-400">
            You have never given a <span className="text-white font-semibold">{neverGivenScores.join(', ')}</span>
          </div>
        )}
        <div className="text-sm text-zinc-400">
          {isHarshRater 
            ? <span>You <span className="text-white font-semibold">rate harder</span> than most</span>
            : <span>You are <span className="text-white font-semibold">generous</span> with scores</span>
          }
        </div>
      </div>
    </>
  );

  // --- Era Personality Insights ---
  const peakEra = areaData.length > 0 ? areaData.reduce((max, d) => d.count > max.count ? d : max, areaData[0]) : null;
  const uniqueDecades = new Set(areaData.map(d => Math.floor(parseInt(d.year) / 10) * 10)).size;
  const post2020Count = areaData.filter(d => parseInt(d.year) >= 2021).reduce((sum, d) => sum + d.count, 0);
  const eraTotal = areaData.reduce((sum, d) => sum + d.count, 0);
  const recencyPercent = eraTotal > 0 ? Math.round((post2020Count / eraTotal) * 100) : 0;
  const recencyLabel = recencyPercent > 60 ? 'certified modern fan' : recencyPercent < 30 ? 'classics digger' : null;

  const EraContent = (
    <>
      <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 w-full text-left">Era Timeline</h3>
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
          <LineChart data={areaData} margin={{ top: 20, right: 20, left: 20, bottom: 0 }} style={{ outline: 'none' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="year" 
              tick={{ fill: '#71717a', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
              minTickGap={30}
              padding={{ left: 10, right: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#ffffff"
              strokeWidth={3}
              dot={{ r: 6, fill: '#ffffff', strokeWidth: 0 }}
              activeDot={{ r: 8, fill: '#ffffff' }}
            >
              <LabelList dataKey="count" position="top" fill="#ffffff" fontSize={12} offset={10} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      {areaData.length > 0 && (
        <div className="w-full mt-4 space-y-2">
          {peakEra && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{peakEra.year}</span>
              <span className="text-zinc-400 text-sm">was your peak era</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{uniqueDecades}</span>
            <span className="text-zinc-400 text-sm">decade{uniqueDecades !== 1 ? 's' : ''} of anime in your list</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-bold text-white">{recencyPercent}%</span>
            <span className="text-zinc-400 text-sm">
              of your list is post-2020{recencyLabel ? ` — ${recencyLabel}` : ''}
            </span>
          </div>
        </div>
      )}
    </>
  );

  const WatchPaceContent = (
    <>
      <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 w-full text-left">Watch Pace</h3>
      {completionData.length > 0 ? (
        <div className="w-full flex flex-col gap-4">
          {/* Hero Stats */}
          <div className="grid grid-cols-2 gap-4">
            {fastestCompletion && (
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Speedrun Record</div>
                <div className="text-3xl font-bold text-white">{fastestCompletion.days} day{fastestCompletion.days !== 1 ? 's' : ''}</div>
                <div className="text-xs text-zinc-400 mt-1 truncate" title={fastestCompletion.title}>{fastestCompletion.title}</div>
              </div>
            )}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Most Active Day</div>
              <div className="text-3xl font-bold text-white">{mostActiveDay.day}</div>
              <div className="text-xs text-zinc-400 mt-1">{mostActiveDay.count} completions</div>
            </div>
          </div>
          
          {/* Average completion time */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400">Average finish time:</span>
            <span className="text-white font-semibold">{avgDays} days</span>
          </div>

          {/* Day of week chart */}
          <div className="w-full h-[100px]">
            <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
              <BarChart data={dayDistribution} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: '#71717a', fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                <Bar dataKey="count" fill="#ffffff" radius={[4, 4, 4, 4]} barSize={24}>
                  {dayDistribution.map((entry, index) => (
                    <Cell 
                      key={`day-cell-${index}`} 
                      fill={entry.day === mostActiveDay.day ? '#ffffff' : 'rgba(255,255,255,0.3)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-zinc-500 text-sm">Not enough completion data available. Mark your start and end dates on AniList to see insights.</div>
      )}
    </>
  );

  const slides = [RadarContent, ScoreContent, EraContent, WatchPaceContent];

  return (
    <section ref={containerRef} className="py-6 md:py-10 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-6 flex items-end justify-between w-full">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
          Stats for Nerds
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Mobile Carousel (GSAP) */}
        <div 
          className="md:hidden relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="min-h-[350px]">
            <div ref={carouselRef} className="flex w-full">
              {slides.map((slide, index) => (
                <div 
                  key={index} 
                  className="min-w-full px-1"
                >
                  <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px]">
                    {slide}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-zinc-700'}`} 
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Taste Radar */}
          <div className="stats-card bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] opacity-0">
            {RadarContent}
          </div>

          {/* Score Distribution */}
          <div className="stats-card bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] opacity-0">
            {ScoreContent}
          </div>

          {/* Era Timeline */}
          <div className="stats-card bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] opacity-0">
            {EraContent}
          </div>

          {/* Watch Pace */}
          <div className="stats-card bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] opacity-0">
            {WatchPaceContent}
          </div>
        </div>
      </div>
    </section>
  );
}
