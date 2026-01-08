import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet, 
  Plus, 
  Download, 
  Copy, 
  Check, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Star,
  ChevronDown,
  Shield,
  Send,
  ArrowDownLeft,
  LogOut,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';
import { Wallet as WalletType } from '@/hooks/useWallet';
import { Profile } from '@/hooks/useWalkCoins';
import CreateWalletModal from './CreateWalletModal';
import ImportWalletModal from './ImportWalletModal';
import SendModal from './SendModal';
import ReceiveModal from './ReceiveModal';
import { VerifyBackupModal } from './VerifyBackupModal';
import QRCodeModal from './QRCodeModal';

interface WalletCardProps {
  wallets: WalletType[];
  activeWallet: WalletType | null;
  profile: Profile | null;
  loading: boolean;
  onCreateWallet: (name?: string) => Promise<any>;
  onImportWallet: (mnemonic: string, name?: string) => Promise<any>;
  onSetActiveWallet: (walletId: string) => Promise<void>;
  onDeleteWallet: (walletId: string) => Promise<boolean>;
  onRemoveWallet: (walletId: string) => Promise<boolean>;
  onRenameWallet: (walletId: string, newName: string) => Promise<boolean>;
  verifyMnemonic: (mnemonic: string) => boolean;
  deriveAddressFromMnemonic: (mnemonic: string) => string | null;
  onSendCoins: (toAddress: string, amount: number, note?: string) => Promise<{ success: boolean; error?: string; txHash?: string }>;
  validateAddress: (address: string) => Promise<{ valid: boolean; exists: boolean }>;
}

