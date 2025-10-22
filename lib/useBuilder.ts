"use client";

import { useContext, createContext } from "react";

export interface BuilderTheme {
  palette: Record<string, string>;
  brand: Record<string, string>;
  typography?: Record<string, string>;
}

export interface BuilderData {
  theme: BuilderTheme;
  [key: string]: any;
}

export interface BuilderContextType {
  data: BuilderData;
  brief: string;
}

const BuilderContext = createContext<BuilderContextType>({
  data: {
    theme: {
      palette: {},
      brand: {},
      typography: {},
    },
  },
  brief: "",
});

export function useBuilder(): BuilderContextType {
  const ctx = useContext(BuilderContext);

  // Deep normalization for safety
  const safeData: BuilderData = {
    ...ctx?.data,
    theme: {
      palette: ctx?.data?.theme?.palette || {},
      brand: ctx?.data?.theme?.brand || {},
      typography: ctx?.data?.theme?.typography || {},
    },
  };

  return {
    data: safeData,
    brief: ctx?.brief || "",
  };
}
