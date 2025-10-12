"use client";

import { useContext, createContext } from "react";

export interface BuilderTheme {
  palette: Record<string, string>;
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
  data: { theme: { palette: {} } },
  brief: "",
});

export function useBuilder(): BuilderContextType {
  const ctx = useContext(BuilderContext);

  // Spread first, then override theme safely
  const safeData: BuilderData = {
    ...ctx?.data,
    theme: {
      ...ctx?.data?.theme,
      palette: ctx?.data?.theme?.palette || {},
    },
  };

  return {
    data: safeData,
    brief: ctx?.brief || "",
  };
}
