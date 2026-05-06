import * as React from 'react';
import { cn } from '@wdock/shared/utils';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-slate-800',
  secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-900 hover:bg-slate-200',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
