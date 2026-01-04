import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  email: string | null;
  referral_code: string;
  referred_by: string | null;
  total_coins: number;
  total_distance_km: number;
  current_level: number;
  referral_count: number;
  created_at: string;
  updated_at: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export interface UseWalkCoinsReturn {
  profile: Profile | null;
  transactions: CoinTransaction[];
  loading: boolean;
  addWalkReward: (distanceKm: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const COINS_PER_KM = 100;

export const useWalkCoins = (): UseWalkCoinsReturn => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data as Profile);
    }
    setLoading(false);
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data as CoinTransaction[]);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
    fetchTransactions();
  }, [fetchProfile, fetchTransactions]);

  // Subscribe to realtime updates for profile
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addWalkReward = useCallback(async (distanceKm: number) => {
    if (!user || !profile) return;

    const baseCoins = Math.floor(distanceKm * COINS_PER_KM);
    const referralBonus = profile.referral_count * COINS_PER_KM * distanceKm;
    const totalCoins = Math.floor(baseCoins + referralBonus);
    
    const newTotalDistance = Number(profile.total_distance_km) + distanceKm;
    const newLevel = Math.floor(newTotalDistance) + 1;
    const levelUp = newLevel > profile.current_level;

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        total_coins: profile.total_coins + totalCoins + (levelUp ? 500 : 0),
        total_distance_km: newTotalDistance,
        current_level: newLevel,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }

    // Record walk transaction
    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: baseCoins,
      transaction_type: 'walk',
      description: `Hodanje: ${distanceKm.toFixed(2)} km`,
    });

    // Record referral bonus if applicable
    if (referralBonus > 0) {
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: Math.floor(referralBonus),
        transaction_type: 'referral_bonus',
        description: `Referral bonus (${profile.referral_count} referala)`,
      });
    }

    // Record level up bonus
    if (levelUp) {
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: 500,
        transaction_type: 'level_up',
        description: `Level Up! Dostigao si level ${newLevel}`,
      });
    }

    await fetchTransactions();
  }, [user, profile, fetchTransactions]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
    await fetchTransactions();
  }, [fetchProfile, fetchTransactions]);

  return {
    profile,
    transactions,
    loading,
    addWalkReward,
    refreshProfile,
  };
};
