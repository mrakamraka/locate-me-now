import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Share2, Sparkles, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  walletName: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
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
          title: 'WALKCOIN Adresa',
          text: `Moja WALKCOIN adresa: ${walletAddress}`,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const formatAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-crypto-card border-crypto-border max-w-sm p-0 overflow-hidden">
        {/* Decorative Header */}
        <div className="relative bg-gradient-to-br from-crypto-purple via-crypto-blue to-crypto-green p-6 pb-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute top-4 right-4">
            <Sparkles className="w-6 h-6 text-white/40 animate-pulse" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              QR Kod Wallet-a
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* QR Code Card - Floating effect */}
        <div className="px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl p-4 shadow-2xl shadow-black/50">
            <div className="flex justify-center mb-3">
              <div className="relative">
                <QRCodeSVG
                  value={walletAddress}
                  size={180}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                  imageSettings={{
                    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f5a623'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 6v6l4 2' stroke='%231a1a2e' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E",
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
                {/* Decorative corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-crypto-gold rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-crypto-gold rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-crypto-gold rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-crypto-gold rounded-br-lg" />
              </div>
            </div>
            
            {/* Wallet Name Badge */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-crypto-purple/20 to-crypto-blue/20 text-crypto-dark text-sm font-semibold">
                <Wallet className="w-3.5 h-3.5" />
                {walletName}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Address Display */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-crypto-gold/20 via-crypto-purple/20 to-crypto-blue/20 rounded-xl blur-sm group-hover:blur-md transition-all" />
            <div className="relative bg-crypto-dark/80 rounded-xl p-4 border border-crypto-border">
              <p className="text-crypto-muted text-xs mb-1.5 uppercase tracking-wider">Wallet Adresa</p>
              <p className="text-white font-mono text-sm break-all leading-relaxed">
                {walletAddress}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCopy}
              className="relative overflow-hidden bg-gradient-to-r from-crypto-gold to-crypto-gold/80 hover:from-crypto-gold/90 hover:to-crypto-gold/70 text-crypto-dark font-bold h-12 rounded-xl transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Kopirano!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Kopiraj
                  </>
                )}
              </span>
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-crypto-purple/30 text-white hover:bg-crypto-purple/20 hover:border-crypto-purple h-12 rounded-xl transition-all duration-300"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Podijeli
            </Button>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-crypto-blue/10 border border-crypto-blue/20">
            <Sparkles className="w-5 h-5 text-crypto-blue flex-shrink-0 mt-0.5" />
            <p className="text-crypto-muted text-xs leading-relaxed">
              Skeniraj ovaj QR kod da dobiješ moju WALKCOIN adresu. Šalji samo WALK coins na ovu adresu.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
