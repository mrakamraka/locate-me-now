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

export interface WalletTransfer {
  id: string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  from_address: string;
  to_address: string;
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  tx_hash: string;
  note: string | null;
  created_at: string;
}

export interface WalletCreationResult {
  wallet: Wallet;
  mnemonic: string;
}

export interface UseWalletReturn {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  transfers: WalletTransfer[];
  loading: boolean;
  createWallet: (name?: string) => Promise<WalletCreationResult | null>;
  importWallet: (mnemonic: string, name?: string) => Promise<Wallet | null>;
  setActiveWallet: (walletId: string) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<boolean>;
  removeWallet: (walletId: string) => void;
  renameWallet: (walletId: string, newName: string) => Promise<boolean>;
  verifyMnemonic: (mnemonic: string) => boolean;
  deriveAddressFromMnemonic: (mnemonic: string) => string | null;
  sendCoins: (toAddress: string, amount: number, note?: string) => Promise<{ success: boolean; error?: string; txHash?: string }>;
  validateAddress: (address: string) => Promise<{ valid: boolean; exists: boolean }>;
  refreshWallets: () => Promise<void>;
  refreshTransfers: () => Promise<void>;
}

// Generate unique wallet address from mnemonic
const deriveWalletFromMnemonic = (mnemonic: string): { address: string; checksum: string } => {
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
  const address = hdNode.address;
  const checksum = ethers.keccak256(ethers.toUtf8Bytes(address)).slice(0, 18);
  return { address, checksum };
};

// Generate unique tx hash
const generateTxHash = (): string => {
  const randomBytes = ethers.randomBytes(32);
  return ethers.hexlify(randomBytes);
};

