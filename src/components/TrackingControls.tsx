import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Square, Trash2, MapPin, Route } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TrackingControlsProps {
  isTracking: boolean;
  showPath: boolean;
  centerOnLocation: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onShowPathChange: (value: boolean) => void;
  onCenterOnLocationChange: (value: boolean) => void;
  onClearHistory: () => void;
  historyCount: number;
}

const TrackingControls: React.FC<TrackingControlsProps> = ({
  isTracking,
  showPath,
  centerOnLocation,
  onStartTracking,
  onStopTracking,
  onShowPathChange,
  onCenterOnLocationChange,
  onClearHistory,
  historyCount,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Main tracking button */}
      <Button
        size="lg"
        onClick={isTracking ? onStopTracking : onStartTracking}
        className={`min-w-[160px] ${
          isTracking
            ? 'bg-destructive hover:bg-destructive/90'
            : 'bg-accent hover:bg-accent/90'
        }`}
      >
        {isTracking ? (
          <>
            <Square className="w-5 h-5 mr-2" />
            Zaustavi praćenje
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            Pokreni praćenje
          </>
        )}
      </Button>

      {/* Toggle switches */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="show-path"
            checked={showPath}
            onCheckedChange={onShowPathChange}
          />
          <Label htmlFor="show-path" className="flex items-center gap-1.5 cursor-pointer">
            <Route className="w-4 h-4" />
            Prikaži putanju
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="center-location"
            checked={centerOnLocation}
            onCheckedChange={onCenterOnLocationChange}
          />
          <Label htmlFor="center-location" className="flex items-center gap-1.5 cursor-pointer">
            <MapPin className="w-4 h-4" />
            Centriraj mapu
          </Label>
        </div>
      </div>

      {/* Clear history */}
      {historyCount > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Trash2 className="w-4 h-4 mr-2" />
              Obriši historiju
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Obriši svu historiju lokacija?</AlertDialogTitle>
              <AlertDialogDescription>
                Ova akcija će trajno obrisati {historyCount} zapisanih lokacija.
                Ovo se ne može poništiti.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Odustani</AlertDialogCancel>
              <AlertDialogAction onClick={onClearHistory} className="bg-destructive hover:bg-destructive/90">
                Obriši
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default TrackingControls;
