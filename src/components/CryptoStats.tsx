import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, TrendingUp, Users, Award, Footprints, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { Profile } from '@/hooks/useWalkCoins';

interface CryptoStatsProps {
  profile: Profile | null;
  loading: boolean;
  sessionSteps?: number;
  isTracking?: boolean;
  stepAccuracy?: 'high' | 'medium' | 'low';
}

const CryptoStats: React.FC<CryptoStatsProps> = ({ profile, loading, sessionSteps = 0, isTracking = false, stepAccuracy = 'low' }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-crypto-card border-crypto-border animate-pulse">
            <CardContent className="p-4">
              <div className="h-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getAccuracyInfo = () => {
    switch (stepAccuracy) {
      case 'high':
        return { icon: SignalHigh, text: 'Precise', color: 'text-green-400' };
      case 'medium':
        return { icon: SignalMedium, text: 'GPS', color: 'text-yellow-400' };
      case 'low':
      default:
        return { icon: SignalLow, text: 'Est.', color: 'text-orange-400' };
    }
  };

  const accuracyInfo = getAccuracyInfo();

  const stats = [
    {
      label: 'WALK Coins',
      value: profile?.total_coins.toLocaleString() || '0',
      icon: Coins,
      color: 'text-crypto-gold',
      bgColor: 'bg-crypto-gold/10',
      borderColor: 'border-crypto-gold/30',
    },
    {
      label: 'Level',
      value: profile?.current_level || 1,
      icon: Award,
      color: 'text-crypto-purple',
      bgColor: 'bg-crypto-purple/10',
      borderColor: 'border-crypto-purple/30',
    },
    {
      label: 'Total km',
      value: Number(profile?.total_distance_km || 0).toFixed(2),
      icon: TrendingUp,
      color: 'text-crypto-green',
      bgColor: 'bg-crypto-green/10',
      borderColor: 'border-crypto-green/30',
    },
    {
      label: 'Steps',
      value: isTracking ? sessionSteps.toLocaleString() : '0',
      subLabel: isTracking ? accuracyInfo.text : undefined,
      subLabelColor: isTracking ? accuracyInfo.color : undefined,
      accuracyIcon: isTracking ? accuracyInfo.icon : undefined,
      icon: Footprints,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      highlight: isTracking,
    },
    {
      label: 'Referrals',
      value: profile?.referral_count || 0,
      icon: Users,
      color: 'text-crypto-blue',
      bgColor: 'bg-crypto-blue/10',
      borderColor: 'border-crypto-blue/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <Card 
          key={stat.label} 
          className={`bg-crypto-card/80 backdrop-blur-xl border ${stat.borderColor} hover:scale-105 transition-transform ${
            stat.highlight ? 'ring-2 ring-orange-500/30 animate-pulse' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.accuracyIcon && (
                <div className="flex items-center gap-1">
                  <stat.accuracyIcon className={`w-3 h-3 ${stat.subLabelColor}`} />
                  <span className={`text-[10px] ${stat.subLabelColor}`}>{stat.subLabel}</span>
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-crypto-muted">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CryptoStats;
