import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const alertVariants = cva('rounded-lg border-[1.5px] px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'border-border bg-muted',
      info: 'border-primary bg-secondary/60',
      success: 'border-success bg-[#e8f3ea] text-success',
      destructive: 'border-destructive bg-[#fdecea] text-destructive'
    }
  },
  defaultVariants: { variant: 'default' }
});

type AlertProps = ComponentProps<'div'> & VariantProps<typeof alertVariants>;

export function Alert({ className, variant, role, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role={role ?? (variant === 'destructive' ? 'alert' : 'status')}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}
