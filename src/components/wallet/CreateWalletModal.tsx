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
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Copy, Check, Wallet, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name?: string) => Promise<{ wallet: any; mnemonic: string } | null>;
}

type Step = 'name' | 'seed' | 'verify' | 'complete';

const CreateWalletModal: React.FC<CreateWalletModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [step, setStep] = useState<Step>('name');
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [verifyWords, setVerifyWords] = useState<{ index: number; word: string }[]>([]);
  const [verifyInputs, setVerifyInputs] = useState<string[]>(['', '', '']);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const result = await onCreate(walletName || undefined);
      if (result) {
        setMnemonic(result.mnemonic);
        // Select 3 random words for verification
        const words = result.mnemonic.split(' ');
        const indices = [3, 8, 15].map(i => ({ index: i, word: words[i] }));
        setVerifyWords(indices);
        setStep('seed');
      }
    } catch (error) {
      toast.error('Error creating wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Seed phrase copied!');
  };

  const handleVerify = () => {
    const isCorrect = verifyWords.every((vw, i) => 
      verifyInputs[i].toLowerCase().trim() === vw.word.toLowerCase()
    );

    if (isCorrect) {
      setStep('complete');
    } else {
      toast.error('Incorrect words. Please check your seed phrase.');
    }
  };

  const handleComplete = () => {
    setStep('name');
    setWalletName('');
    setMnemonic('');
    setConfirmed(false);
    setCopied(false);
    setVerifyInputs(['', '', '']);
    onClose();
    toast.success('Wallet successfully created!');
  };

  const resetAndClose = () => {
    setStep('name');
    setWalletName('');
    setMnemonic('');
    setConfirmed(false);
    setCopied(false);
    setShowSeed(false);
    setVerifyInputs(['', '', '']);
    onClose();
  };

  const mnemonicWords = mnemonic.split(' ');

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="bg-crypto-card border-crypto-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-crypto-gold" />
            {step === 'name' && 'Create New Wallet'}
            {step === 'seed' && 'Save Seed Phrase'}
            {step === 'verify' && 'Verify Seed Phrase'}
            {step === 'complete' && 'Wallet Created!'}
          </DialogTitle>
          <DialogDescription className="text-crypto-muted">
            {step === 'name' && 'Create your WALKCOINS non-custodial wallet'}
            {step === 'seed' && 'This phrase is the only way to access your wallet. Never share it!'}
            {step === 'verify' && 'Confirm that you have saved your seed phrase'}
            {step === 'complete' && 'Your wallet is ready to use'}
          </DialogDescription>
        </DialogHeader>

        {step === 'name' && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-white">Wallet Name (optional)</Label>
              <Input
                placeholder="e.g. Main Wallet"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="bg-crypto-dark border-crypto-border text-white"
              />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <p className="font-semibold mb-1">Non-Custodial Wallet</p>
                  <p className="text-amber-300/80">
                    You will receive a 24-word seed phrase. This phrase is the ONLY way to access your WALKCOINS.
                    Store it in a safe place offline.
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleCreate} 
              disabled={loading}
              className="w-full bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
            >
              {loading ? 'Creating...' : 'Create Wallet'}
            </Button>
          </div>
        )}

        {step === 'seed' && (
          <div className="space-y-4 pt-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="text-sm text-red-200">
                  <p className="font-semibold mb-1">WARNING - SAVE THIS!</p>
                  <p className="text-red-300/80">
                    This seed phrase is shown ONLY ONCE. We will never show it again.
                    Write it down on paper and keep it in a safe place.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-white">Your 24-Word Seed Phrase</Label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSeed(!showSeed)}
                    className="text-crypto-muted hover:text-white"
                  >
                    {showSeed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-crypto-muted hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className={`grid grid-cols-3 gap-2 p-4 bg-crypto-dark rounded-lg border border-crypto-border ${!showSeed ? 'blur-sm select-none' : ''}`}>
                {mnemonicWords.map((word, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-crypto-muted w-5 text-right">{i + 1}.</span>
                    <span className="text-white font-mono">{word}</span>
                  </div>
                ))}
              </div>
              {!showSeed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSeed(true)}
                    className="border-crypto-gold text-crypto-gold hover:bg-crypto-gold/10"
                  >
                    <Eye className="w-4 h-4 mr-2" /> Show Seed Phrase
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3 p-3 bg-crypto-dark rounded-lg">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                className="border-crypto-gold data-[state=checked]:bg-crypto-gold"
              />
              <Label htmlFor="confirm" className="text-sm text-crypto-muted cursor-pointer">
                I understand that if I lose this seed phrase, I will permanently lose access to my WALKCOINS.
                I have saved it in a safe place.
              </Label>
            </div>

            <Button 
              onClick={() => setStep('verify')} 
              disabled={!confirmed}
              className="w-full bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
            >
              Continue to Verification
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4 pt-4">
            <p className="text-crypto-muted text-sm">
              Enter the requested words from your seed phrase to confirm you have saved it.
            </p>

            <div className="space-y-3">
              {verifyWords.map((vw, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-white">Word #{vw.index + 1}</Label>
                  <Input
                    placeholder={`Enter word #${vw.index + 1}`}
                    value={verifyInputs[i]}
                    onChange={(e) => {
                      const newInputs = [...verifyInputs];
                      newInputs[i] = e.target.value;
                      setVerifyInputs(newInputs);
                    }}
                    className="bg-crypto-dark border-crypto-border text-white font-mono"
                  />
                </div>
              ))}
            </div>

            <Button 
              onClick={handleVerify} 
              disabled={verifyInputs.some(v => !v.trim())}
              className="w-full bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
            >
              Confirm
            </Button>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4 pt-4 text-center">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Wallet Successfully Created!</h3>
              <p className="text-crypto-muted">
                Your WALKCOINS wallet is ready. You can now receive and send WALK coins.
              </p>
            </div>
            <Button 
              onClick={handleComplete}
              className="w-full bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
            >
              Finish
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateWalletModal;
