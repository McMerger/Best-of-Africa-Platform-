import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center uppercase tracking-[0.04em] font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-br from-[#C9A84C] to-[#E8C96A] text-navy shadow-[0_4px_24px_rgba(201,168,76,0.3)]",
        ghost: "bg-transparent border border-accent/40 text-accent hover:bg-accent/10",
      },
      size: {
        default: "px-[2.5rem] py-[0.875rem] text-[0.9375rem] rounded",
        small: "px-6 py-2 text-sm rounded",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    },
  }
);

interface GoldButtonProps extends HTMLMotionProps<"button">, VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export const GoldButton = React.forwardRef<HTMLButtonElement, GoldButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        whileHover={{ scale: 1.02, boxShadow: variant === 'primary' ? '0 8px 32px rgba(201,168,76,0.4)' : '0 4px 16px rgba(201,168,76,0.15)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

GoldButton.displayName = "GoldButton";
