'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface OptimisticState<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
}

export interface OptimisticAction<T> {
  type: 'add' | 'update' | 'delete';
  item: T;
  originalItem?: T;
  tempId?: string;
}

export function useOptimisticUpdates<T extends { id: string }>(
  initialData: T[],
  config?: {
    successMessages?: {
      add?: string;
      update?: string;
      delete?: string;
    };
    errorMessages?: {
      add?: string;
      update?: string;
      delete?: string;
    };
  }
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isLoading: false,
    error: null
  });

  const pendingActions = useRef<Map<string, OptimisticAction<T>>>(new Map());

  const defaultSuccessMessages = {
    add: 'Elemento agregado correctamente',
    update: 'Elemento actualizado correctamente',
    delete: 'Elemento eliminado correctamente'
  };

  const defaultErrorMessages = {
    add: 'Error al agregar elemento',
    update: 'Error al actualizar elemento',
    delete: 'Error al eliminar elemento'
  };

  const successMessages = { ...defaultSuccessMessages, ...config?.successMessages };
  const errorMessages = { ...defaultErrorMessages, ...config?.errorMessages };

  // Generar ID temporal para nuevos elementos
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Agregar elemento optimísticamente
  const optimisticAdd = useCallback(async <P>(
    newItem: Omit<T, 'id'>,
    apiCall: (item: Omit<T, 'id'>) => Promise<P>,
    options?: {
      onSuccess?: (result: P, tempItem: T) => void;
      onError?: (error: any, tempItem: T) => void;
      loadingMessage?: string;
    }
  ) => {
    const tempId = generateTempId();
    const tempItem = { ...newItem, id: tempId } as T;

    // Actualización optimista
    setState(prev => ({
      ...prev,
      data: [...prev.data, tempItem],
      isLoading: true,
      error: null
    }));

    pendingActions.current.set(tempId, {
      type: 'add',
      item: tempItem,
      tempId
    });

    try {
      const result = await apiCall(newItem);

      // Eliminar elemento temporal y agregar el real
      setState(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== tempId),
        isLoading: false
      }));

      pendingActions.current.delete(tempId);

      toast.success(successMessages.add);
      options?.onSuccess?.(result, tempItem);

      return result;
    } catch (error) {
      // Rollback: eliminar elemento temporal
      setState(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== tempId),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));

      pendingActions.current.delete(tempId);

      toast.error(errorMessages.add);
      options?.onError?.(error, tempItem);

      throw error;
    }
  }, [successMessages.add, errorMessages.add]);

  // Actualizar elemento optimísticamente
  const optimisticUpdate = useCallback(async <P>(
    id: string,
    updates: Partial<T>,
    apiCall: (id: string, updates: Partial<T>) => Promise<P>,
    options?: {
      onSuccess?: (result: P, updatedItem: T) => void;
      onError?: (error: any, originalItem: T) => void;
    }
  ) => {
    const originalItem = state.data.find(item => item.id === id);
    if (!originalItem) {
      throw new Error('Item not found');
    }

    const updatedItem = { ...originalItem, ...updates };

    // Actualización optimista
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => item.id === id ? updatedItem : item),
      isLoading: true,
      error: null
    }));

    pendingActions.current.set(id, {
      type: 'update',
      item: updatedItem,
      originalItem
    });

    try {
      const result = await apiCall(id, updates);

      setState(prev => ({
        ...prev,
        isLoading: false
      }));

      pendingActions.current.delete(id);

      toast.success(successMessages.update);
      options?.onSuccess?.(result, updatedItem);

      return result;
    } catch (error) {
      // Rollback: restaurar item original
      setState(prev => ({
        ...prev,
        data: prev.data.map(item => item.id === id ? originalItem : item),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));

      pendingActions.current.delete(id);

      toast.error(errorMessages.update);
      options?.onError?.(error, originalItem);

      throw error;
    }
  }, [state.data, successMessages.update, errorMessages.update]);

  // Eliminar elemento optimísticamente
  const optimisticDelete = useCallback(async <P>(
    id: string,
    apiCall: (id: string) => Promise<P>,
    options?: {
      onSuccess?: (result: P, deletedItem: T) => void;
      onError?: (error: any, deletedItem: T) => void;
    }
  ) => {
    const itemToDelete = state.data.find(item => item.id === id);
    if (!itemToDelete) {
      throw new Error('Item not found');
    }

    // Actualización optimista: eliminar inmediatamente
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== id),
      isLoading: true,
      error: null
    }));

    pendingActions.current.set(id, {
      type: 'delete',
      item: itemToDelete,
      originalItem: itemToDelete
    });

    try {
      const result = await apiCall(id);

      setState(prev => ({
        ...prev,
        isLoading: false
      }));

      pendingActions.current.delete(id);

      toast.success(successMessages.delete);
      options?.onSuccess?.(result, itemToDelete);

      return result;
    } catch (error) {
      // Rollback: restaurar item eliminado
      setState(prev => ({
        ...prev,
        data: [...prev.data, itemToDelete].sort((a, b) => {
          // Intentar mantener el orden original si es posible
          return a.id.localeCompare(b.id);
        }),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));

      pendingActions.current.delete(id);

      toast.error(errorMessages.delete);
      options?.onError?.(error, itemToDelete);

      throw error;
    }
  }, [state.data, successMessages.delete, errorMessages.delete]);

  // Verificar si un elemento está en estado pending
  const isPending = useCallback((id: string) => {
    return pendingActions.current.has(id);
  }, []);

  // Obtener el tipo de acción pending para un elemento
  const getPendingAction = useCallback((id: string) => {
    return pendingActions.current.get(id)?.type;
  }, []);

  // Verificar si es un elemento temporal
  const isTemporary = useCallback((id: string) => {
    return id.startsWith('temp_');
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Refrescar datos desde el servidor
  const refresh = useCallback((newData: T[]) => {
    setState(prev => ({
      ...prev,
      data: newData,
      error: null
    }));
    pendingActions.current.clear();
  }, []);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete,
    isPending,
    getPendingAction,
    isTemporary,
    clearError,
    refresh
  };
}

// Hook específico para componentes de etapa
export function useStageComponentsOptimistic(
  initialComponents: any[],
  projectId: string
) {
  return useOptimisticUpdates(initialComponents, {
    successMessages: {
      add: 'Componente agregado correctamente',
      update: 'Componente actualizado correctamente',
      delete: 'Componente eliminado correctamente'
    },
    errorMessages: {
      add: 'Error al agregar componente',
      update: 'Error al actualizar componente',
      delete: 'Error al eliminar componente'
    }
  });
}