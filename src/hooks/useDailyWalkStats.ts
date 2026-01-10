import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

export interface DailyWalkStats {
  id: string;
  user_id: string;
  date: string;
  total_steps: number;
  total_distance_km: number;
  total_coins: number;
  sessions_count: number;
  created_at: string;
  updated_at: string;
}

export interface UseDailyWalkStatsReturn {
  dailyStats: DailyWalkStats[];
  todayStats: DailyWalkStats | null;
  loading: boolean;
  updateTodayStats: (steps: number, distanceKm: number, coins: number) => Promise<void>;
  fetchMonthStats: (year: number, month: number) => Promise<DailyWalkStats[]>;
}

export const useDailyWalkStats = (): UseDailyWalkStatsReturn => {
  const { user } = useAuth();
  const [dailyStats, setDailyStats] = useState<DailyWalkStats[]>([]);
  const [todayStats, setTodayStats] = useState<DailyWalkStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all daily stats for the user
  const fetchDailyStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_walk_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(90); // Last 90 days

      if (error) throw error;
      
      // Cast the data to our interface
      const stats = (data || []) as unknown as DailyWalkStats[];
      setDailyStats(stats);

      // Find today's stats
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayStat = stats.find(s => s.date === today);
      setTodayStats(todayStat || null);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  // Fetch stats for a specific month
  const fetchMonthStats = useCallback(async (year: number, month: number): Promise<DailyWalkStats[]> => {
    if (!user) return [];

    const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
    const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');

    try {
      const { data, error } = await supabase
        .from('daily_walk_stats')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as DailyWalkStats[];
    } catch (error) {
      console.error('Error fetching month stats:', error);
      return [];
    }
  }, [user]);

  // Update or create today's stats
  const updateTodayStats = useCallback(async (steps: number, distanceKm: number, coins: number) => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      // Try to get existing record for today
      const { data: existing, error: fetchError } = await supabase
        .from('daily_walk_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('daily_walk_stats')
          .update({
            total_steps: (existing as unknown as DailyWalkStats).total_steps + steps,
            total_distance_km: Number((existing as unknown as DailyWalkStats).total_distance_km) + distanceKm,
            total_coins: (existing as unknown as DailyWalkStats).total_coins + coins,
            sessions_count: (existing as unknown as DailyWalkStats).sessions_count + 1,
          })
          .eq('id', (existing as unknown as DailyWalkStats).id);

        if (updateError) throw updateError;
      } else {
        // Create new record for today
        const { error: insertError } = await supabase
          .from('daily_walk_stats')
          .insert({
            user_id: user.id,
            date: today,
            total_steps: steps,
            total_distance_km: distanceKm,
            total_coins: coins,
            sessions_count: 1,
          });

        if (insertError) throw insertError;
      }

      // Refresh stats
      await fetchDailyStats();
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  }, [user, fetchDailyStats]);

  return {
    dailyStats,
    todayStats,
    loading,
    updateTodayStats,
    fetchMonthStats,
  };
};
