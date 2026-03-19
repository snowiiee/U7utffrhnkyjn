'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface PillProps {
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function PillGroup({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;
        
        let roundedClass = '';
        if (isFirst && isLast) {
          roundedClass = 'rounded-full'; // Should ideally not happen in a group, but fallback
        } else if (isFirst) {
          roundedClass = 'rounded-l-full rounded-r-md';
        } else if (isLast) {
          roundedClass = 'rounded-r-full rounded-l-md';
        } else {
          roundedClass = 'rounded-md';
        }

        // We pass a special prop to let the Pill know it's in a group so it doesn't animate its border-radius
        return React.cloneElement(child as React.ReactElement<any>, { 
          _groupRoundedClass: roundedClass 
        });
      })}
    </div>
  );
}

export function Pill({ isActive, onClick, icon, title, subtitle, className = '', _groupRoundedClass }: PillProps & { _groupRoundedClass?: string }) {
  const pillRef = useRef<HTMLButtonElement>(null);
  const isFirstRender = useRef(true);
  
  const isIconOnly = icon && !title && !subtitle;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!pillRef.current) return;

    const tl = gsap.timeline();

    // The Squish
    tl.to(pillRef.current, {
      scaleX: 1.05,
      scaleY: 0.85,
      duration: 0.1,
      ease: 'power2.out',
    })
    // The Morph
    .to(pillRef.current, {
      borderRadius: _groupRoundedClass ? undefined : (isActive ? 24 : 9999),
      backgroundColor: isActive ? '#e4e4e7' : '#18181b', // zinc-200 vs zinc-900
      color: isActive ? '#18181b' : '#ffffff',
      duration: 0.2,
      ease: 'power2.inOut',
    }, "<")
    // The Release
    .to(pillRef.current, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.4,
      ease: 'back.out(1.7)',
    });

  }, [isActive, _groupRoundedClass]);

  // Determine base classes based on content
  const baseClasses = isIconOnly 
    ? 'flex items-center justify-center aspect-square p-3' 
    : 'flex items-center gap-3 px-4 py-4 w-full text-left';

  return (
    <button
      ref={pillRef}
      onClick={onClick}
      className={`${baseClasses} focus:outline-none will-change-transform ${_groupRoundedClass || ''} ${className}`}
      style={{
        borderRadius: _groupRoundedClass ? undefined : (isActive ? 24 : 9999),
        backgroundColor: isActive ? '#e4e4e7' : '#18181b',
        color: isActive ? '#18181b' : '#ffffff',
        transformOrigin: 'center center',
      }}
    >
      {icon && (
        <div className={`flex-shrink-0 flex items-center justify-center ${isIconOnly ? 'w-6 h-6' : 'w-8 h-8'}`}>
          {icon}
        </div>
      )}
      {!isIconOnly && (
        <div className="flex flex-col overflow-hidden justify-center h-full">
          <span className="font-semibold text-sm truncate leading-tight">{title}</span>
          {subtitle && (
            <span className="text-xs opacity-70 truncate leading-tight mt-0.5">{subtitle}</span>
          )}
        </div>
      )}
    </button>
  );
}
