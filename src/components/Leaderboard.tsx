import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Coins, TrendingUp, Crown, Medal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardUser {
  id: string;
  email: string | null;
  total_coins: number;
  total_distance_km: number;
  current_level: number;
}

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'coins' | 'distance'>('coins');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, total_coins, total_distance_km, current_level')
        .order(sortBy === 'coins' ? 'total_coins' : 'total_distance_km', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching leaderboard:', error);
      } else {
        setUsers(data as LeaderboardUser[]);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [sortBy]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-crypto-muted font-mono">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-transparent border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/30';
      default:
        return 'border-crypto-border';
    }
  };

  const maskEmail = (email: string | null) => {
    if (!email) return 'Anonymous';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  };

  const currentUserRank = users.findIndex(u => u.id === user?.id) + 1;

  return (
    <Card className="bg-crypto-card/80 backdrop-blur-xl border-crypto-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-crypto-gold" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="coins" onValueChange={(v) => setSortBy(v as 'coins' | 'distance')}>
          <TabsList className="w-full bg-crypto-dark border border-crypto-border mb-4">
            <TabsTrigger 
              value="coins" 
              className="flex-1 data-[state=active]:bg-crypto-gold/20 data-[state=active]:text-crypto-gold"
            >
              <Coins className="w-4 h-4 mr-2" />
              WALK Coins
            </TabsTrigger>
            <TabsTrigger 
              value="distance"
              className="flex-1 data-[state=active]:bg-crypto-green/20 data-[state=active]:text-crypto-green"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Kilometri
            </TabsTrigger>
          </TabsList>

          {/* Current user position */}
          {currentUserRank > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-crypto-purple/10 border border-crypto-purple/30">
              <p className="text-sm text-crypto-purple">
                🎯 Tvoja pozicija: <span className="font-bold">#{currentUserRank}</span>
              </p>
            </div>
          )}

          <ScrollArea className="h-[350px]">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-crypto-dark/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <TabsContent value="coins" className="mt-0 space-y-2">
                {users.map((u, index) => (
                  <div
                    key={u.id}
                    className={`p-3 rounded-lg border transition-all hover:scale-[1.02] ${getRankStyle(index + 1)} ${
                      u.id === user?.id ? 'ring-2 ring-crypto-purple/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 text-center">
                          {getRankIcon(index + 1)}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${u.id === user?.id ? 'text-crypto-purple' : 'text-white'}`}>
                            {u.id === user?.id ? 'Ti' : maskEmail(u.email)}
                          </p>
                          <p className="text-xs text-crypto-muted">Level {u.current_level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-crypto-gold">
                          {u.total_coins.toLocaleString()}
                        </p>
                        <p className="text-xs text-crypto-muted">WALK</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            )}

            <TabsContent value="distance" className="mt-0 space-y-2">
              {users.map((u, index) => (
                <div
                  key={u.id}
                  className={`p-3 rounded-lg border transition-all hover:scale-[1.02] ${getRankStyle(index + 1)} ${
                    u.id === user?.id ? 'ring-2 ring-crypto-purple/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center">
                        {getRankIcon(index + 1)}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${u.id === user?.id ? 'text-crypto-purple' : 'text-white'}`}>
                          {u.id === user?.id ? 'Ti' : maskEmail(u.email)}
                        </p>
                        <p className="text-xs text-crypto-muted">Level {u.current_level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-crypto-green">
                        {Number(u.total_distance_km).toFixed(2)}
                      </p>
                      <p className="text-xs text-crypto-muted">km</p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
