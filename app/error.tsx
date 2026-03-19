'use client';
import { useEffect, useRef } from 'react';
import { RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

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

    // Floating animation for the 500
    gsap.to('.float-500', {
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
        <div className="float-500 mb-8 relative">
          <h1 className="glitch-text font-display text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 tracking-tighter">
            500
          </h1>
          <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full -z-10"></div>
        </div>
        
        <h2 className="fade-in font-display text-2xl md:text-3xl font-bold text-white mb-4">
          System Malfunction
        </h2>
        <p className="fade-in text-zinc-400 text-lg mb-8 leading-relaxed">
          An unexpected error has occurred in the application matrix. Our servers have logged the anomaly.
        </p>
        
        <div className="fade-in flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button 
            size="lg"
            onClick={() => reset()} 
            className="w-full sm:w-auto"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </Button>
          <Link href="/home" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full">
              <Home className="w-5 h-5" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
