// components/navigation/NavigationShell.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, List, User, Compass } from 'lucide-react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';
import { useRef, useLayoutEffect, useState } from 'react';

gsap.registerPlugin(Flip);

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<Flip.FlipState | null>(null);
  const [activeTab, setActiveTab] = useState(pathname);

  const navItems = [
    { icon: Home, label: 'Home', href: '/home' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Compass, label: 'Social', href: '/social' },
    { icon: List, label: 'My List', href: '/list' },
    { icon: User, label: 'Profile', href: '/profile' },
  ];

  // Sync activeTab with pathname
  useLayoutEffect(() => {
    if (activeTab !== pathname) {
      // Capture state before updating
      if (navRef.current) {
        // Capture state of items, pill, and labels
        // We include .nav-item to animate the width changes of the containers
        stateRef.current = Flip.getState(navRef.current.querySelectorAll('.nav-item, .nav-pill, .nav-label'), { 
          props: "width,opacity,transform,padding" 
        });
      }
      
      // Wrap in requestAnimationFrame to avoid synchronous state update warning
      // requestAnimationFrame(() => setActiveTab(pathname));
      setActiveTab(pathname);
    }
  }, [pathname, activeTab]);

  useGSAP(() => {
    if (!navRef.current || !stateRef.current) return;

    // Animate
    Flip.from(stateRef.current, {
      duration: 0.4,
      ease: "power3.out",
      absolute: false, // Keep relative layout flow for smooth width animation
      nested: true,
      prune: true,
      onEnter: elements => gsap.fromTo(elements, { opacity: 0, width: 0 }, { opacity: 1, width: "auto", duration: 0.3 }),
      onLeave: elements => gsap.to(elements, { opacity: 0, width: 0, duration: 0.2 })
    });

    stateRef.current = null;

  }, { scope: navRef, dependencies: [activeTab] });

  const isLandingPage = pathname === '/';

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-white/30">
      {/* Unified Floating Pill Navigation */}
      {!isLandingPage && (
        <nav 
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90vw]"
        >
        <div ref={navRef} className="flex items-center gap-1 p-2 bg-zinc-800/90 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-black/20">
          {navItems.map((item) => {
            const isActive = activeTab === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                data-flip-id={`nav-item-${item.href}`}
                className={`nav-item relative flex items-center justify-center gap-2 rounded-full transition-colors duration-300 ${
                  isActive 
                    ? 'text-zinc-950 px-6 py-3.5 z-10' 
                    : 'text-zinc-400 hover:text-zinc-200 px-4 py-3.5 hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div
                    data-flip-id="active-pill"
                    className="nav-pill absolute inset-0 bg-zinc-100 rounded-full shadow-sm"
                  />
                )}
                <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                
                {isActive && (
                  <span 
                    className="nav-label font-display font-bold text-sm whitespace-nowrap overflow-hidden relative z-10"
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full min-h-screen relative z-0 ${!isLandingPage ? 'pb-24' : ''}`}>
        {children}
      </main>
    </div>
  );
}
