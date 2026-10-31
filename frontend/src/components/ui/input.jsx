import { cn } from '../../lib/utils';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-lg border border-white/10 bg-[#161B27] px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

