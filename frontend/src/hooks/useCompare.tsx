'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface CompareItemSummary {
  id: number;
  title: string;
  brand?: string;
  model_name?: string;
  seller_price: number;
  main_image_url: string | null;
}

interface CompareContextValue {
  items: CompareItemSummary[];
  maxItems: number;
  isInCompare: (id: number) => boolean;
  toggleCompare: (item: CompareItemSummary) => { added: boolean; limitReached: boolean };
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
}

const COMPARE_STORAGE_KEY = 'motolens_compare_items';
const MAX_COMPARE_ITEMS = 3;

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItemSummary[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed.slice(0, MAX_COMPARE_ITEMS));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const persist = useCallback((next: CompareItemSummary[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const isInCompare = useCallback(
    (id: number) => items.some((i) => i.id === id),
    [items]
  );

  const toggleCompare = useCallback(
    (item: CompareItemSummary): { added: boolean; limitReached: boolean } => {
      const exists = items.some((i) => i.id === item.id);
      if (exists) {
        persist(items.filter((i) => i.id !== item.id));
        return { added: false, limitReached: false };
      }
      if (items.length >= MAX_COMPARE_ITEMS) {
        return { added: false, limitReached: true };
      }
      persist([...items, item]);
      return { added: true, limitReached: false };
    },
    [items, persist]
  );

  const removeFromCompare = useCallback(
    (id: number) => {
      persist(items.filter((i) => i.id !== id));
    },
    [items, persist]
  );

  const clearCompare = useCallback(() => {
    persist([]);
  }, [persist]);

  return (
    <CompareContext.Provider
      value={{
        items,
        maxItems: MAX_COMPARE_ITEMS,
        isInCompare,
        toggleCompare,
        removeFromCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return ctx;
}
