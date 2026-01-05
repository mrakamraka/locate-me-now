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
import { Send, Loader2, Check, AlertCircle, Coins } from 'lucide-react';
import { toast } from 'sonner';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (toAddress: string, amount: number, note?: string) => Promise<{ success: boolean; error?: string; txHash?: string }>;
  validateAddress: (address: string) => Promise<{ valid: boolean; exists: boolean }>;
  currentBalance: number;
  walletAddress: string;
}

const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  onClose,
  onSend,
  validateAddress,
  currentBalance,
  walletAddress,
}) => {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [addressStatus, setAddressStatus] = useState<{ valid: boolean; exists: boolean } | null>(null);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [txHash, setTxHash] = useState('');

  const handleAddressChange = async (value: string) => {
    setToAddress(value);
    setAddressStatus(null);

    if (value.length === 42 && value.startsWith('0x')) {
      setValidating(true);
      const status = await validateAddress(value);
      setAddressStatus(status);
      setValidating(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers
    const numValue = value.replace(/[^0-9]/g, '');
    setAmount(numValue);
  };

  const handleSetMax = () => {
    setAmount(currentBalance.toString());
  };

  const handleProceed = () => {
    if (!addressStatus?.valid || !addressStatus?.exists) {
      toast.error('Nevažeća adresa');
      return;
    }

    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Unesite ispravan iznos');
      return;
    }

    if (numAmount > currentBalance) {
      toast.error('Nedovoljno sredstava');
      return;
    }

    if (toAddress.toLowerCase() === walletAddress.toLowerCase()) {
      toast.error('Ne možete slati sebi');
      return;
    }

    setStep('confirm');
  };

  const handleSend = async () => {
    setLoading(true);
    const result = await onSend(toAddress, parseInt(amount), note || undefined);
    setLoading(false);

    if (result.success) {
      setTxHash(result.txHash || '');
      setStep('success');
    } else {
      toast.error(result.error || 'Greška pri slanju');
    }
  };

  const handleClose = () => {
    setToAddress('');
    setAmount('');
    setNote('');
    setAddressStatus(null);
    setStep('form');
    setTxHash('');
    onClose();
  };

  const numAmount = parseInt(amount) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-crypto-card border-crypto-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-crypto-gold" />
            {step === 'form' && 'Pošalji WALK Coins'}
            {step === 'confirm' && 'Potvrdi Transakciju'}
            {step === 'success' && 'Transakcija Uspješna!'}
          </DialogTitle>
          <DialogDescription className="text-crypto-muted">
            {step === 'form' && 'Pošaljite WALK coins na drugu adresu'}
            {step === 'confirm' && 'Provjerite detalje prije slanja'}
            {step === 'success' && 'Vaši WALK coins su uspješno poslani'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4 pt-4">
            {/* Balance */}
            <div className="bg-crypto-dark/50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-crypto-muted text-sm">Dostupno</span>
              <span className="text-white font-bold flex items-center gap-1">
                <Coins className="w-4 h-4 text-crypto-gold" />
                {currentBalance.toLocaleString()} WALK
              </span>
            </div>

            {/* Recipient Address */}
            <div className="space-y-2">
              <Label className="text-white">Adresa Primatelja</Label>
              <div className="relative">
                <Input
                  placeholder="0x..."
                  value={toAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  className={`bg-crypto-dark border-crypto-border text-white font-mono pr-10 ${
                    addressStatus?.valid && addressStatus?.exists
                      ? 'border-green-500'
                      : addressStatus && (!addressStatus.valid || !addressStatus.exists)
                      ? 'border-red-500'
                      : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {validating && <Loader2 className="w-4 h-4 text-crypto-muted animate-spin" />}
                  {addressStatus?.valid && addressStatus?.exists && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {addressStatus && (!addressStatus.valid || !addressStatus.exists) && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              {addressStatus && !addressStatus.valid && (
                <p className="text-red-500 text-xs">Nevažeća adresa</p>
              )}
              {addressStatus && addressStatus.valid && !addressStatus.exists && (
                <p className="text-red-500 text-xs">Adresa ne postoji u WALKCOINS mreži</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-white">Iznos</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="bg-crypto-dark border-crypto-border text-white pr-20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-crypto-muted text-sm">WALK</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSetMax}
                    className="h-6 px-2 text-xs text-crypto-gold hover:text-crypto-gold/80"
                  >
                    MAX
                  </Button>
                </div>
              </div>
              {numAmount > currentBalance && (
                <p className="text-red-500 text-xs">Nedovoljno sredstava</p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label className="text-white">Napomena (opcionalno)</Label>
              <Textarea
                placeholder="Npr. Za kavu ☕"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-crypto-dark border-crypto-border text-white h-20 resize-none"
                maxLength={100}
              />
            </div>

            <Button
              onClick={handleProceed}
              disabled={!addressStatus?.exists || numAmount <= 0 || numAmount > currentBalance}
              className="w-full bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
            >
              Nastavi
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4 pt-4">
            <div className="bg-crypto-dark/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-crypto-muted">Primatelj</span>
                <span className="text-white font-mono text-sm">
                  {toAddress.slice(0, 10)}...{toAddress.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-crypto-muted">Iznos</span>
                <span className="text-white font-bold">{numAmount.toLocaleString()} WALK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-crypto-muted">Naknada</span>
                <span className="text-green-500">0 WALK</span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-crypto-muted">Napomena</span>
                  <span className="text-white text-sm">{note}</span>
                </div>
              )}
              <div className="border-t border-crypto-border pt-3 flex justify-between">
                <span className="text-crypto-muted font-semibold">Ukupno</span>
                <span className="text-crypto-gold font-bold text-lg">{numAmount.toLocaleString()} WALK</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                className="flex-1 border-crypto-border"
              >
                Natrag
              </Button>
              <Button
                onClick={handleSend}
                disabled={loading}
                className="flex-1 bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Slanje...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Pošalji
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 pt-4 text-center">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Uspješno Poslano!</h3>
              <p className="text-crypto-gold font-bold text-2xl mb-2">
                {numAmount.toLocaleString()} WALK
              </p>
              <p className="text-crypto-muted text-sm">
                Poslano na {toAddress.slice(0, 10)}...{toAddress.slice(-8)}
              </p>
            </div>
            {txHash && (
              <div className="bg-crypto-dark/50 rounded-lg p-3">
                <p className="text-crypto-muted text-xs mb-1">TX Hash</p>
                <p className="text-white font-mono text-xs break-all">
                  {txHash}
                </p>
              </div>
            )}
            <Button
              onClick={handleClose}
              className="w-full bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
            >
              Završi
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SendModal;