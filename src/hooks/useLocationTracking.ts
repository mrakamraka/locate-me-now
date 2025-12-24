import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Geolocation, Position } from '@capacitor/geolocation';

export interface LocationData {
  id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  created_at?: string;
}

export interface UseLocationTrackingReturn {
  currentLocation: LocationData | null;
  locationHistory: LocationData[];
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
  clearHistory: () => Promise<void>;
}

const DEVICE_ID = 'my-phone';

// Check if running in Capacitor native environment
const isNative = () => {
  return typeof (window as any).Capacitor !== 'undefined';
};

export const useLocationTracking = (): UseLocationTrackingReturn => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<string | number | null>(null);

  // Fetch location history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('device_id', DEVICE_ID)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching location history:', error);
      } else if (data) {
        setLocationHistory(data as LocationData[]);
        if (data.length > 0) {
          setCurrentLocation(data[0] as LocationData);
        }
      }
    };

    fetchHistory();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('locations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
        },
        (payload) => {
          const newLocation = payload.new as LocationData;
          setCurrentLocation(newLocation);
          setLocationHistory((prev) => [newLocation, ...prev].slice(0, 500));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveLocation = useCallback(async (coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
    altitude?: number | null;
  }) => {
    const locationData = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy ?? null,
      speed: coords.speed ?? null,
      heading: coords.heading ?? null,
      altitude: coords.altitude ?? null,
      device_id: DEVICE_ID,
    };

    const { error } = await supabase.from('locations').insert(locationData);

    if (error) {
      console.error('Error saving location:', error);
      setError('Failed to save location');
    }
  }, []);

  const startTrackingNative = useCallback(async () => {
    try {
      // Request permissions first
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        setError('Location permission denied');
        return;
      }

      setError(null);
      setIsTracking(true);

      // Get initial position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      
      await saveLocation(position.coords);

      // Watch position
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
        async (position: Position | null, err) => {
          if (err) {
            console.error('Watch position error:', err);
            setError(err.message);
            return;
          }
          if (position) {
            await saveLocation(position.coords);
          }
        }
      );

      watchIdRef.current = watchId;
    } catch (err: any) {
      console.error('Geolocation error:', err);
      setError(err.message || 'Failed to get location');
      setIsTracking(false);
    }
  }, [saveLocation]);

  const startTrackingWeb = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError(null);
    setIsTracking(true);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveLocation(position.coords);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        saveLocation(position.coords);
      },
      (err) => {
        console.error('Geolocation watch error:', err);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [saveLocation]);

  const startTracking = useCallback(() => {
    if (isNative()) {
      startTrackingNative();
    } else {
      startTrackingWeb();
    }
  }, [startTrackingNative, startTrackingWeb]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      if (isNative()) {
        await Geolocation.clearWatch({ id: watchIdRef.current as string });
      } else {
        navigator.geolocation.clearWatch(watchIdRef.current as number);
      }
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const clearHistory = useCallback(async () => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('device_id', DEVICE_ID);

    if (error) {
      console.error('Error clearing history:', error);
      setError('Failed to clear history');
    } else {
      setLocationHistory([]);
      setCurrentLocation(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        if (isNative()) {
          Geolocation.clearWatch({ id: watchIdRef.current as string });
        } else {
          navigator.geolocation.clearWatch(watchIdRef.current as number);
        }
      }
    };
  }, []);

  return {
    currentLocation,
    locationHistory,
    isTracking,
    error,
    startTracking,
    stopTracking,
    clearHistory,
  };
};
