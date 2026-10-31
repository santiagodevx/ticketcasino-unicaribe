import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-[#F59E0B]/10 text-[#F59E0B]',
        success: 'bg-emerald-500/10 text-emerald-400',
        danger: 'bg-red-500/10 text-red-400',
        warning: 'bg-amber-500/10 text-amber-400',
        secondary: 'bg-white/5 text-[#94A3B8]',
        indigo: 'bg-indigo-500/10 text-indigo-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

