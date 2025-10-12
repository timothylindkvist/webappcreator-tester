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

const defaultContext: BuilderContextType = {
  data: {
    theme: { palette: {} },
  },
  brief: "",
};

const BuilderContext = createContext<BuilderContextType>(defaultContext);

export function useBuilder(): BuilderContextType {
  const ctx = useContext(BuilderContext);
  return ctx || defaultContext;
}
