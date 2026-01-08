import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Coins, Users, Award, TrendingUp } from 'lucide-react';
import { CoinTransaction } from '@/hooks/useWalkCoins';
import { format } from 'date-fns';

interface TransactionHistoryProps {
  transactions: CoinTransaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'walk':
        return <TrendingUp className="w-4 h-4 text-crypto-green" />;
      case 'referral_bonus':
        return <Users className="w-4 h-4 text-crypto-purple" />;
      case 'level_up':
        return <Award className="w-4 h-4 text-crypto-gold" />;
      default:
        return <Coins className="w-4 h-4 text-crypto-muted" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'walk':
        return 'border-crypto-green/30 bg-crypto-green/5';
      case 'referral_bonus':
        return 'border-crypto-purple/30 bg-crypto-purple/5';
      case 'level_up':
        return 'border-crypto-gold/30 bg-crypto-gold/5';
      default:
        return 'border-crypto-border bg-crypto-card/50';
    }
  };

  return (
    <Card className="bg-crypto-card/80 backdrop-blur-xl border-crypto-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <History className="w-5 h-5 text-crypto-muted" />
          Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="w-12 h-12 text-crypto-muted/30 mx-auto mb-3" />
              <p className="text-crypto-muted text-sm">No transactions</p>
              <p className="text-crypto-muted/60 text-xs">Start walking to earn WALK Coins!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-3 rounded-lg border ${getTransactionColor(tx.transaction_type)} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-crypto-dark/50">
                        {getTransactionIcon(tx.transaction_type)}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">
                          {tx.description || tx.transaction_type}
                        </p>
                        <p className="text-xs text-crypto-muted">
                          {format(new Date(tx.created_at), 'dd.MM.yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-crypto-gold">
                        +{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-crypto-muted">WALK</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
