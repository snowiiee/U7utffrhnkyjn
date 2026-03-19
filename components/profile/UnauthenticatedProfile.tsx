'use client';
import { useRef } from 'react';
import { User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface UnauthenticatedProfileProps {
  token: string | null;
  setToken: (token: string | null) => void;
  handleSaveToken: () => void;
  isLoading: boolean;
  error: string;
}

export function UnauthenticatedProfile({
  token,
  setToken,
  handleSaveToken,
  isLoading,
  error
}: UnauthenticatedProfileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleLogin = () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    
    window.open(
      '/api/auth/anilist',
      'anilist_oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', force3D: true } });

    if (iconRef.current) {
      tl.fromTo(iconRef.current,
        { scale: 0, rotation: -45, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' }
      );
    }
    
    if (contentRef.current) {
      tl.fromTo(contentRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
        "-=0.4"
      );
    }
  }, { scope: containerRef });

  return (
    <div key="logged-out" ref={containerRef} className="min-h-screen bg-zinc-950 p-6 md:p-12 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950" />
      
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <div>
          <div ref={iconRef} className="w-24 h-24 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl ring-1 ring-white/10">
            <User className="w-10 h-10 text-white" />
          </div>
          
          <div ref={contentRef}>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Profile
            </h1>
            
            <p className="font-sans text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12">
              Customize your experience, manage your settings, and showcase your anime journey.
            </p>

            <div className="flex flex-col items-center gap-6">
              <Button 
                onClick={handleLogin}
                className="w-full md:w-auto min-w-[240px] h-14 text-lg"
                variant="primary"
              >
                <ExternalLink className="w-5 h-5" />
                Connect with AniList
              </Button>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 w-full max-w-md">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                Securely authorize AniStream to access your AniList profile and lists. 
                We never see your password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
