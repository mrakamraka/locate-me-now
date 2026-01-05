import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';

export interface Wallet {
  id: string;
  user_id: string;
  wallet_name: string;
  wallet_address: string;
  address_checksum: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletCreationResult {
  wallet: Wallet;
  mnemonic: string;
}

export interface UseWalletReturn {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  loading: boolean;
  createWallet: (name?: string) => Promise<WalletCreationResult | null>;
  importWallet: (mnemonic: string, name?: string) => Promise<Wallet | null>;
  setActiveWallet: (walletId: string) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<boolean>;
  renameWallet: (walletId: string, newName: string) => Promise<boolean>;
  verifyMnemonic: (mnemonic: string) => boolean;
  refreshWallets: () => Promise<void>;
}

// Generate unique wallet address from mnemonic
const deriveWalletFromMnemonic = (mnemonic: string): { address: string; checksum: string } => {
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
  const address = hdNode.address;
  // Create a checksum from address for verification
  const checksum = ethers.keccak256(ethers.toUtf8Bytes(address)).slice(0, 18);
  return { address, checksum };
};

export const useWallet = (): UseWalletReturn => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWallet, setActiveWalletState] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setActiveWalletState(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const walletData = (data || []) as Wallet[];
      setWallets(walletData);

      // Set active wallet (primary first, or first wallet)
      const primary = walletData.find(w => w.is_primary);
      setActiveWalletState(primary || walletData[0] || null);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const createWallet = useCallback(async (name?: string): Promise<WalletCreationResult | null> => {
    if (!user) return null;

    try {
      // Generate 24-word mnemonic (256 bits)
      const mnemonic = bip39.generateMnemonic(256);
      const { address, checksum } = deriveWalletFromMnemonic(mnemonic);

      const isFirst = wallets.length === 0;
      const walletName = name || `Wallet ${wallets.length + 1}`;

      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          wallet_name: walletName,
          wallet_address: address,
          address_checksum: checksum,
          is_primary: isFirst,
        })
        .select()
        .single();

      if (error) throw error;

      const newWallet = data as Wallet;
      await fetchWallets();

      return { wallet: newWallet, mnemonic };
    } catch (error) {
      console.error('Error creating wallet:', error);
      return null;
    }
  }, [user, wallets.length, fetchWallets]);

  const importWallet = useCallback(async (mnemonic: string, name?: string): Promise<Wallet | null> => {
    if (!user) return null;

    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic.trim().toLowerCase())) {
        throw new Error('Invalid seed phrase');
      }

      const normalizedMnemonic = mnemonic.trim().toLowerCase();
      const { address, checksum } = deriveWalletFromMnemonic(normalizedMnemonic);

      // Check if wallet already exists
      const { data: existing } = await supabase
        .from('wallets')
        .select('id')
        .eq('wallet_address', address)
        .maybeSingle();

      if (existing) {
        throw new Error('Wallet already exists');
      }

      const isFirst = wallets.length === 0;
      const walletName = name || `Imported Wallet ${wallets.length + 1}`;

      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          wallet_name: walletName,
          wallet_address: address,
          address_checksum: checksum,
          is_primary: isFirst,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchWallets();
      return data as Wallet;
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw error;
    }
  }, [user, wallets.length, fetchWallets]);

  const setActiveWallet = useCallback(async (walletId: string) => {
    if (!user) return;

    try {
      // Update all wallets to not primary
      await supabase
        .from('wallets')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Set selected wallet as primary
      await supabase
        .from('wallets')
        .update({ is_primary: true })
        .eq('id', walletId);

      await fetchWallets();
    } catch (error) {
      console.error('Error setting active wallet:', error);
    }
  }, [user, fetchWallets]);

  const deleteWallet = useCallback(async (walletId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', walletId);

      if (error) throw error;

      await fetchWallets();
      return true;
    } catch (error) {
      console.error('Error deleting wallet:', error);
      return false;
    }
  }, [user, fetchWallets]);

  const renameWallet = useCallback(async (walletId: string, newName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('wallets')
        .update({ wallet_name: newName })
        .eq('id', walletId);

      if (error) throw error;

      await fetchWallets();
      return true;
    } catch (error) {
      console.error('Error renaming wallet:', error);
      return false;
    }
  }, [user, fetchWallets]);

  const verifyMnemonic = useCallback((mnemonic: string): boolean => {
    return bip39.validateMnemonic(mnemonic.trim().toLowerCase());
  }, []);

  return {
    wallets,
    activeWallet,
    loading,
    createWallet,
    importWallet,
    setActiveWallet,
    deleteWallet,
    renameWallet,
    verifyMnemonic,
    refreshWallets: fetchWallets,
  };
};
