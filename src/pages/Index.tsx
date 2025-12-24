import React, { useState } from 'react';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import LocationMap from '@/components/LocationMap';
import LocationStats from '@/components/LocationStats';
import LocationHistory from '@/components/LocationHistory';
import TrackingControls from '@/components/TrackingControls';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, AlertCircle } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const Index: React.FC = () => {
  const {
    currentLocation,
    locationHistory,
    isTracking,
    error,
    startTracking,
    stopTracking,
    clearHistory,
  } = useLocationTracking();

  const [showPath, setShowPath] = useState(true);
  const [centerOnLocation, setCenterOnLocation] = useState(true);

  const handleStartTracking = () => {
    startTracking();
    toast.success('Praćenje lokacije pokrenuto');
  };

  const handleStopTracking = () => {
    stopTracking();
    toast.info('Praćenje lokacije zaustavljeno');
  };

  const handleClearHistory = async () => {
    await clearHistory();
    toast.success('Historija lokacija obrisana');
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Phone Tracker</h1>
              <p className="text-sm text-muted-foreground">Live lokacija i historija</p>
            </div>
            {isTracking && (
              <div className="ml-auto flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </span>
                <span className="text-sm text-accent font-medium">Aktivno praćenje</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Error message */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <TrackingControls
          isTracking={isTracking}
          showPath={showPath}
          centerOnLocation={centerOnLocation}
          onStartTracking={handleStartTracking}
          onStopTracking={handleStopTracking}
          onShowPathChange={setShowPath}
          onCenterOnLocationChange={setCenterOnLocation}
          onClearHistory={handleClearHistory}
          historyCount={locationHistory.length}
        />

        {/* Stats */}
        <LocationStats currentLocation={currentLocation} isTracking={isTracking} />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="glass-panel overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[500px]">
                  <LocationMap
                    currentLocation={currentLocation}
                    locationHistory={locationHistory}
                    showPath={showPath}
                    centerOnLocation={centerOnLocation}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <div className="lg:col-span-1">
            <LocationHistory locations={locationHistory} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
