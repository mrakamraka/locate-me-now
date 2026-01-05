
-- Create wallets table for non-custodial WALKCOINS wallets
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_name TEXT NOT NULL DEFAULT 'Main Wallet',
  wallet_address TEXT NOT NULL UNIQUE,
  address_checksum TEXT NOT NULL, -- For verification without storing seed
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can only view their own wallets
CREATE POLICY "Users can view their own wallets"
ON public.wallets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own wallets
CREATE POLICY "Users can insert their own wallets"
ON public.wallets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own wallets
CREATE POLICY "Users can update their own wallets"
ON public.wallets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own wallets
CREATE POLICY "Users can delete their own wallets"
ON public.wallets
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add wallet_id to profiles for active wallet tracking
ALTER TABLE public.profiles ADD COLUMN active_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;
