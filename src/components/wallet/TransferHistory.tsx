import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { WalletTransfer } from '@/hooks/useWallet';

interface TransferHistoryProps {
  transfers: WalletTransfer[];
  currentWalletId: string | null;
}

const TransferHistory: React.FC<TransferHistoryProps> = ({ transfers, currentWalletId }) => {
  if (transfers.length === 0) {
    return (
      <Card className="bg-crypto-card/80 backdrop-blur-xl border-crypto-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-crypto-muted" />
            Historija Transfera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-crypto-muted text-center py-6 text-sm">
            Nemate još nijedan transfer
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-crypto-card/80 backdrop-blur-xl border-crypto-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-crypto-muted" />
          Historija Transfera
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {transfers.map((transfer) => {
              const isSent = transfer.from_wallet_id === currentWalletId;
              const otherAddress = isSent ? transfer.to_address : transfer.from_address;
              
              return (
                <div
                  key={transfer.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-crypto-dark/50 hover:bg-crypto-dark/70 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${isSent ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    {isSent ? (
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {isSent ? 'Poslano' : 'Primljeno'}
                    </p>
                    <p className="text-crypto-muted text-xs truncate">
                      {isSent ? 'Za: ' : 'Od: '}
                      {otherAddress.slice(0, 8)}...{otherAddress.slice(-6)}
                    </p>
                    {transfer.note && (
                      <p className="text-crypto-muted text-xs mt-1 italic">
                        "{transfer.note}"
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold ${isSent ? 'text-red-400' : 'text-green-400'}`}>
                      {isSent ? '-' : '+'}{transfer.amount.toLocaleString()}
                    </p>
                    <p className="text-crypto-muted text-xs">WALK</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TransferHistory;