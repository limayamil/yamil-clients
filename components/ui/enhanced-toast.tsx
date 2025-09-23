'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import { toast, type ExternalToast } from 'sonner';
import { Button } from './button';

interface EnhancedToastProps {
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'loading';
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

export function EnhancedToast({
  title,
  description,
  type,
  action,
  onDismiss
}: EnhancedToastProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1
            }}
          >
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1
            }}
          >
            <AlertCircle className="h-5 w-5 text-red-500" />
          </motion.div>
        );
      case 'info':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1
            }}
          >
            <Info className="h-5 w-5 text-blue-500" />
          </motion.div>
        );
      case 'loading':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Loader2 className="h-5 w-5 text-brand-500" />
          </motion.div>
        );
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'info': return 'border-l-blue-500';
      case 'loading': return 'border-l-brand-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      className={`
        relative flex items-start gap-3 p-4 bg-white rounded-lg shadow-lg border-l-4
        ${getBorderColor()} min-w-[320px] max-w-[500px]
      `}
    >
      {getIcon()}

      <div className="flex-1 space-y-1">
        <motion.h4
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-semibold text-foreground"
        >
          {title}
        </motion.h4>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground"
          >
            {description}
          </motion.p>
        )}

        {action && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2"
          >
            <Button
              size="sm"
              variant="outline"
              onClick={action.onClick}
              className="h-7 text-xs"
            >
              {action.label}
            </Button>
          </motion.div>
        )}
      </div>

      {onDismiss && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Helper functions para uso más fácil
export const enhancedToast = {
  success: (
    title: string,
    options?: {
      description?: string;
      action?: { label: string; onClick: () => void };
      duration?: number;
    }
  ) => {
    return toast.custom(
      (t) => (
        <EnhancedToast
          title={title}
          description={options?.description}
          type="success"
          action={options?.action}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      {
        duration: options?.duration || 4000,
        className: 'toast-enhanced'
      }
    );
  },

  error: (
    title: string,
    options?: {
      description?: string;
      action?: { label: string; onClick: () => void };
      duration?: number;
    }
  ) => {
    return toast.custom(
      (t) => (
        <EnhancedToast
          title={title}
          description={options?.description}
          type="error"
          action={options?.action}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      {
        duration: options?.duration || 6000,
        className: 'toast-enhanced'
      }
    );
  },

  loading: (
    title: string,
    options?: {
      description?: string;
      id?: string | number;
    }
  ) => {
    return toast.custom(
      (t) => (
        <EnhancedToast
          title={title}
          description={options?.description}
          type="loading"
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      {
        duration: Infinity,
        id: options?.id,
        className: 'toast-enhanced'
      }
    );
  },

  info: (
    title: string,
    options?: {
      description?: string;
      action?: { label: string; onClick: () => void };
      duration?: number;
    }
  ) => {
    return toast.custom(
      (t) => (
        <EnhancedToast
          title={title}
          description={options?.description}
          type="info"
          action={options?.action}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      {
        duration: options?.duration || 4000,
        className: 'toast-enhanced'
      }
    );
  },

  // Función especial para operaciones con progreso
  operation: {
    start: (operation: string, id?: string) => {
      return enhancedToast.loading(`${operation}...`, {
        description: 'Por favor espera un momento',
        id
      });
    },

    success: (operation: string, id?: string, action?: { label: string; onClick: () => void }) => {
      if (id) toast.dismiss(id);
      return enhancedToast.success(`${operation} completado`, {
        description: 'La operación se realizó correctamente',
        action
      });
    },

    error: (operation: string, id?: string, retry?: () => void) => {
      if (id) toast.dismiss(id);
      return enhancedToast.error(`Error en ${operation.toLowerCase()}`, {
        description: 'Algo salió mal. Por favor intenta de nuevo.',
        action: retry ? { label: 'Reintentar', onClick: retry } : undefined
      });
    }
  }
};

// Componente para feedback de progreso más detallado
interface ProgressToastProps {
  title: string;
  progress: number; // 0-100
  description?: string;
  onCancel?: () => void;
}

export function ProgressToast({
  title,
  progress,
  description,
  onCancel
}: ProgressToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className="relative flex items-start gap-3 p-4 bg-white rounded-lg shadow-lg border-l-4 border-l-brand-500 min-w-[350px]"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Loader2 className="h-5 w-5 text-brand-500 flex-shrink-0 mt-0.5" />
      </motion.div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-brand-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 hover:bg-gray-100 flex-shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </motion.div>
  );
}