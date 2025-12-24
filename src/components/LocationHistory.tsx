import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocationData } from '@/hooks/useLocationTracking';
import { format } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';

interface LocationHistoryProps {
  locations: LocationData[];
}

const LocationHistory: React.FC<LocationHistoryProps> = ({ locations }) => {
  if (locations.length === 0) {
    return (
      <Card className="glass-panel h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historija lokacija
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nema snimljenih lokacija</p>
            <p className="text-sm mt-1">Pokreni praćenje da počneš bilježiti</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Historija lokacija
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {locations.length} zapisa
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-2 pb-4">
            {locations.map((location, index) => (
              <div
                key={location.id || index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${index === 0 ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {location.created_at && (
                      <span>{format(new Date(location.created_at), 'dd.MM.yyyy HH:mm:ss')}</span>
                    )}
                    {location.accuracy && (
                      <span>±{location.accuracy.toFixed(0)}m</span>
                    )}
                    {location.speed && location.speed > 0 && (
                      <span>{(location.speed * 3.6).toFixed(1)} km/h</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LocationHistory;
