import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useLocationTracking = (): UseLocationTrackingReturn => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

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

  const saveLocation = useCallback(async (position: GeolocationPosition) => {
    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      altitude: position.coords.altitude,
      device_id: DEVICE_ID,
    };

    const { error } = await supabase.from('locations').insert(locationData);

    if (error) {
      console.error('Error saving location:', error);
      setError('Failed to save location');
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError(null);
    setIsTracking(true);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveLocation(position);
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

    // Watch position for live tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        saveLocation(position);
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

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
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
        navigator.geolocation.clearWatch(watchIdRef.current);
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
