import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Footprints, Coins, Calendar, TrendingUp, Clock, MapPin } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface WalkSession {
  id: string;
  date: string;
  distance: number;
  coinsEarned: number;
  duration?: number;
}

interface WalkHistoryProps {
  transactions: Array<{
    id: string;
    created_at: string;
    amount: number;
    transaction_type: string;
    description: string | null;
  }>;
}

const WalkHistory: React.FC<WalkHistoryProps> = ({ transactions }) => {
  // Filter and transform walk transactions
  const walkSessions: WalkSession[] = transactions
    .filter(t => t.transaction_type === 'walk_reward')
    .map(t => {
      // Extract distance from description if available
      const distanceMatch = t.description?.match(/(\d+\.?\d*)\s*km/);
      const distance = distanceMatch ? parseFloat(distanceMatch[1]) : t.amount / 100;
      
      return {
        id: t.id,
        date: t.created_at,
        distance,
        coinsEarned: t.amount,
      };
    })
    .slice(0, 20); // Show last 20 sessions

  // Group by date
  const groupedSessions: { [key: string]: WalkSession[] } = {};
  walkSessions.forEach(session => {
    const dateKey = format(new Date(session.date), 'yyyy-MM-dd');
    if (!groupedSessions[dateKey]) {
      groupedSessions[dateKey] = [];
    }
    groupedSessions[dateKey].push(session);
  });

  const formatDateHeader = (dateKey: string) => {
    const date = new Date(dateKey);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d', { locale: enUS });
  };

  const getDailyTotal = (sessions: WalkSession[]) => {
    return {
      distance: sessions.reduce((sum, s) => sum + s.distance, 0),
      coins: sessions.reduce((sum, s) => sum + s.coinsEarned, 0),
    };
  };

  // Calculate stats
  const totalDistance = walkSessions.reduce((sum, s) => sum + s.distance, 0);
  const totalCoins = walkSessions.reduce((sum, s) => sum + s.coinsEarned, 0);
  const avgDistance = walkSessions.length > 0 ? totalDistance / walkSessions.length : 0;

  return (
    <Card className="bg-crypto-card/80 backdrop-blur-xl border-crypto-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-crypto-green/10 border border-crypto-green/30">
              <Footprints className="w-4 h-4 text-crypto-green" />
            </div>
            WALK History
          </CardTitle>
          <div className="flex items-center gap-1 text-crypto-green text-sm">
            <TrendingUp className="w-4 h-4" />
            <span className="font-bold">{totalDistance.toFixed(1)} km</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-crypto-dark/50 border border-crypto-border">
            <MapPin className="w-3.5 h-3.5 text-crypto-blue mx-auto mb-1" />
            <p className="text-white font-bold text-sm">{totalDistance.toFixed(1)}</p>
            <p className="text-crypto-muted text-xs">km total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-crypto-dark/50 border border-crypto-border">
            <Coins className="w-3.5 h-3.5 text-crypto-gold mx-auto mb-1" />
            <p className="text-white font-bold text-sm">{totalCoins.toLocaleString()}</p>
            <p className="text-crypto-muted text-xs">coins</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-crypto-dark/50 border border-crypto-border">
            <TrendingUp className="w-3.5 h-3.5 text-crypto-purple mx-auto mb-1" />
            <p className="text-white font-bold text-sm">{avgDistance.toFixed(2)}</p>
            <p className="text-crypto-muted text-xs">km/session</p>
          </div>
        </div>

        {/* Sessions List */}
        <ScrollArea className="h-[280px] pr-3">
          {Object.keys(groupedSessions).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedSessions).map(([dateKey, sessions]) => {
                const daily = getDailyTotal(sessions);
                return (
                  <div key={dateKey}>
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-crypto-muted" />
                        <span className="text-crypto-muted text-xs font-medium">
                          {formatDateHeader(dateKey)}
                        </span>
                      </div>
                      <span className="text-xs text-crypto-green font-bold">
                        +{daily.distance.toFixed(2)} km
                      </span>
                    </div>

                    {/* Sessions */}
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-crypto-dark/40 border border-crypto-border hover:border-crypto-green/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-crypto-green/10">
                              <Footprints className="w-4 h-4 text-crypto-green" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">
                                {session.distance.toFixed(2)} km
                              </p>
                              <div className="flex items-center gap-1 text-crypto-muted text-xs">
                                <Clock className="w-3 h-3" />
                                {format(new Date(session.date), 'HH:mm', { locale: enUS })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-crypto-gold font-bold text-sm">
                              +{session.coinsEarned}
                            </p>
                            <p className="text-crypto-muted text-xs">WALK</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <Footprints className="w-12 h-12 text-crypto-muted/30 mb-3" />
              <p className="text-crypto-muted text-sm">No walks yet</p>
              <p className="text-crypto-muted/60 text-xs mt-1">
                Start tracking and begin earning!
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WalkHistory;
