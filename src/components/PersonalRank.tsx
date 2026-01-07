import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Crown, Target, Flame, Medal, Award, TrendingUp } from 'lucide-react';

interface PersonalRankProps {
  totalDistance: number;
  totalCoins: number;
  currentLevel: number;
}

// Define rank tiers based on total distance walked
const RANK_TIERS = [
  { name: 'Početnik', icon: Star, minKm: 0, maxKm: 5, color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30' },
  { name: 'Šetač', icon: Target, minKm: 5, maxKm: 25, color: 'text-crypto-blue', bgColor: 'bg-crypto-blue/10', borderColor: 'border-crypto-blue/30' },
  { name: 'Trkač', icon: Zap, minKm: 25, maxKm: 100, color: 'text-crypto-green', bgColor: 'bg-crypto-green/10', borderColor: 'border-crypto-green/30' },
  { name: 'Maratonac', icon: Medal, minKm: 100, maxKm: 500, color: 'text-crypto-purple', bgColor: 'bg-crypto-purple/10', borderColor: 'border-crypto-purple/30' },
  { name: 'Ultra', icon: Flame, minKm: 500, maxKm: 1000, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { name: 'Legenda', icon: Crown, minKm: 1000, maxKm: 5000, color: 'text-crypto-gold', bgColor: 'bg-crypto-gold/10', borderColor: 'border-crypto-gold/30' },
  { name: 'Titan', icon: Trophy, minKm: 5000, maxKm: Infinity, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
];

const PersonalRank: React.FC<PersonalRankProps> = ({
  totalDistance,
  totalCoins,
  currentLevel,
}) => {
  // Find current rank
  const currentRank = RANK_TIERS.find(
    tier => totalDistance >= tier.minKm && totalDistance < tier.maxKm
  ) || RANK_TIERS[0];

  // Find next rank
  const currentRankIndex = RANK_TIERS.indexOf(currentRank);
  const nextRank = RANK_TIERS[currentRankIndex + 1];

  // Calculate progress to next rank
  const progressToNext = nextRank
    ? ((totalDistance - currentRank.minKm) / (currentRank.maxKm - currentRank.minKm)) * 100
    : 100;

  const kmToNextRank = nextRank ? currentRank.maxKm - totalDistance : 0;

  const RankIcon = currentRank.icon;
  const NextRankIcon = nextRank?.icon || Trophy;

  // Stats for display
  const stats = [
    { label: 'Ukupno km', value: totalDistance.toFixed(1), icon: TrendingUp },
    { label: 'WALK Coins', value: totalCoins.toLocaleString(), icon: Award },
    { label: 'Level', value: currentLevel.toString(), icon: Star },
  ];

  return (
    <Card className="bg-crypto-card/80 backdrop-blur-xl border-crypto-border overflow-hidden">
      {/* Header with gradient */}
      <div className={`relative ${currentRank.bgColor} p-4 border-b ${currentRank.borderColor}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <CardHeader className="p-0 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${currentRank.bgColor} border ${currentRank.borderColor}`}>
                <RankIcon className={`w-6 h-6 ${currentRank.color}`} />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Personal Rank</CardTitle>
                <p className={`text-sm font-bold ${currentRank.color}`}>{currentRank.name}</p>
              </div>
            </div>
            <div className={`text-right px-3 py-1 rounded-full ${currentRank.bgColor} border ${currentRank.borderColor}`}>
              <span className={`text-xs font-bold ${currentRank.color}`}>
                Tier {currentRankIndex + 1}/{RANK_TIERS.length}
              </span>
            </div>
          </div>
        </CardHeader>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-xl bg-crypto-dark/50 border border-crypto-border"
            >
              <stat.icon className="w-4 h-4 text-crypto-muted mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{stat.value}</p>
              <p className="text-crypto-muted text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Progress to Next Rank */}
        {nextRank && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <RankIcon className={`w-4 h-4 ${currentRank.color}`} />
                <span className="text-crypto-muted">{currentRank.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-crypto-muted">{nextRank.name}</span>
                <NextRankIcon className={`w-4 h-4 ${nextRank.color}`} />
              </div>
            </div>
            <div className="relative">
              <Progress 
                value={progressToNext} 
                className="h-3 bg-crypto-dark/50"
              />
              <div 
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-crypto-purple via-crypto-blue to-crypto-green opacity-80"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
            <p className="text-crypto-muted text-xs text-center">
              Još <span className="text-crypto-gold font-bold">{kmToNextRank.toFixed(1)} km</span> do sljedećeg ranka
            </p>
          </div>
        )}

        {/* Achievement message for max rank */}
        {!nextRank && (
          <div className="text-center p-4 rounded-xl bg-gradient-to-r from-crypto-gold/10 via-crypto-purple/10 to-crypto-gold/10 border border-crypto-gold/30">
            <Crown className="w-8 h-8 text-crypto-gold mx-auto mb-2" />
            <p className="text-crypto-gold font-bold">Maksimalni Rang!</p>
            <p className="text-crypto-muted text-sm">Ti si legenda među šetačima 🏆</p>
          </div>
        )}

        {/* Rank Badges Preview */}
        <div className="pt-2">
          <p className="text-crypto-muted text-xs mb-2 text-center">Svi Rangovi</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {RANK_TIERS.map((tier, index) => {
              const TierIcon = tier.icon;
              const isUnlocked = index <= currentRankIndex;
              return (
                <div
                  key={tier.name}
                  className={`p-2 rounded-lg transition-all ${
                    isUnlocked 
                      ? `${tier.bgColor} border ${tier.borderColor}` 
                      : 'bg-crypto-dark/30 border border-crypto-border opacity-40'
                  }`}
                  title={tier.name}
                >
                  <TierIcon className={`w-4 h-4 ${isUnlocked ? tier.color : 'text-crypto-muted'}`} />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalRank;
