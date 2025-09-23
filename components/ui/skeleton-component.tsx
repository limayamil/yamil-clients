'use client';

import { motion } from 'framer-motion';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface SkeletonComponentProps {
  className?: string;
  animate?: boolean;
}

export function SkeletonComponent({ className, animate = true }: SkeletonComponentProps) {
  const MotionDiv = animate ? motion.div : 'div';

  const animationProps = animate ? {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  } : {};

  return (
    <MotionDiv
      {...animationProps}
      className={cn(
        "rounded-xl border border-border/50 bg-gradient-to-br from-white to-gray-50/30 p-4",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Icon skeleton */}
          <Skeleton className="h-6 w-6 rounded-lg" />

          <div className="flex items-center gap-2">
            {/* Title skeleton */}
            <Skeleton className="h-4 w-32" />
            {/* Status badge skeleton */}
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-2 mb-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Comment thread skeleton */}
      <div className="pt-2 border-t border-border/30">
        <Skeleton className="h-3 w-24" />
      </div>
    </MotionDiv>
  );
}

// Skeleton para cuando se están cargando múltiples componentes
interface SkeletonComponentListProps {
  count?: number;
  className?: string;
}

export function SkeletonComponentList({ count = 3, className }: SkeletonComponentListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.1,
            ease: "easeOut"
          }}
        >
          <SkeletonComponent animate={false} />
        </motion.div>
      ))}
    </div>
  );
}

// Skeleton más específico para componentes en estado de creación
export function CreatingComponentSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      className="rounded-xl border border-brand-200/50 bg-gradient-to-br from-brand-50/50 to-white shadow-lg p-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="h-6 w-6 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600"
        />

        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <motion.div
            animate={{
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Skeleton className="h-5 w-16 rounded-full" />
          </motion.div>
        </div>
      </div>

      <div className="space-y-2">
        <motion.div
          animate={{
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Skeleton className="h-3 w-full" />
        </motion.div>
        <motion.div
          animate={{
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: 0.2,
            ease: "easeInOut"
          }}
        >
          <Skeleton className="h-3 w-2/3" />
        </motion.div>
      </div>

      <div className="mt-3 pt-3 border-t border-brand-200/30">
        <div className="flex items-center justify-between">
          <motion.div
            animate={{
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.3,
              ease: "easeInOut"
            }}
          >
            <Skeleton className="h-3 w-20" />
          </motion.div>

          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
                className="h-1 w-1 rounded-full bg-brand-400"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton para componentes que se están eliminando
export function DeletingComponentSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      animate={{
        opacity: [1, 0.5, 0],
        scale: [1, 0.98, 0.95],
        height: [undefined, undefined, 0]
      }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
        times: [0, 0.6, 1]
      }}
      className="rounded-xl border border-red-200/50 bg-gradient-to-br from-red-50/50 to-white shadow p-4 overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          animate={{
            scale: [1, 0.9, 0.8],
            opacity: [1, 0.5, 0]
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut"
          }}
          className="h-6 w-6 rounded-lg bg-gradient-to-r from-red-400 to-red-500"
        />

        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Skeleton className="h-4 w-24" />
          </motion.div>
        </div>
      </div>

      <motion.div
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-2"
      >
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </motion.div>
    </motion.div>
  );
}