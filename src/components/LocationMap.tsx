import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationData } from '@/hooks/useLocationTracking';
import { format } from 'date-fns';

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom current location icon
const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="width: 20px; height: 20px; background: hsl(210, 100%, 50%); border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>
      <div style="position: absolute; width: 20px; height: 20px; background: hsl(210, 100%, 50%); border-radius: 50%; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// Small history marker icon
const historyIcon = L.divIcon({
  className: 'history-location-marker',
  html: `<div style="width: 8px; height: 8px; background: hsl(220, 10%, 50%); border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

interface MapCenterUpdaterProps {
  center: [number, number] | null;
  shouldCenter: boolean;
}

const MapCenterUpdater: React.FC<MapCenterUpdaterProps> = ({ center, shouldCenter }) => {
  const map = useMap();

  useEffect(() => {
    if (center && shouldCenter) {
      map.setView(center, map.getZoom() || 16, { animate: true });
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

      {showPath && pathCoordinates.length > 1 && (
        <Polyline
          positions={pathCoordinates}
          pathOptions={{
            color: '#0066ff',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 5',
          }}
        />
      )}

      {showPath &&
        locationHistory.slice(1, 50).map((location, index) => (
          <Marker
            key={location.id || `history-${index}`}
            position={[location.latitude, location.longitude]}
            icon={historyIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">
                  {location.created_at
                    ? format(new Date(location.created_at), 'dd.MM.yyyy HH:mm:ss')
                    : 'Unknown time'}
                </p>
                <p className="text-gray-500">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

      {currentLocation && (
        <Marker
          position={[currentLocation.latitude, currentLocation.longitude]}
          icon={currentLocationIcon}
        >
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-bold">Trenutna lokacija</p>
              <p className="text-gray-500">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
              {currentLocation.accuracy && (
                <p className="text-gray-500">
                  Preciznost: {currentLocation.accuracy.toFixed(0)}m
                </p>
              )}
              {currentLocation.speed && currentLocation.speed > 0 && (
                <p className="text-gray-500">
                  Brzina: {(currentLocation.speed * 3.6).toFixed(1)} km/h
                </p>
              )}
              {currentLocation.created_at && (
                <p className="text-gray-500">
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
