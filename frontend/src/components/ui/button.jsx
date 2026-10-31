import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-[#F59E0B] text-[#090B10] hover:bg-[#D97706] font-semibold',
        secondary: 'bg-[#161B27] text-[#F1F5F9] hover:bg-[#1E2535] border border-white/10',
        ghost: 'hover:bg-white/5 text-[#94A3B8]',
        destructive: 'bg-[#EF4444] text-white hover:bg-red-600',
        link: 'text-[#F59E0B] hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-3 text-xs',
        lg: 'h-11 px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };

