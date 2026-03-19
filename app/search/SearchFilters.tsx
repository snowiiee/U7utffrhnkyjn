'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { FILTER_OPTIONS } from './constants';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface SearchFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
}

export function SearchFilters({ filters, setFilters }: SearchFiltersProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setActiveFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useGSAP(() => {
    if (activeFilter && filterRef.current) {
      gsap.fromTo('.filter-dropdown',
        { opacity: 0, y: 8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, { scope: filterRef, dependencies: [activeFilter] });

  const handleSelect = (key: string, value: string) => {
    // For single-select filters (Type, Status, Season, Year)
    if (key !== 'Genre') {
      setFilters({ ...filters, [key.toLowerCase()]: value });
      setActiveFilter(null);
      return;
    }

    // For multi-select filters (Genre only)
    const currentValues = filters[key.toLowerCase()] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];

    if (newValues.length === 0) {
      const newFilters = { ...filters };
      delete newFilters[key.toLowerCase()];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key.toLowerCase()]: newValues });
    }
  };

  const clearFilter = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    const newFilters = { ...filters };
    delete newFilters[key.toLowerCase()];
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-wrap gap-3 pt-3" ref={filterRef}>
      {Object.entries(FILTER_OPTIONS).map(([key, options]) => {
        const value = filters[key.toLowerCase()];
        const isMultiSelect = key === 'Genre';
        const isActive = isMultiSelect ? (value && value.length > 0) : !!value;
        
        let label = key;
        if (isActive) {
          if (isMultiSelect) {
            label = `${key} (${value.length})`;
          } else {
            label = typeof options[0] === 'object' 
              ? (options as any[]).find((o) => o.value === value)?.label 
              : value;
          }
        }

        return (
          <div key={key} className="relative">
            <button
              onClick={() => setActiveFilter(activeFilter === key ? null : key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                  : 'bg-zinc-800/50 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {label}
              {isActive ? (
                <div onClick={(e) => clearFilter(e, key)} className="hover:bg-zinc-300 rounded-full p-0.5 transition-colors">
                  <X className="w-3 h-3" />
                </div>
              ) : (
                <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${activeFilter === key ? 'rotate-180' : ''}`} />
              )}
            </button>

            {activeFilter === key && (
              <div
                className="filter-dropdown absolute top-full left-0 mt-2 min-w-[160px] max-h-[300px] overflow-y-auto bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-50 p-1 origin-top-left"
              >
                {options.map((option: any) => {
                  const optionValue = typeof option === 'object' ? option.value : option;
                  const optionLabel = typeof option === 'object' ? option.label : option;
                  
                  let isSelected = false;
                  if (isMultiSelect) {
                    isSelected = value?.includes(optionValue);
                  } else {
                    isSelected = value === optionValue;
                  }

                  return (
                    <button
                      key={optionValue}
                      onClick={() => handleSelect(key, optionValue)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-white/10 text-white'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                      }`}
                    >
                      <span>{optionLabel}</span>
                      {isSelected && isMultiSelect && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
