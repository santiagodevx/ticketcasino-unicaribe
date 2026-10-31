import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn('flex gap-1 rounded-lg bg-[#161B27] p-1', className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-[#64748B] transition-colors data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#090B10] data-[state=active]:font-semibold',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn('mt-4', className)} {...props} />;
}

