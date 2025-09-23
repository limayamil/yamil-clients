'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  variant?: 'backdrop' | 'inline' | 'card';
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isVisible,
  message = 'Cargando...',
  variant = 'backdrop',
  className,
  children
}: LoadingOverlayProps) {
  if (variant === 'backdrop') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
              className
            )}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="rounded-xl border bg-card p-6 shadow-lg"
            >
              <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" variant="pulse" />
                <p className="text-sm font-medium text-foreground">{message}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn("relative", className)}>
        {children}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/90 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 10 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="flex flex-col items-center gap-3 rounded-lg bg-card p-4 shadow-sm border"
              >
                <LoadingSpinner size="md" variant="dots" />
                <p className="text-xs font-medium text-muted-foreground">{message}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // inline variant
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex items-center justify-center py-4",
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="flex items-center gap-3"
          >
            <LoadingSpinner size="sm" variant="bars" />
            <span className="text-sm text-muted-foreground">{message}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Componente para states de loading en acciones específicas
interface ActionLoadingProps {
  isLoading: boolean;
  action: 'creating' | 'updating' | 'deleting' | 'saving';
  children: React.ReactNode;
  className?: string;
}

export function ActionLoading({
  isLoading,
  action,
  children,
  className
}: ActionLoadingProps) {
  const messages = {
    creating: 'Creando...',
    updating: 'Actualizando...',
    deleting: 'Eliminando...',
    saving: 'Guardando...'
  };

  const variants = {
    creating: 'pulse' as const,
    updating: 'dots' as const,
    deleting: 'bars' as const,
    saving: 'default' as const
  };

  return (
    <div className={cn("relative", className)}>
      {children}
      <LoadingOverlay
        isVisible={isLoading}
        message={messages[action]}
        variant="card"
      />
    </div>
  );
}

// Hook para manejar loading states de manera consistente
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  const withLoading = async <T extends any>(
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    try {
      setIsLoading(true);
      const result = await asyncFn();
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  };
}

import React from 'react';