const WalletCard: React.FC<WalletCardProps> = ({
  wallets,
  activeWallet,
  profile,
  loading,
  onCreateWallet,
  onImportWallet,
  onSetActiveWallet,
  onDeleteWallet,
  onRemoveWallet,
  onRenameWallet,
  verifyMnemonic,
  deriveAddressFromMnemonic,
  onSendCoins,
  validateAddress,
}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [verifyBackupModalOpen, setVerifyBackupModalOpen] = useState(false);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [newName, setNewName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!activeWallet) return;
    await navigator.clipboard.writeText(activeWallet.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied!');
  };

  const handleRename = async () => {
    if (!selectedWallet || !newName.trim()) return;
    const success = await onRenameWallet(selectedWallet.id, newName.trim());
    if (success) {
      toast.success('Wallet renamed!');
      setRenameModalOpen(false);
      setNewName('');
    }
  };

  const handleDelete = async () => {
    if (!selectedWallet) return;
    const success = await onDeleteWallet(selectedWallet.id);
    if (success) {
      toast.success('Wallet deleted!');
      setDeleteModalOpen(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (loading) {
    return (
      <Card className="bg-crypto-card/80 backdrop-blur-xl border-crypto-gold/30 animate-pulse">
        <CardContent className="p-6">
          <div className="h-32"></div>
        </CardContent>
      </Card>
    );
  }

  // No wallet created yet
  if (wallets.length === 0) {
    return (
      <>
        <Card className="bg-gradient-to-br from-crypto-card to-crypto-dark border-crypto-gold/30">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-crypto-gold/20 rounded-full flex items-center justify-center">
                <Wallet className="w-8 h-8 text-crypto-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Create WALKCOINS Wallet</h3>
                <p className="text-crypto-muted text-sm">
                  Create your non-custodial wallet to securely store WALK coins
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Wallet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setImportModalOpen(true)}
                  className="border-crypto-purple text-crypto-purple hover:bg-crypto-purple/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <CreateWalletModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={onCreateWallet}
        />
        <ImportWalletModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={onImportWallet}
          verifyMnemonic={verifyMnemonic}
        />
      </>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-crypto-card via-crypto-dark to-crypto-card border-crypto-gold/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-crypto-gold/5 via-transparent to-crypto-purple/5 pointer-events-none" />
        
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-crypto-gold/20 rounded-lg">
                <Wallet className="w-5 h-5 text-crypto-gold" />
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-auto p-1 text-white hover:bg-crypto-gold/10 flex items-center gap-1"
                    >
                      <span className="font-bold">{activeWallet?.wallet_name}</span>
                      {activeWallet?.is_primary && (
                        <Star className="w-3 h-3 text-crypto-gold fill-crypto-gold" />
                      )}
                      <ChevronDown className="w-4 h-4 text-crypto-muted" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-crypto-card border-crypto-border min-w-[200px]">
                    {wallets.map((wallet) => (
                      <DropdownMenuItem
                        key={wallet.id}
                        onClick={() => onSetActiveWallet(wallet.id)}
                        className="text-white hover:bg-crypto-gold/10 cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-2">
                            {wallet.wallet_name}
                            {wallet.is_primary && (
                              <Star className="w-3 h-3 text-crypto-gold fill-crypto-gold" />
                            )}
                          </span>
                          {wallet.id === activeWallet?.id && (
                            <Check className="w-4 h-4 text-crypto-gold" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-crypto-border" />
                    <DropdownMenuItem
                      onClick={() => setCreateModalOpen(true)}
                      className="text-crypto-gold hover:bg-crypto-gold/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setImportModalOpen(true)}
                      className="text-crypto-purple hover:bg-crypto-purple/10 cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Import Wallet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-crypto-muted hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-crypto-card border-crypto-border">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedWallet(activeWallet);
                    setNewName(activeWallet?.wallet_name || '');
                    setRenameModalOpen(true);
                  }}
                  className="text-white hover:bg-crypto-gold/10 cursor-pointer"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setVerifyBackupModalOpen(true)}
                  className="text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verify Backup
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (activeWallet) {
                      const success = await onRemoveWallet(activeWallet.id);
                      if (success) {
                        toast.success('Wallet removed! You can re-import it with the same seed phrase.');
                      }
                    }
                  }}
                  className="text-orange-400 hover:bg-orange-500/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Remove Wallet
                </DropdownMenuItem>
                {wallets.length > 1 && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedWallet(activeWallet);
                      setDeleteModalOpen(true);
                    }}
                    className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Balance */}
          <div className="text-center py-4">
            <p className="text-crypto-muted text-sm mb-1">Balance</p>
            <p className="text-4xl font-bold text-white">
              {profile?.total_coins.toLocaleString() || '0'}
            </p>
            <p className="text-crypto-gold font-semibold">WALK</p>
          </div>

          {/* Send/Receive Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => setSendModalOpen(true)}
              className="flex-1 bg-crypto-gold hover:bg-crypto-gold/90 text-black font-bold"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
            <Button
              onClick={() => setReceiveModalOpen(true)}
              variant="outline"
              className="flex-1 border-crypto-green text-crypto-green hover:bg-crypto-green/10"
            >
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Receive
            </Button>
          </div>

          {/* Address */}
          <div className="bg-crypto-dark/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-crypto-muted text-xs mb-1">Wallet Address</p>
                <p className="text-white font-mono text-sm">
                  {activeWallet ? shortenAddress(activeWallet.wallet_address) : '...'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQrCodeModalOpen(true)}
                  className="text-crypto-muted hover:text-white hover:bg-crypto-purple/10"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyAddress}
                  className="text-crypto-muted hover:text-white hover:bg-crypto-gold/10"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-crypto-muted text-xs">
            <Shield className="w-3 h-3 text-green-500" />
            <span>Non-Custodial • Full Control</span>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateWalletModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={onCreateWallet}
      />
      
      <ImportWalletModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={onImportWallet}
        verifyMnemonic={verifyMnemonic}
      />

      {activeWallet && (
        <>
          <SendModal
            isOpen={sendModalOpen}
            onClose={() => setSendModalOpen(false)}
            onSend={onSendCoins}
            validateAddress={validateAddress}
            currentBalance={profile?.total_coins || 0}
            walletAddress={activeWallet.wallet_address}
          />

          <ReceiveModal
            isOpen={receiveModalOpen}
            onClose={() => setReceiveModalOpen(false)}
            walletAddress={activeWallet.wallet_address}
            walletName={activeWallet.wallet_name}
          />

          <QRCodeModal
            isOpen={qrCodeModalOpen}
            onClose={() => setQrCodeModalOpen(false)}
            walletAddress={activeWallet.wallet_address}
            walletName={activeWallet.wallet_name}
          />
        </>
      )}

      {/* Rename Modal */}
      <Dialog open={renameModalOpen} onOpenChange={setRenameModalOpen}>
        <DialogContent className="bg-crypto-card border-crypto-border">
          <DialogHeader>
            <DialogTitle className="text-white">Rename Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">New Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-crypto-dark border-crypto-border text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameModalOpen(false)} className="border-crypto-border">
              Cancel
            </Button>
            <Button onClick={handleRename} className="bg-crypto-gold text-black">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-crypto-card border-crypto-border">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Wallet</DialogTitle>
            <DialogDescription className="text-crypto-muted">
              Are you sure you want to delete wallet "{selectedWallet?.wallet_name}"?
              This action cannot be undone. If you have your seed phrase, you can always re-import the wallet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="border-crypto-border">
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Backup Modal */}
      {activeWallet && (
        <VerifyBackupModal
          isOpen={verifyBackupModalOpen}
          onClose={() => setVerifyBackupModalOpen(false)}
          walletAddress={activeWallet.wallet_address}
          deriveAddressFromMnemonic={deriveAddressFromMnemonic}
        />
      )}
    </>
  );
};

export default WalletCard;
