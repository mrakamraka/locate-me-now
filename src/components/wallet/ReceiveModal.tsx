import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  walletName: string;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  walletName,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Adresa kopirana!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WALKCOINS Adresa',
          text: `Moja WALKCOINS adresa: ${walletAddress}`,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  // Generate simple QR code pattern (visual representation)
  const generateQRPattern = () => {
    const size = 9;
    const pattern: boolean[][] = [];
    
    // Create a simple pattern based on address hash
    for (let i = 0; i < size; i++) {
      pattern[i] = [];
      for (let j = 0; j < size; j++) {
        const charIndex = (i * size + j) % walletAddress.length;
        const charCode = walletAddress.charCodeAt(charIndex);
        pattern[i][j] = charCode % 2 === 0;
      }
    }
    
    // Add corner patterns
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        pattern[i][j] = i === 1 && j === 1 ? false : true;
        pattern[i][size - 1 - j] = i === 1 && j === 1 ? false : true;
        pattern[size - 1 - i][j] = i === 1 && j === 1 ? false : true;
      }
    }
    
    return pattern;
  };

  const qrPattern = generateQRPattern();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-crypto-card border-crypto-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-crypto-green" />
            Primi WALK Coins
          </DialogTitle>
          <DialogDescription className="text-crypto-muted">
            Podijelite svoju adresu da primite WALKCOINS
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* QR Code */}
          <div className="bg-white rounded-xl p-4 mx-auto w-fit">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${qrPattern.length}, 1fr)` }}>
              {qrPattern.map((row, i) =>
                row.map((cell, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={`w-4 h-4 rounded-sm ${cell ? 'bg-crypto-dark' : 'bg-white'}`}
                  />
                ))
              )}
            </div>
            <div className="text-center mt-2">
              <span className="text-crypto-dark font-bold text-xs">WALKCOINS</span>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="text-center">
            <p className="text-white font-semibold">{walletName}</p>
          </div>

          {/* Address */}
          <div className="bg-crypto-dark/50 rounded-lg p-4">
            <p className="text-crypto-muted text-xs mb-2 text-center">Vaša WALKCOINS Adresa</p>
            <p className="text-white font-mono text-sm text-center break-all leading-relaxed">
              {walletAddress}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              className="flex-1 bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Kopirano
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Kopiraj
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 border-crypto-border text-white hover:bg-crypto-gold/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Podijeli
            </Button>
          </div>

          {/* Info */}
          <p className="text-crypto-muted text-xs text-center">
            Šaljite samo WALKCOINS na ovu adresu. Slanje drugih kriptovaluta može rezultirati gubitkom sredstava.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiveModal;