import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.07] bg-surface p-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn("text-sm font-bold text-text", className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("", className)} {...props} />;
}
