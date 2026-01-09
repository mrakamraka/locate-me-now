import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';

interface VerifyBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  verifyMnemonic: (mnemonic: string) => boolean;
  deriveAddressFromMnemonic: (mnemonic: string) => string | null;
}

export function VerifyBackupModal({
  isOpen,
  onClose,
  walletAddress,
  verifyMnemonic,
  deriveAddressFromMnemonic,
}: VerifyBackupModalProps) {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [verificationResult, setVerificationResult] = useState<'success' | 'wrong-wallet' | 'invalid' | null>(null);

  const handleVerify = () => {
    const normalizedMnemonic = seedPhrase.trim().toLowerCase().replace(/\s+/g, ' ');
    
    if (!verifyMnemonic(normalizedMnemonic)) {
      setVerificationResult('invalid');
      return;
    }

    const derivedAddress = deriveAddressFromMnemonic(normalizedMnemonic);
    
    if (derivedAddress?.toLowerCase() === walletAddress.toLowerCase()) {
      setVerificationResult('success');
    } else {
      setVerificationResult('wrong-wallet');
    }
  };

  const handleClose = () => {
    setSeedPhrase('');
    setVerificationResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Verify Backup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your seed phrase (24 words) to verify it matches this wallet.
          </p>

          <div>
            <Textarea
              placeholder="Enter 24 words separated by spaces..."
              value={seedPhrase}
              onChange={(e) => {
                setSeedPhrase(e.target.value);
                setVerificationResult(null);
              }}
              className="min-h-[100px] bg-background border-border text-foreground"
            />
          </div>

          {verificationResult === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-500">Backup is valid!</p>
                <p className="text-xs text-green-500/70">This seed phrase matches the active wallet.</p>
              </div>
            </div>
          )}

          {verificationResult === 'wrong-wallet' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-500">Wrong wallet</p>
                <p className="text-xs text-orange-500/70">This seed phrase belongs to a different wallet.</p>
              </div>
            </div>
          )}

          {verificationResult === 'invalid' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <ShieldX className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Invalid seed phrase</p>
                <p className="text-xs text-destructive/70">Make sure you entered exactly 24 words.</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!seedPhrase.trim()}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Verify
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
