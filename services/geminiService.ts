import { SimulationState } from "../types";

// This service is deprecated as the AI analysis feature has been removed.
export const analyzeCircuit = async (state: SimulationState) => {
  console.warn("Circuit analysis is no longer supported in this version.");
  return null;
};
