import { useEffect, useState } from 'react';
import type { SortConfig } from '../types/table';

export interface FilterCondition {
  id: string;
  field: string;
  operator: 'eq' | 'contains' | 'gte' | 'lte' | 'between';
  value: string;
  secondaryValue?: string;
}

export interface PlayerView {
  id: string;
  name: string;
  filters: FilterCondition[];
  positionsFilter: string[];
  sortConfig: SortConfig[];
  visibleColumns: string[];
  createdAt: number;
}

const STORAGE_KEY = 'anfpes-player-views';
const LAST_VIEW_KEY = 'anfpes-last-view-state';

export function usePlayerViews() {
  const [savedViews, setSavedViews] = useState<PlayerView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string | null>(null);

  // Cargar vistas guardadas al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const views = JSON.parse(stored) as PlayerView[];
        setSavedViews(views);
      }
    } catch (error) {
      console.error('Error loading saved views:', error);
    }
  }, []);

  // Guardar vistas cuando cambien
  const persistViews = (views: PlayerView[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
      setSavedViews(views);
    } catch (error) {
      console.error('Error saving views:', error);
    }
  };

  // Guardar el último estado usado (sin nombre, para persistencia automática)
  const saveLastViewState = (state: {
    filters: FilterCondition[];
    positionsFilter: string[];
    sortConfig: SortConfig[];
    visibleColumns: string[];
  }) => {
    try {
      localStorage.setItem(LAST_VIEW_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving last view state:', error);
    }
  };

  // Cargar el último estado usado
  const loadLastViewState = (): {
    filters: FilterCondition[];
    positionsFilter: string[];
    sortConfig: SortConfig[];
    visibleColumns: string[];
  } | null => {
    try {
      const stored = localStorage.getItem(LAST_VIEW_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading last view state:', error);
    }
    return null;
  };

  // Guardar una nueva vista
  const saveView = (
    name: string,
    state: {
      filters: FilterCondition[];
      positionsFilter: string[];
      sortConfig: SortConfig[];
      visibleColumns: string[];
    },
  ) => {
    const newView: PlayerView = {
      id: crypto.randomUUID(),
      name,
      ...state,
      createdAt: Date.now(),
    };
    const updatedViews = [...savedViews, newView];
    persistViews(updatedViews);
    setCurrentViewId(newView.id);
    return newView;
  };

  // Eliminar una vista
  const deleteView = (viewId: string) => {
    const updatedViews = savedViews.filter((v) => v.id !== viewId);
    persistViews(updatedViews);
    if (currentViewId === viewId) {
      setCurrentViewId(null);
    }
  };

  // Cargar una vista
  const loadView = (viewId: string) => {
    const view = savedViews.find((v) => v.id === viewId);
    if (view) {
      setCurrentViewId(viewId);
      return view;
    }
    return null;
  };

  // Actualizar una vista existente
  const updateView = (
    viewId: string,
    state: {
      filters: FilterCondition[];
      positionsFilter: string[];
      sortConfig: SortConfig[];
      visibleColumns: string[];
    },
  ) => {
    const updatedViews = savedViews.map((v) =>
      v.id === viewId ? { ...v, ...state } : v,
    );
    persistViews(updatedViews);
  };

  return {
    savedViews,
    currentViewId,
    saveView,
    deleteView,
    loadView,
    updateView,
    saveLastViewState,
    loadLastViewState,
  };
}
