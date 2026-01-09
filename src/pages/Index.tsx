import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAuth } from '@/hooks/useAuth';
import { useWalkCoins } from '@/hooks/useWalkCoins';
import { useWallet } from '@/hooks/useWallet';
import { useStepCounter } from '@/hooks/useStepCounter';
import LocationMap from '@/components/LocationMap';
import CryptoStats from '@/components/CryptoStats';
import ReferralCard from '@/components/ReferralCard';
import TransactionHistory from '@/components/TransactionHistory';
import TrackingControls from '@/components/TrackingControls';
import Leaderboard from '@/components/Leaderboard';
import PersonalRank from '@/components/PersonalRank';
import WalkHistory from '@/components/WalkHistory';
import WalletCard from '@/components/wallet/WalletCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, AlertCircle, LogOut, Zap, Footprints } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Haversine formula for distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, transactions, loading: coinsLoading, addWalkReward } = useWalkCoins();
  const {
    wallets,
    activeWallet,
    loading: walletLoading,
    createWallet,
    importWallet,
    setActiveWallet,
    deleteWallet,
    removeWallet,
    renameWallet,
    verifyMnemonic,
    deriveAddressFromMnemonic,
    sendCoins,
    validateAddress,
  } = useWallet();
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
  const [sessionDistance, setSessionDistance] = useState(0);
  const lastRewardedDistanceRef = useRef(0);
  const previousLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Step counter hook
  const { steps, resetSteps, accuracy: stepAccuracy } = useStepCounter(isTracking, sessionDistance);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Track distance and reward coins
  useEffect(() => {
    if (currentLocation && previousLocationRef.current && isTracking) {
      const distance = calculateDistance(
        previousLocationRef.current.latitude,
        previousLocationRef.current.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      // Only add if movement is significant (> 10m) to filter GPS noise
      if (distance > 0.01) {
        setSessionDistance(prev => prev + distance);
      }
    }
    
    if (currentLocation) {
      previousLocationRef.current = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };
    }
  }, [currentLocation, isTracking]);

  // Award coins every 0.1 km
  useEffect(() => {
    const kmToReward = Math.floor(sessionDistance * 10) / 10;
    const lastRewarded = lastRewardedDistanceRef.current;
    
    if (kmToReward > lastRewarded && user) {
      const newKm = kmToReward - lastRewarded;
      addWalkReward(newKm);
      lastRewardedDistanceRef.current = kmToReward;
      
      const coinsEarned = Math.floor(newKm * 100 * (1 + (profile?.referral_count || 0)));
      toast.success(`+${coinsEarned} WALK Coins! 🚀`, {
        description: `Walked ${newKm.toFixed(1)} km`,
      });
    }
  }, [sessionDistance, user, addWalkReward, profile?.referral_count]);

  const handleStartTracking = () => {
    startTracking();
    setSessionDistance(0);
    lastRewardedDistanceRef.current = 0;
    previousLocationRef.current = null;
    resetSteps();
    toast.success('Tracking started! Walk and earn! 💰');
  };

  const handleStopTracking = () => {
    stopTracking();
    if (sessionDistance > 0) {
      toast.info(`Session complete: ${sessionDistance.toFixed(2)} km, ${steps.toLocaleString()} steps`);
    }
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setSessionDistance(0);
    lastRewardedDistanceRef.current = 0;
    resetSteps();
    toast.success('History cleared');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-crypto-dark flex items-center justify-center">
        <div className="text-center">
          <Coins className="w-16 h-16 text-crypto-gold animate-pulse mx-auto mb-4" />
          <p className="text-crypto-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-crypto-dark">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-crypto-card/90 backdrop-blur-xl border-b border-crypto-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-crypto-gold to-crypto-gold/60 shadow-lg shadow-crypto-gold/20">
                <Coins className="w-6 h-6 text-crypto-dark" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  WALK<span className="text-crypto-gold">COIN</span>
                </h1>
                <p className="text-sm text-crypto-muted">Level {profile?.current_level || 1}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isTracking && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-crypto-green/10 border border-crypto-green/30">
                    <Zap className="w-4 h-4 text-crypto-green animate-pulse" />
                    <span className="text-sm text-crypto-green font-medium">
                      {sessionDistance.toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-crypto-purple/10 border border-crypto-purple/30">
                    <Footprints className="w-4 h-4 text-crypto-purple animate-pulse" />
                    <span className="text-sm text-crypto-purple font-medium">
                      {steps.toLocaleString()} steps
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-crypto-muted hover:text-white hover:bg-crypto-card"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Error message */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Crypto Stats */}
        <CryptoStats profile={profile} loading={coinsLoading} sessionSteps={steps} isTracking={isTracking} stepAccuracy={stepAccuracy} />

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

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="bg-crypto-card/80 backdrop-blur-xl border-crypto-border overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[400px]">
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

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <WalletCard
              wallets={wallets}
              activeWallet={activeWallet}
              profile={profile}
              loading={walletLoading}
              onCreateWallet={createWallet}
              onImportWallet={importWallet}
              onSetActiveWallet={setActiveWallet}
              onDeleteWallet={deleteWallet}
              onRemoveWallet={removeWallet}
              onRenameWallet={renameWallet}
              verifyMnemonic={verifyMnemonic}
              deriveAddressFromMnemonic={deriveAddressFromMnemonic}
              onSendCoins={sendCoins}
              validateAddress={validateAddress}
            />
            
            {/* Personal Rank */}
            <PersonalRank
              totalDistance={profile?.total_distance_km || 0}
              totalCoins={profile?.total_coins || 0}
              currentLevel={profile?.current_level || 1}
            />

            {/* Walk History */}
            <WalkHistory transactions={transactions} />

            <Leaderboard />
            <ReferralCard profile={profile} />
            <TransactionHistory transactions={transactions} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
