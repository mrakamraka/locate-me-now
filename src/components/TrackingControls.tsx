import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Square, Trash2, MapPin, Route, Zap } from 'lucide-react';
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
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-crypto-card/80 backdrop-blur-xl border border-crypto-border">
      {/* Main tracking button */}
      <Button
        size="lg"
        onClick={isTracking ? onStopTracking : onStartTracking}
        className={`min-w-[180px] font-bold ${
          isTracking
            ? 'bg-red-500/80 hover:bg-red-500/70 text-white'
            : 'bg-gradient-to-r from-crypto-green to-crypto-green/80 hover:from-crypto-green/90 hover:to-crypto-green/70 text-crypto-dark'
        }`}
      >
        {isTracking ? (
          <>
            <Square className="w-5 h-5 mr-2" />
            Stop Earning
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            Start Earning
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
            className="data-[state=checked]:bg-crypto-purple"
          />
          <Label htmlFor="show-path" className="flex items-center gap-1.5 cursor-pointer text-crypto-muted hover:text-white transition-colors">
            <Route className="w-4 h-4" />
            Path
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="center-location"
            checked={centerOnLocation}
            onCheckedChange={onCenterOnLocationChange}
            className="data-[state=checked]:bg-crypto-purple"
          />
          <Label htmlFor="center-location" className="flex items-center gap-1.5 cursor-pointer text-crypto-muted hover:text-white transition-colors">
            <MapPin className="w-4 h-4" />
            Center
          </Label>
        </div>
      </div>

      {/* Clear history */}
      {historyCount > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto border-crypto-border text-crypto-muted hover:text-white hover:bg-crypto-card hover:border-red-500/50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear ({historyCount})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-crypto-card border-crypto-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Clear location history?</AlertDialogTitle>
              <AlertDialogDescription className="text-crypto-muted">
                This action will permanently delete {historyCount} recorded locations.
                Your WALK Coins remain safe!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-crypto-dark border-crypto-border text-crypto-muted hover:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={onClearHistory} 
                className="bg-red-500/80 hover:bg-red-500/70 text-white"
              >
                Clear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default TrackingControls;
