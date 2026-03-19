'use client';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { UniversalTag } from '@/components/ui/UniversalTag';

interface CharacterModalProps {
  character: any;
  bannerImage?: string;
  onClose: () => void;
}

export function CharacterModal({ character, bannerImage, onClose }: CharacterModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!overlayRef.current || !modalRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(overlayRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.3 }
    )
    .fromTo(modalRef.current,
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4 },
      "-=0.2"
    );

    if (contentRef.current) {
      tl.fromTo(contentRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.3 },
        "-=0.2"
      );
    }
  }, { scope: overlayRef });

  const handleClose = () => {
    if (!overlayRef.current || !modalRef.current) return;

    const tl = gsap.timeline({ 
      defaults: { ease: 'power3.in' },
      onComplete: onClose 
    });

    tl.to(modalRef.current, { opacity: 0, scale: 0.95, y: 20, duration: 0.3 })
      .to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.1");
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!character) return null;

  const node = character.node;
  const dob = node.dateOfBirth;
  const birthDate = dob?.year || dob?.month || dob?.day 
    ? [dob.day, dob.month, dob.year].filter(Boolean).join('/') 
    : null;

  // Process description to handle AniList specific markdown
  const processedDescription = node.description
    ? node.description
        .replace(/__/g, '**') // Convert __Bold__ to **Bold**
        .replace(/~!/g, '<details><summary>Spoiler</summary>') // Convert spoiler start
        .replace(/!~/g, '</details>') // Convert spoiler end
    : '';

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Banner Background */}
          <div className="relative h-32 md:h-48 w-full bg-zinc-800">
            <Image
              src={bannerImage || 'https://picsum.photos/seed/anime-banner/1920/1080'}
              alt="Banner"
              fill
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          </div>

          <div className="px-6 md:px-8 pb-8 flex flex-col relative">
          {/* Character Image - Positioned overlapping banner */}
          <div className="-mt-16 mb-4 relative z-10">
            <div className="w-32 h-48 relative rounded-lg overflow-hidden shadow-xl ring-4 ring-zinc-900 bg-zinc-800">
              <Image
                src={node.image?.large || 'https://picsum.photos/seed/character/400/600'}
                alt={node.name?.userPreferred || 'Character'}
                fill
                className="object-cover"
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-6">
            <div>
              <h2 className="font-display text-3xl font-bold text-white mb-1">
                {node.name?.userPreferred}
              </h2>
              {node.name?.native && (
                <p className="font-sans text-xl text-zinc-400 italic">
                  {node.name?.native}
                </p>
              )}
            </div>
            
            <div ref={contentRef} className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <UniversalTag label="Role">{character.role}</UniversalTag>
                {node.gender && <UniversalTag label="Gender">{node.gender}</UniversalTag>}
                {node.age && <UniversalTag label="Age">{node.age}</UniversalTag>}
                {birthDate && <UniversalTag label="Birthday">{birthDate}</UniversalTag>}
              </div>

              {processedDescription && (
                <div className="prose prose-invert prose-sm max-w-none text-zinc-400 leading-relaxed custom-scrollbar">
                  <ReactMarkdown 
                    rehypePlugins={[rehypeRaw, rehypeSanitize]} 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => <a {...props} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" />,
                      strong: ({node, ...props}) => <strong {...props} className="text-white font-bold" />
                    }}
                  >
                    {processedDescription}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
