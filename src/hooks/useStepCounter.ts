import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseStepCounterReturn {
  steps: number;
  isActive: boolean;
  resetSteps: () => void;
}

// Average step length in meters (adjustable based on walking/running)
const AVERAGE_STEP_LENGTH = 0.762; // ~0.76m per step (average adult)

export const useStepCounter = (isTracking: boolean, distanceKm: number): UseStepCounterReturn => {
  const [steps, setSteps] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const lastDistanceRef = useRef(0);

  // Calculate steps from distance
  useEffect(() => {
    if (isTracking && distanceKm > lastDistanceRef.current) {
      const newDistanceKm = distanceKm - lastDistanceRef.current;
      const newDistanceM = newDistanceKm * 1000;
      const estimatedSteps = Math.round(newDistanceM / AVERAGE_STEP_LENGTH);
      
      if (estimatedSteps > 0) {
        setSteps(prev => prev + estimatedSteps);
      }
      
      lastDistanceRef.current = distanceKm;
    }
  }, [isTracking, distanceKm]);

  // Track active state
  useEffect(() => {
    setIsActive(isTracking);
  }, [isTracking]);

  const resetSteps = useCallback(() => {
    setSteps(0);
    lastDistanceRef.current = 0;
  }, []);

  return {
    steps,
    isActive,
    resetSteps,
  };
};
