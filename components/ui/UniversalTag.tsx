import { cn } from '@/lib/utils';

interface UniversalTagProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function UniversalTag({ label, children, className }: UniversalTagProps) {
  return (
    <div className={cn("inline-flex items-center px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-sm text-zinc-300", className)}>
      {label && <span className="opacity-70 mr-2 uppercase text-xs font-bold tracking-wider">{label}</span>}
      <span className="font-medium text-white">{children}</span>
    </div>
  );
}
