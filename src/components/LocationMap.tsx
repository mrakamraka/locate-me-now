import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationData } from '@/hooks/useLocationTracking';
import { format } from 'date-fns';

// Fix for default marker icons
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Set default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface LocationMapProps {
  currentLocation: LocationData | null;
  locationHistory: LocationData[];
  showPath: boolean;
  centerOnLocation: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({
  currentLocation,
  locationHistory,
  showPath,
  centerOnLocation,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const historyMarkersRef = useRef<L.Marker[]>([]);

  const defaultCenter: [number, number] = [43.8563, 18.4131]; // Sarajevo

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center = currentLocation
      ? [currentLocation.latitude, currentLocation.longitude] as [number, number]
      : defaultCenter;

    mapRef.current = L.map(mapContainerRef.current).setView(center, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    const position: [number, number] = [currentLocation.latitude, currentLocation.longitude];

    // Create custom icon for current location
    const currentIcon = L.divIcon({
      className: 'current-location-icon',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: #0066ff;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (currentMarkerRef.current) {
      currentMarkerRef.current.setLatLng(position);
    } else {
      currentMarkerRef.current = L.marker(position, { icon: currentIcon }).addTo(mapRef.current);
      
      const popupContent = `
        <div style="font-size: 14px;">
          <strong>Trenutna lokacija</strong><br/>
          ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}
          ${currentLocation.accuracy ? `<br/>Preciznost: ${currentLocation.accuracy.toFixed(0)}m` : ''}
          ${currentLocation.speed ? `<br/>Brzina: ${(currentLocation.speed * 3.6).toFixed(1)} km/h` : ''}
        </div>
      `;
      currentMarkerRef.current.bindPopup(popupContent);
    }

    if (centerOnLocation) {
      mapRef.current.setView(position, mapRef.current.getZoom());
    }
  }, [currentLocation, centerOnLocation]);

  // Update path and history markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old path
    if (pathRef.current) {
      pathRef.current.remove();
      pathRef.current = null;
    }

    // Clear old history markers
    historyMarkersRef.current.forEach(marker => marker.remove());
    historyMarkersRef.current = [];

    if (!showPath || locationHistory.length < 2) return;

    // Create path
    const pathCoordinates = [...locationHistory]
      .reverse()
      .map((loc): [number, number] => [loc.latitude, loc.longitude]);

    pathRef.current = L.polyline(pathCoordinates, {
      color: '#0066ff',
      weight: 3,
      opacity: 0.7,
      dashArray: '10, 5',
    }).addTo(mapRef.current);

    // Create history markers (skip first which is current)
    const historyIcon = L.divIcon({
      className: 'history-location-icon',
      html: `
        <div style="
          width: 10px;
          height: 10px;
          background: #666;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        "></div>
      `,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

    locationHistory.slice(1, 30).forEach((location) => {
      const marker = L.marker([location.latitude, location.longitude], { icon: historyIcon })
        .addTo(mapRef.current!);
      
      const time = location.created_at 
        ? format(new Date(location.created_at), 'dd.MM.yyyy HH:mm:ss')
        : 'Unknown';
      
      marker.bindPopup(`
        <div style="font-size: 13px;">
          <strong>${time}</strong><br/>
          ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
        </div>
      `);
      
      historyMarkersRef.current.push(marker);
    });
  }, [locationHistory, showPath]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
};

export default LocationMap;
