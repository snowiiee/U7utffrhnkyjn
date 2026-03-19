'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.fromTo('.glitch-text', 
      { y: 50, opacity: 0, skewY: 5 },
      { y: 0, opacity: 1, skewY: 0, duration: 0.8, ease: 'back.out(1.7)' }
    );
    
    tl.fromTo('.fade-in',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
      "-=0.4"
    );

    // Floating animation for the 404
    gsap.to('.float-404', {
      y: -15,
      duration: 2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6 relative overflow-hidden">
      {/* Background grid/glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-zinc-800 opacity-20 blur-[100px]"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        <div className="float-404 mb-8 relative">
          <h1 className="glitch-text font-display text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 tracking-tighter">
            404
          </h1>
          <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full -z-10"></div>
        </div>
        
        <h2 className="fade-in font-display text-2xl md:text-3xl font-bold text-white mb-4">
          Lost in the Void
        </h2>
        <p className="fade-in text-zinc-400 text-lg mb-8 leading-relaxed">
          The page or anime you're looking for has vanished into thin air, or perhaps it never existed at all.
        </p>
        
        <div className="fade-in flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/home" className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              <Home className="w-5 h-5" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
