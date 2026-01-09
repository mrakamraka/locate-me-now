import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseStepCounterReturn {
  steps: number;
  isActive: boolean;
  resetSteps: () => void;
  accuracy: 'high' | 'medium' | 'low';
}

// Step detection configuration
const STEP_THRESHOLD = 1.2; // Acceleration threshold for step detection (in G)
const STEP_COOLDOWN = 250; // Minimum time between steps (ms)
const SAMPLE_RATE = 50; // Sample rate for motion detection (ms)

// Fallback: Average step length in meters for distance-based estimation
const AVERAGE_STEP_LENGTH = 0.762; // ~0.76m per step (average adult)

export const useStepCounter = (isTracking: boolean, distanceKm: number): UseStepCounterReturn => {
  const [steps, setSteps] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low'>('low');
  
  // For accelerometer-based detection
  const lastStepTimeRef = useRef(0);
  const accelerometerDataRef = useRef<number[]>([]);
  const isAccelerometerActiveRef = useRef(false);
  
  // For distance-based fallback
  const lastDistanceRef = useRef(0);
  const accelerometerStepsRef = useRef(0);

  // Accelerometer-based step detection using DeviceMotionEvent
  useEffect(() => {
    if (!isTracking) {
      isAccelerometerActiveRef.current = false;
      return;
    }

    let motionHandler: ((event: DeviceMotionEvent) => void) | null = null;

    const detectStep = (acceleration: { x: number; y: number; z: number }) => {
      const now = Date.now();
      
      // Calculate magnitude of acceleration
      const magnitude = Math.sqrt(
        acceleration.x ** 2 + 
        acceleration.y ** 2 + 
        acceleration.z ** 2
      );
      
      // Normalize by removing gravity (~9.8 m/s²) and convert to G
      const normalizedMagnitude = Math.abs(magnitude - 9.8) / 9.8;
      
      // Keep a sliding window of recent values for smoothing
      accelerometerDataRef.current.push(normalizedMagnitude);
      if (accelerometerDataRef.current.length > 5) {
        accelerometerDataRef.current.shift();
      }
      
      // Calculate average for noise reduction
      const avgMagnitude = accelerometerDataRef.current.reduce((a, b) => a + b, 0) / 
                          accelerometerDataRef.current.length;
      
      // Detect step if threshold exceeded and cooldown passed
      if (avgMagnitude > STEP_THRESHOLD && (now - lastStepTimeRef.current) > STEP_COOLDOWN) {
        lastStepTimeRef.current = now;
        accelerometerStepsRef.current += 1;
        setSteps(prev => prev + 1);
      }
    };

    const initializeAccelerometer = async () => {
      try {
        // Check if DeviceMotionEvent is available
        if (typeof DeviceMotionEvent !== 'undefined') {
          // Request permission on iOS 13+
          if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            const permission = await (DeviceMotionEvent as any).requestPermission();
            if (permission !== 'granted') {
              console.log('Motion permission denied, using distance fallback');
              setAccuracy('low');
              return;
            }
          }
          
          motionHandler = (event: DeviceMotionEvent) => {
            if (!event.accelerationIncludingGravity) return;
            
            const { x, y, z } = event.accelerationIncludingGravity;
            if (x !== null && y !== null && z !== null) {
              isAccelerometerActiveRef.current = true;
              setAccuracy('high');
              detectStep({ x, y, z });
            }
          };
          
          window.addEventListener('devicemotion', motionHandler);
          console.log('Accelerometer step counting initialized');
          
          // Check after a short delay if we're actually getting data
          setTimeout(() => {
            if (!isAccelerometerActiveRef.current) {
              setAccuracy('low');
            }
          }, 1000);
        } else {
          console.log('DeviceMotionEvent not available, using distance fallback');
          setAccuracy('low');
        }
      } catch (error) {
        console.log('Accelerometer initialization failed:', error);
        setAccuracy('low');
      }
    };

    initializeAccelerometer();

    return () => {
      if (motionHandler) {
        window.removeEventListener('devicemotion', motionHandler);
      }
      isAccelerometerActiveRef.current = false;
    };
  }, [isTracking]);

  // Distance-based step estimation as fallback
  useEffect(() => {
    if (!isTracking) return;
    
    // Only use distance fallback if accelerometer isn't working
    if (isAccelerometerActiveRef.current) {
      // Sync distance reference to prevent jumps when switching
      lastDistanceRef.current = distanceKm;
      return;
    }

    if (distanceKm > lastDistanceRef.current) {
      const newDistanceKm = distanceKm - lastDistanceRef.current;
      const newDistanceM = newDistanceKm * 1000;
      const estimatedSteps = Math.round(newDistanceM / AVERAGE_STEP_LENGTH);
      
      if (estimatedSteps > 0) {
        setSteps(prev => prev + estimatedSteps);
        setAccuracy('medium');
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
    lastStepTimeRef.current = 0;
    accelerometerStepsRef.current = 0;
    accelerometerDataRef.current = [];
  }, []);

  return {
    steps,
    isActive,
    resetSteps,
    accuracy,
  };
};
