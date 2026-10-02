import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold', {
  variants: {
    variant: {
      default: 'border-primary bg-secondary text-secondary-foreground',
      outline: 'border-primary bg-transparent',
      muted: 'border-border bg-muted text-muted-foreground',
      success: 'border-success bg-[#e8f3ea] text-success',
      destructive: 'border-destructive bg-[#fdecea] text-destructive'
    }
  },
  defaultVariants: { variant: 'default' }
});

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
