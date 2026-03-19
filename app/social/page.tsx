// app/social/page.tsx
'use client';
import { useRef } from 'react';
import { Compass } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function SocialPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    tl.fromTo(iconRef.current,
      { scale: 0, rotation: -45, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' }
    )
    .fromTo(contentRef.current?.children || [],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
      "-=0.4"
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen bg-zinc-950 p-6 md:p-12 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950" />
      
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <div>
          <div ref={iconRef} className="w-24 h-24 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl ring-1 ring-white/10 opacity-0">
            <Compass className="w-10 h-10 text-white" />
          </div>
          
          <div ref={contentRef}>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight opacity-0">
              Social Feed
            </h1>
            
            <p className="font-sans text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12 opacity-0">
              Follow friends, share updates, and discover what&apos;s trending in your circle.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-300 text-sm font-medium opacity-0">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Coming Soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
