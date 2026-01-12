import { useState, useEffect, useCallback, useRef } from 'react';

export interface StepSettings {
  heightCm: number;
  stepLengthM: number;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

export interface UseStepCounterReturn {
  steps: number;
  isActive: boolean;
  resetSteps: () => void;
  accuracy: 'high' | 'medium' | 'low';
  requestMotionPermission: () => Promise<boolean>;
  settings: StepSettings;
  updateSettings: (settings: StepSettings) => void;
}

// Step detection configuration - optimized for real walking detection
const STEP_THRESHOLD = 0.6; // Lower threshold for better detection
const STEP_COOLDOWN = 280; // Minimum time between steps (ms) - avg walking cadence
const PEAK_DETECTION_WINDOW = 6; // Samples for peak detection
const ACCELEROMETER_CHECK_DELAY = 2000; // Time to wait for accelerometer data

// Default settings
const DEFAULT_HEIGHT_CM = 170;
const DEFAULT_STEP_LENGTH = 0.762; // ~0.76m per step (average adult)

// Storage key for settings persistence
const SETTINGS_STORAGE_KEY = 'walkcoin_step_settings';

// Load settings from localStorage
const loadSettings = (): StepSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.log('Failed to load step settings:', e);
  }
  return {
    heightCm: DEFAULT_HEIGHT_CM,
    stepLengthM: DEFAULT_STEP_LENGTH,
    vibrationEnabled: true,
    soundEnabled: false,
  };
};

// Save settings to localStorage
const saveSettings = (settings: StepSettings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.log('Failed to save step settings:', e);
  }
};

// Audio context for step sound
let audioContextInstance: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (!audioContextInstance) {
    try {
      audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.log('AudioContext not available');
    }
  }
  return audioContextInstance;
};

// Play step sound
const playStepSound = () => {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.08;
    
    // Quick fade out
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.06);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.06);
  } catch (e) {
    console.log('Failed to play step sound:', e);
  }
};

// Trigger vibration
const triggerVibration = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(25); // Short vibration
  }
};

