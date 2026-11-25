import { cn } from "../../lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-text placeholder:text-[#475569] focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