export const useWallet = (): UseWalletReturn => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWallet, setActiveWalletState] = useState<Wallet | null>(null);
  const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
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

      const primary = walletData.find(w => w.is_primary);
      setActiveWalletState(primary || walletData[0] || null);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTransfers = useCallback(async () => {
    if (!user || wallets.length === 0) {
      setTransfers([]);
      return;
    }

    try {
      const walletIds = wallets.map(w => w.id);
      const { data, error } = await supabase
        .from('wallet_transfers')
        .select('*')
        .or(`from_wallet_id.in.(${walletIds.join(',')}),to_wallet_id.in.(${walletIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransfers((data || []) as WalletTransfer[]);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  }, [user, wallets]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    if (wallets.length > 0) {
      fetchTransfers();
    }
  }, [wallets, fetchTransfers]);

  // Subscribe to realtime transfer updates
  useEffect(() => {
    if (!user || wallets.length === 0) return;

    const channel = supabase
      .channel('wallet-transfers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transfers',
        },
        () => {
          fetchTransfers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, wallets, fetchTransfers]);

  const createWallet = useCallback(async (name?: string): Promise<WalletCreationResult | null> => {
    if (!user) return null;

    try {
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
      if (!bip39.validateMnemonic(mnemonic.trim().toLowerCase())) {
        throw new Error('Invalid seed phrase');
      }

      const normalizedMnemonic = mnemonic.trim().toLowerCase();
      const { address, checksum } = deriveWalletFromMnemonic(normalizedMnemonic);

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
      await supabase
        .from('wallets')
        .update({ is_primary: false })
        .eq('user_id', user.id);

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

  // Remove wallet from local state only (for testing/re-importing)
  const removeWallet = useCallback((walletId: string) => {
    setWallets(prev => {
      const remaining = prev.filter(w => w.id !== walletId);
      // If we removed the active wallet, set a new one
      if (activeWallet?.id === walletId && remaining.length > 0) {
        setActiveWalletState(remaining[0]);
      } else if (remaining.length === 0) {
        setActiveWalletState(null);
      }
      return remaining;
    });
  }, [activeWallet]);

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

  const deriveAddressFromMnemonic = useCallback((mnemonic: string): string | null => {
    try {
      const normalizedMnemonic = mnemonic.trim().toLowerCase();
      if (!bip39.validateMnemonic(normalizedMnemonic)) return null;
      const { address } = deriveWalletFromMnemonic(normalizedMnemonic);
      return address;
    } catch {
      return null;
    }
  }, []);

  const validateAddress = useCallback(async (address: string): Promise<{ valid: boolean; exists: boolean }> => {
    // Check if it's a valid Ethereum-style address
    const isValid = ethers.isAddress(address);
    if (!isValid) return { valid: false, exists: false };

    // Check if wallet exists in our system
    const { data } = await supabase
      .from('wallets')
      .select('id')
      .eq('wallet_address', address)
      .maybeSingle();

    return { valid: true, exists: !!data };
  }, []);

  const sendCoins = useCallback(async (
    toAddress: string, 
    amount: number, 
    note?: string
  ): Promise<{ success: boolean; error?: string; txHash?: string }> => {
    if (!user || !activeWallet) {
      return { success: false, error: 'Nema aktivnog walleta' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Iznos mora biti veći od 0' };
    }

    // Validate recipient address
    const { valid, exists } = await validateAddress(toAddress);
    if (!valid) {
      return { success: false, error: 'Nevažeća adresa primatelja' };
    }

    if (!exists) {
      return { success: false, error: 'Wallet primatelja ne postoji u WALKCOINS mreži' };
    }

    if (toAddress.toLowerCase() === activeWallet.wallet_address.toLowerCase()) {
      return { success: false, error: 'Ne možete slati sebi' };
    }

    try {
      // Get current balance from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_coins')
        .eq('id', user.id)
        .single();

      if (!profile || profile.total_coins < amount) {
        return { success: false, error: 'Nedovoljno WALK coins' };
      }

      // Find recipient wallet
      const { data: recipientWallet } = await supabase
        .from('wallets')
        .select('id, user_id')
        .eq('wallet_address', toAddress)
        .single();

      if (!recipientWallet) {
        return { success: false, error: 'Wallet primatelja nije pronađen' };
      }

      const txHash = generateTxHash();

      // Deduct from sender profile
      const { error: senderError } = await supabase
        .from('profiles')
        .update({ total_coins: profile.total_coins - amount })
        .eq('id', user.id);

      if (senderError) throw senderError;

      // Add to recipient profile
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('total_coins')
        .eq('id', recipientWallet.user_id)
        .single();

      if (recipientProfile) {
        await supabase
          .from('profiles')
          .update({ total_coins: recipientProfile.total_coins + amount })
          .eq('id', recipientWallet.user_id);
      }

      // Record transfer
      const { error: transferError } = await supabase
        .from('wallet_transfers')
        .insert({
          from_wallet_id: activeWallet.id,
          to_wallet_id: recipientWallet.id,
          from_address: activeWallet.wallet_address,
          to_address: toAddress,
          amount,
          fee: 0,
          status: 'completed',
          tx_hash: txHash,
          note: note || null,
        });

      if (transferError) throw transferError;

      // Record transactions
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: -amount,
        transaction_type: 'transfer_out',
        description: `Poslano na ${toAddress.slice(0, 8)}...${toAddress.slice(-6)}`,
      });

      await supabase.from('coin_transactions').insert({
        user_id: recipientWallet.user_id,
        amount: amount,
        transaction_type: 'transfer_in',
        description: `Primljeno od ${activeWallet.wallet_address.slice(0, 8)}...${activeWallet.wallet_address.slice(-6)}`,
      });

      await fetchTransfers();

      return { success: true, txHash };
    } catch (error) {
      console.error('Error sending coins:', error);
      return { success: false, error: 'Greška pri slanju' };
    }
  }, [user, activeWallet, validateAddress, fetchTransfers]);

  return {
    wallets,
    activeWallet,
    transfers,
    loading,
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
    refreshWallets: fetchWallets,
    refreshTransfers: fetchTransfers,
  };
};
