import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (mnemonic: string, name?: string) => Promise<any>;
  verifyMnemonic: (mnemonic: string) => boolean;
}

const ImportWalletModal: React.FC<ImportWalletModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport,
  verifyMnemonic 
}) => {
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const handleMnemonicChange = (value: string) => {
    setMnemonic(value);
    if (value.trim().split(/\s+/).length === 24) {
      setIsValid(verifyMnemonic(value));
    } else {
      setIsValid(null);
    }
  };

  const handleImport = async () => {
    if (!verifyMnemonic(mnemonic)) {
      toast.error('Nevažeća seed fraza');
      return;
    }

    setLoading(true);
    try {
      await onImport(mnemonic, walletName || undefined);
      toast.success('Wallet uspješno uvezen!');
      handleClose();
    } catch (error: any) {
      if (error.message === 'Wallet already exists') {
        toast.error('Ovaj wallet već postoji');
      } else {
        toast.error('Greška pri uvozu walleta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setWalletName('');
    setMnemonic('');
    setIsValid(null);
    onClose();
  };

  const wordCount = mnemonic.trim() ? mnemonic.trim().split(/\s+/).length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-crypto-card border-crypto-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-crypto-purple" />
            Uvezi Postojeći Wallet
          </DialogTitle>
          <DialogDescription className="text-crypto-muted">
            Unesite vašu 24-riječi seed frazu da uvezete postojeći WALKCOINS wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="text-sm text-amber-200">
                <p className="font-semibold mb-1">Sigurnosno Upozorenje</p>
                <p className="text-amber-300/80">
                  Nikada ne dijelite svoju seed frazu s drugima. 
                  WALKCOINS nikada neće tražiti vašu seed frazu putem emaila ili poruka.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Ime Walleta (opcionalno)</Label>
            <Input
              placeholder="Npr. Uvezeni Wallet"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              className="bg-crypto-dark border-crypto-border text-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-white">24-Riječi Seed Fraza</Label>
              <span className={`text-xs ${wordCount === 24 ? 'text-green-500' : 'text-crypto-muted'}`}>
                {wordCount}/24 riječi
              </span>
            </div>
            <Textarea
              placeholder="Unesite vašu seed frazu (24 riječi odvojene razmacima)..."
              value={mnemonic}
              onChange={(e) => handleMnemonicChange(e.target.value)}
              className={`bg-crypto-dark border-crypto-border text-white font-mono h-32 resize-none ${
                isValid === true ? 'border-green-500' : isValid === false ? 'border-red-500' : ''
              }`}
            />
            {isValid === true && (
              <p className="text-green-500 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" /> Seed fraza je važeća
              </p>
            )}
            {isValid === false && (
              <p className="text-red-500 text-sm">
                Nevažeća seed fraza. Provjerite da li ste unijeli sve riječi ispravno.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="flex-1 border-crypto-border text-crypto-muted hover:text-white"
            >
              Odustani
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={loading || !isValid}
              className="flex-1 bg-crypto-purple hover:bg-crypto-purple/90 text-white font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uvoz...
                </>
              ) : (
                'Uvezi Wallet'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportWalletModal;
