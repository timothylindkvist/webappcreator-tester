'use client';

import { createContext, useContext, useRef, useState, type PropsWithChildren } from 'react';
import { useBuilder } from './builder-context';

type EditModeCtx = {
  isEditMode: boolean;
  toggleEditMode: () => void;
  overrides: Record<string, string>;
  setOverride: (path: string, value: string) => void;
  hasChanges: boolean;
  saveChanges: () => void;
  reapplyOverrides: () => void;
};

const EditModeContext = createContext<EditModeCtx | null>(null);

function setNestedValue(obj: Record<string, unknown>, parts: string[], value: string): void {
  let target: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(Number(parts[i])) ? parts[i] : Number(parts[i]);
    const nextIsIndex = !isNaN(Number(parts[i + 1]));
    if (target[key] == null || typeof target[key] !== 'object') {
      target[key] = nextIsIndex ? [] : {};
    }
    target = target[key];
  }
  const last = parts[parts.length - 1];
  const lastKey: string | number = isNaN(Number(last)) ? last : Number(last);
  target[lastKey] = value;
}

export function EditModeProvider({ children }: PropsWithChildren) {
  const { applyOverrides } = useBuilder();
  const [isEditMode, setIsEditMode] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const overridesRef = useRef<Record<string, string>>({});

  const toggleEditMode = () => setIsEditMode((v) => !v);

  const setOverride = (path: string, value: string) => {
    overridesRef.current = { ...overridesRef.current, [path]: value };
    setOverrides({ ...overridesRef.current });
  };

  const hasChanges = Object.keys(overrides).length > 0;

  const reapplyOverrides = () => {
    if (Object.keys(overridesRef.current).length === 0) return;
    applyOverrides(overridesRef.current);
  };

  const saveChanges = () => {
    reapplyOverrides();
    // TODO: Replace localStorage with Supabase save when auth is added
    try { localStorage.setItem('sidesmith:overrides', JSON.stringify(overridesRef.current)); } catch {}
    overridesRef.current = {};
    setOverrides({});
  };

  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode, overrides, setOverride, hasChanges, saveChanges, reapplyOverrides }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) throw new Error('useEditMode must be used within EditModeProvider');
  return ctx;
}
