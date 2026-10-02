import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border-[1.5px] text-sm font-bold transition-[transform,box-shadow,background-color] disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground hover:bg-[#42392c]',
        outline: 'border-primary bg-transparent hover:bg-white/60',
        secondary: 'border-primary bg-secondary text-secondary-foreground hover:bg-[#ffd23d]',
        destructive: 'border-destructive bg-destructive text-destructive-foreground hover:bg-[#9c2a19]',
        ghost: 'border-transparent hover:bg-muted',
        link: 'border-transparent px-0 underline underline-offset-4'
      },
      size: {
        default: 'min-h-11 px-5 py-2.5',
        sm: 'min-h-9 px-3.5 py-1.5 text-[13px]',
        lg: 'min-h-12 px-6 py-3 text-base'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
);

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return <Component data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
