import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationData } from '@/hooks/useLocationTracking';
import { format } from 'date-fns';

// Custom marker icon
const createMarkerIcon = (isCurrentLocation: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="${isCurrentLocation ? 'w-6 h-6 bg-primary' : 'w-3 h-3 bg-muted-foreground/50'} rounded-full border-2 border-white shadow-lg ${isCurrentLocation ? 'pulse-active' : ''}"></div>
        ${isCurrentLocation ? '<div class="absolute w-6 h-6 bg-primary/30 rounded-full animate-ping"></div>' : ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface MapCenterUpdaterProps {
  center: [number, number] | null;
  shouldCenter: boolean;
}

const MapCenterUpdater: React.FC<MapCenterUpdaterProps> = ({ center, shouldCenter }) => {
  const map = useMap();
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (center && shouldCenter && !hasCenteredRef.current) {
      map.setView(center, 16, { animate: true });
      hasCenteredRef.current = true;
    } else if (center && shouldCenter) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, shouldCenter, map]);

  return null;
};

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
  const defaultCenter: [number, number] = [43.8563, 18.4131]; // Sarajevo as default
  const center: [number, number] = currentLocation
    ? [currentLocation.latitude, currentLocation.longitude]
    : defaultCenter;

  // Create path coordinates from history (oldest to newest for proper line drawing)
  const pathCoordinates: [number, number][] = [...locationHistory]
    .reverse()
    .map((loc) => [loc.latitude, loc.longitude] as [number, number]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full rounded-lg"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapCenterUpdater center={center} shouldCenter={centerOnLocation} />

      {/* Path line */}
      {showPath && pathCoordinates.length > 1 && (
        <Polyline
          positions={pathCoordinates}
          pathOptions={{
            color: 'hsl(210, 100%, 50%)',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 5',
          }}
        />
      )}

      {/* History markers (smaller) */}
      {showPath &&
        locationHistory.slice(1, 50).map((location, index) => (
          <Marker
            key={location.id || index}
            position={[location.latitude, location.longitude]}
            icon={createMarkerIcon(false)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-foreground">
                  {location.created_at
                    ? format(new Date(location.created_at), 'dd.MM.yyyy HH:mm:ss')
                    : 'Unknown time'}
                </p>
                <p className="text-muted-foreground">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Current location marker */}
      {currentLocation && (
        <Marker
          position={[currentLocation.latitude, currentLocation.longitude]}
          icon={createMarkerIcon(true)}
        >
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-bold text-foreground">Trenutna lokacija</p>
              <p className="text-muted-foreground">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
              {currentLocation.accuracy && (
                <p className="text-muted-foreground">
                  Preciznost: {currentLocation.accuracy.toFixed(0)}m
                </p>
              )}
              {currentLocation.speed && currentLocation.speed > 0 && (
                <p className="text-muted-foreground">
                  Brzina: {(currentLocation.speed * 3.6).toFixed(1)} km/h
                </p>
              )}
              {currentLocation.created_at && (
                <p className="text-muted-foreground">
                  {format(new Date(currentLocation.created_at), 'dd.MM.yyyy HH:mm:ss')}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default LocationMap;
