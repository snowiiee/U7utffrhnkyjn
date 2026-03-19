'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 0);
      document.body.style.overflow = 'hidden';
      return () => clearTimeout(timer);
    } else {
      // Don't hide immediately, wait for animation
      // document.body.style.overflow = 'unset'; // Moved to onComplete
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useGSAP(() => {
    if (!overlayRef.current || !sheetRef.current) return;

    if (isOpen) {
      // Animate In
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(sheetRef.current, { y: 0, duration: 0.4, ease: 'spring(1, 0.8, 10, 0)' }); // Spring-like feel
    } else if (!isOpen && isVisible) {
      // Animate Out
      const tl = gsap.timeline({
        onComplete: () => {
          setIsVisible(false);
          document.body.style.overflow = 'unset';
        }
      });
      
      tl.to(sheetRef.current, { y: '100%', duration: 0.3, ease: 'power3.in' })
        .to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.15");
    }
  }, { scope: containerRef, dependencies: [isOpen, isVisible] });

  if (!mounted || !isVisible) return null;

  return createPortal(
    <div ref={containerRef} className="relative z-[100]">
      <div
        ref={overlayRef}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm opacity-0"
      />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[101] bg-zinc-900 border-t border-white/10 rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col translate-y-full"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-display font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
