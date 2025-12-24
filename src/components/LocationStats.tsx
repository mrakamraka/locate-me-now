import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LocationData } from '@/hooks/useLocationTracking';
import { MapPin, Navigation, Gauge, Mountain, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface LocationStatsProps {
  currentLocation: LocationData | null;
  isTracking: boolean;
}

const LocationStats: React.FC<LocationStatsProps> = ({ currentLocation, isTracking }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="glass-panel">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isTracking ? 'bg-accent/20' : 'bg-muted'}`}>
              <MapPin className={`w-5 h-5 ${isTracking ? 'text-accent' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Latitude</p>
              <p className="font-mono text-sm font-semibold">
                {currentLocation?.latitude.toFixed(6) || '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isTracking ? 'bg-accent/20' : 'bg-muted'}`}>
              <Navigation className={`w-5 h-5 ${isTracking ? 'text-accent' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Longitude</p>
              <p className="font-mono text-sm font-semibold">
                {currentLocation?.longitude.toFixed(6) || '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Gauge className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Brzina</p>
              <p className="font-mono text-sm font-semibold">
                {currentLocation?.speed
                  ? `${(currentLocation.speed * 3.6).toFixed(1)} km/h`
                  : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Zadnje ažuriranje</p>
              <p className="font-mono text-xs font-semibold">
                {currentLocation?.created_at
                  ? format(new Date(currentLocation.created_at), 'HH:mm:ss')
                  : '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationStats;
