'use client';

import { motion } from 'framer-motion';
import { Loader2, Zap, Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'pulse' | 'dots' | 'bars' | 'success';
  color?: 'brand' | 'muted' | 'success' | 'warning' | 'destructive';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const colorClasses = {
  brand: 'text-brand-500',
  muted: 'text-muted-foreground',
  success: 'text-green-500',
  warning: 'text-orange-500',
  destructive: 'text-red-500'
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  color = 'brand',
  className,
  text
}: LoadingSpinnerProps) {
  const baseClasses = cn(
    sizeClasses[size],
    colorClasses[color],
    className
  );

  if (variant === 'success') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 10
        }}
        className={cn("flex items-center gap-2", className)}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <CheckCircle2 className={cn(sizeClasses[size], "text-green-500")} />
        </motion.div>
        {text && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium text-green-700"
          >
            {text}
          </motion.span>
        )}
      </motion.div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Zap className={baseClasses} />
        </motion.div>
        {text && (
          <span className="text-sm font-medium text-muted-foreground">
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={cn(
                "rounded-full",
                size === 'sm' ? 'h-1 w-1' :
                size === 'md' ? 'h-1.5 w-1.5' :
                size === 'lg' ? 'h-2 w-2' : 'h-3 w-3',
                colorClasses[color].replace('text-', 'bg-')
              )}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        {text && (
          <span className="text-sm font-medium text-muted-foreground">
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-end gap-0.5">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className={cn(
                "rounded-sm",
                size === 'sm' ? 'w-0.5' :
                size === 'md' ? 'w-1' :
                size === 'lg' ? 'w-1.5' : 'w-2',
                colorClasses[color].replace('text-', 'bg-')
              )}
              animate={{
                height: [
                  size === 'sm' ? '4px' :
                  size === 'md' ? '6px' :
                  size === 'lg' ? '8px' : '12px',
                  size === 'sm' ? '12px' :
                  size === 'md' ? '18px' :
                  size === 'lg' ? '24px' : '36px',
                  size === 'sm' ? '4px' :
                  size === 'md' ? '6px' :
                  size === 'lg' ? '8px' : '12px'
                ]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: index * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        {text && (
          <span className="text-sm font-medium text-muted-foreground">
            {text}
          </span>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Loader2 className={baseClasses} />
      </motion.div>
      {text && (
        <span className="text-sm font-medium text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  );
}

// Componente específico para botones
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  variant?: 'default' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingButton({
  isLoading,
  children,
  loadingText,
  variant = 'default',
  size = 'sm',
  className
}: LoadingButtonProps) {
  return (
    <motion.div
      layout
      className={cn("flex items-center gap-2", className)}
    >
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <LoadingSpinner
            size={size}
            variant={variant}
            color="muted"
          />
        </motion.div>
      )}
      <motion.span
        layout
        animate={{ opacity: isLoading ? 0.7 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {isLoading && loadingText ? loadingText : children}
      </motion.span>
    </motion.div>
  );
}