export const useStepCounter = (isTracking: boolean, distanceKm: number): UseStepCounterReturn => {
  const [steps, setSteps] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low'>('low');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [useGpsFallback, setUseGpsFallback] = useState(false);
  const [settings, setSettings] = useState<StepSettings>(loadSettings);
  
  // For accelerometer-based detection
  const lastStepTimeRef = useRef(0);
  const magnitudeHistoryRef = useRef<number[]>([]);
  const accelerometerDataReceivedRef = useRef(false);
  const accelerometerSampleCountRef = useRef(0);
  const lastPeakRef = useRef(0);
  const inStepRef = useRef(false);
  
  // For distance-based fallback
  const lastDistanceRef = useRef(0);
  const initialDistanceRef = useRef<number | null>(null);
  const accumulatedDistanceRef = useRef(0);

  // Settings ref for use in callbacks
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Update settings
  const updateSettings = useCallback((newSettings: StepSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    console.log('Step settings updated:', newSettings);
  }, []);

  // Provide step feedback (vibration/sound)
  const provideStepFeedback = useCallback(() => {
    if (settingsRef.current.vibrationEnabled) {
      triggerVibration();
    }
    if (settingsRef.current.soundEnabled) {
      playStepSound();
    }
  }, []);

  // Request motion permission explicitly
  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof DeviceMotionEvent !== 'undefined') {
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission === 'granted') {
            setPermissionGranted(true);
            return true;
          }
          return false;
        }
        // No permission needed (non-iOS or older iOS)
        setPermissionGranted(true);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Motion permission request failed:', error);
      return false;
    }
  }, []);

  // Accelerometer-based step detection using DeviceMotionEvent
  useEffect(() => {
    if (!isTracking) {
      accelerometerDataReceivedRef.current = false;
      accelerometerSampleCountRef.current = 0;
      setUseGpsFallback(false);
      return;
    }

    let motionHandler: ((event: DeviceMotionEvent) => void) | null = null;
    let fallbackTimeout: NodeJS.Timeout | null = null;

    // Advanced step detection using peak detection algorithm
    const detectStep = (acceleration: { x: number; y: number; z: number }) => {
      const now = Date.now();
      
      // Calculate magnitude of acceleration (subtract gravity ~9.8)
      const rawMagnitude = Math.sqrt(
        acceleration.x ** 2 + 
        acceleration.y ** 2 + 
        acceleration.z ** 2
      );
      
      // Normalize by subtracting average gravity
      const magnitude = Math.abs(rawMagnitude - 9.8);
      
      // Store magnitude history for peak detection
      magnitudeHistoryRef.current.push(magnitude);
      if (magnitudeHistoryRef.current.length > PEAK_DETECTION_WINDOW) {
        magnitudeHistoryRef.current.shift();
      }
      
      // Need enough samples for analysis
      if (magnitudeHistoryRef.current.length < PEAK_DETECTION_WINDOW) return;
      
      const history = magnitudeHistoryRef.current;
      const midIndex = Math.floor(PEAK_DETECTION_WINDOW / 2);
      const midValue = history[midIndex];
      
      // Calculate local average (excluding current value)
      const avgMagnitude = history.reduce((a, b) => a + b, 0) / history.length;
      
      // Detect peak (local maximum above threshold)
      const isPeak = midValue > avgMagnitude + STEP_THRESHOLD &&
                     midValue >= Math.max(...history.slice(0, midIndex)) &&
                     midValue >= Math.max(...history.slice(midIndex + 1));
      
      // State machine for step detection
      if (isPeak && !inStepRef.current && (now - lastStepTimeRef.current) > STEP_COOLDOWN) {
        inStepRef.current = true;
        lastPeakRef.current = midValue;
      }
      
      // Complete step when magnitude drops below peak
      if (inStepRef.current && midValue < lastPeakRef.current * 0.6) {
        inStepRef.current = false;
        lastStepTimeRef.current = now;
        setSteps(prev => prev + 1);
        provideStepFeedback();
        console.log('Step detected via accelerometer');
      }
    };

    const initializeAccelerometer = async () => {
      try {
        // Check if DeviceMotionEvent is available
        if (typeof DeviceMotionEvent !== 'undefined') {
          // Request permission on iOS 13+
          if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            if (!permissionGranted) {
              const permission = await (DeviceMotionEvent as any).requestPermission();
              if (permission !== 'granted') {
                console.log('Motion permission denied, using GPS fallback');
                setAccuracy('medium');
                setUseGpsFallback(true);
                return;
              }
              setPermissionGranted(true);
            }
          }
          
          motionHandler = (event: DeviceMotionEvent) => {
            const accel = event.accelerationIncludingGravity;
            if (!accel) return;
            
            const { x, y, z } = accel;
            if (x !== null && y !== null && z !== null) {
              accelerometerSampleCountRef.current++;
              
              // Check if we're getting valid motion data (not just static gravity)
              const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
              const deviation = Math.abs(magnitude - 9.8);
              
              // If we get samples with some deviation, accelerometer is working
              if (deviation > 0.1 || accelerometerSampleCountRef.current > 10) {
                if (!accelerometerDataReceivedRef.current) {
                  accelerometerDataReceivedRef.current = true;
                  setAccuracy('high');
                  setUseGpsFallback(false);
                  console.log('Accelerometer active - precise step counting enabled');
                }
                detectStep({ x, y, z });
              }
            }
          };
          
          window.addEventListener('devicemotion', motionHandler, { passive: true });
          console.log('Accelerometer step counting initialized');
          
          // Check after delay if we're actually getting meaningful data
          fallbackTimeout = setTimeout(() => {
            if (!accelerometerDataReceivedRef.current || accelerometerSampleCountRef.current < 5) {
              console.log('No accelerometer data detected, switching to GPS fallback');
              setAccuracy('medium');
              setUseGpsFallback(true);
            }
          }, ACCELEROMETER_CHECK_DELAY);
          
        } else {
          console.log('DeviceMotionEvent not available, using GPS fallback');
          setAccuracy('medium');
          setUseGpsFallback(true);
        }
      } catch (error) {
        console.log('Accelerometer initialization failed:', error);
        setAccuracy('medium');
        setUseGpsFallback(true);
      }
    };

    initializeAccelerometer();

    return () => {
      if (motionHandler) {
        window.removeEventListener('devicemotion', motionHandler);
      }
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
      accelerometerDataReceivedRef.current = false;
      accelerometerSampleCountRef.current = 0;
    };
  }, [isTracking, permissionGranted, provideStepFeedback]);

  // Distance-based step estimation as fallback - ALWAYS active when GPS fallback is enabled
  useEffect(() => {
    if (!isTracking) {
      initialDistanceRef.current = null;
      accumulatedDistanceRef.current = 0;
      return;
    }
    
    // Initialize the starting distance when tracking begins
    if (initialDistanceRef.current === null) {
      initialDistanceRef.current = distanceKm;
      lastDistanceRef.current = distanceKm;
      console.log('GPS step fallback initialized at distance:', distanceKm);
      return;
    }
    
    // Only use GPS fallback if accelerometer isn't working
    if (!useGpsFallback) {
      // Keep synced to prevent jumps when switching
      lastDistanceRef.current = distanceKm;
      return;
    }

    // Calculate new distance since last update
    if (distanceKm > lastDistanceRef.current) {
      const newDistanceKm = distanceKm - lastDistanceRef.current;
      const newDistanceM = newDistanceKm * 1000;
      
      // Accumulate distance and count full steps
      accumulatedDistanceRef.current += newDistanceM;
      const stepLength = settings.stepLengthM;
      const fullSteps = Math.floor(accumulatedDistanceRef.current / stepLength);
      
      if (fullSteps > 0) {
        // Remove counted distance from accumulator
        accumulatedDistanceRef.current -= fullSteps * stepLength;
        
        setSteps(prev => {
          const newTotal = prev + fullSteps;
          console.log(`GPS fallback: +${fullSteps} steps (${newDistanceM.toFixed(1)}m, step length: ${stepLength.toFixed(2)}m), total: ${newTotal}`);
          return newTotal;
        });
        
        // Provide feedback for each step (with slight delay for multiple steps)
        for (let i = 0; i < Math.min(fullSteps, 5); i++) {
          setTimeout(() => provideStepFeedback(), i * 100);
        }
        
        setAccuracy('medium');
      }
      
      lastDistanceRef.current = distanceKm;
    }
  }, [isTracking, distanceKm, useGpsFallback, settings.stepLengthM, provideStepFeedback]);

  // Track active state
  useEffect(() => {
    setIsActive(isTracking);
  }, [isTracking]);

  const resetSteps = useCallback(() => {
    setSteps(0);
    lastDistanceRef.current = 0;
    initialDistanceRef.current = null;
    lastStepTimeRef.current = 0;
    magnitudeHistoryRef.current = [];
    inStepRef.current = false;
    lastPeakRef.current = 0;
    accelerometerSampleCountRef.current = 0;
    accelerometerDataReceivedRef.current = false;
    accumulatedDistanceRef.current = 0;
    setUseGpsFallback(false);
  }, []);

  return {
    steps,
    isActive,
    resetSteps,
    accuracy,
    requestMotionPermission,
    settings,
    updateSettings,
  };
};
