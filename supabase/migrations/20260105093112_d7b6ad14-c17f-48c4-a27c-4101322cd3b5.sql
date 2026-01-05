
-- Create wallet transfers table for WALKCOINS transactions
CREATE TABLE public.wallet_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  fee BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  tx_hash TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;

-- Users can view transfers where they are sender or receiver
CREATE POLICY "Users can view their transfers"
ON public.wallet_transfers
FOR SELECT
USING (
  from_wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
  OR to_wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);

-- Users can insert transfers from their own wallets
CREATE POLICY "Users can create transfers from their wallets"
ON public.wallet_transfers
FOR INSERT
WITH CHECK (
  from_wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);

-- Create index for faster lookups
CREATE INDEX idx_wallet_transfers_from ON public.wallet_transfers(from_wallet_id);
CREATE INDEX idx_wallet_transfers_to ON public.wallet_transfers(to_wallet_id);
CREATE INDEX idx_wallet_transfers_addresses ON public.wallet_transfers(from_address, to_address);

-- Enable realtime for transfers
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transfers;
