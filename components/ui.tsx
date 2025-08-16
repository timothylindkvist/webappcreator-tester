import { clsx } from 'clsx';
import { ComponentProps } from 'react';

export function Button({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold',
        'bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring',
        'transition-all duration-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  );
}
