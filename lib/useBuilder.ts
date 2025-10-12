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

  // Ensure full safety on every render
  const safeData: BuilderData = {
    theme: {
      palette: ctx?.data?.theme?.palette || {},
    },
    ...ctx?.data,
  };

  return {
    data: safeData,
    brief: ctx?.brief || "",
  };
}