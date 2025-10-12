"use client";

import { useContext, createContext } from "react";

export interface BuilderData {
  theme?: {
    palette?: Record<string, string>;
  };
  [key: string]: any;
}

export interface BuilderContextType {
  data: BuilderData;
  brief: string;
}

const BuilderContext = createContext<BuilderContextType>({
  data: {},
  brief: "",
});

export function useBuilder(): BuilderContextType {
  return useContext(BuilderContext);
}
