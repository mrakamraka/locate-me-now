import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2, Users, Check, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/hooks/useWalkCoins';

interface ReferralCardProps {
  profile: Profile | null;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ profile }) => {
  const [copied, setCopied] = useState(false);
  
  const referralLink = profile 
    ? `${window.location.origin}/auth?ref=${profile.referral_code}` 
    : '';

  const copyToClipboard = async () => {
    if (!profile) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const shareReferral = async () => {
    if (!profile) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WALKCOIN - Walk and Earn!',
          text: `Join me on WALKCOIN! Walk and earn crypto. Use my code: ${profile.referral_code}`,
          url: referralLink,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-crypto-card to-crypto-purple/10 border-crypto-purple/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Gift className="w-5 h-5 text-crypto-purple" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-xl bg-crypto-dark/50 border border-crypto-border">
          <p className="text-sm text-crypto-muted mb-3">
            Invite friends and earn <span className="text-crypto-gold font-bold">+100 WALK</span> per kilometer for each!
          </p>
          
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-crypto-purple" />
            <span className="text-white font-medium">
              {profile?.referral_count || 0} active referrals
            </span>
          </div>

          {profile?.referral_count && profile.referral_count > 0 ? (
            <div className="p-3 rounded-lg bg-crypto-green/10 border border-crypto-green/30">
              <p className="text-sm text-crypto-green">
                🎉 You earn +{(profile.referral_count * 100).toLocaleString()} bonus WALK per kilometer!
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-crypto-muted">Your referral code:</p>
          <div className="flex gap-2">
            <Input
              value={profile?.referral_code || '...'}
              readOnly
              className="bg-crypto-dark border-crypto-border text-crypto-gold font-mono text-center tracking-wider"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              className="border-crypto-border hover:bg-crypto-purple/20 hover:border-crypto-purple"
            >
              {copied ? (
                <Check className="w-4 h-4 text-crypto-green" />
              ) : (
                <Copy className="w-4 h-4 text-crypto-muted" />
              )}
            </Button>
          </div>
        </div>

        <Button
          onClick={shareReferral}
          className="w-full bg-gradient-to-r from-crypto-purple to-crypto-purple/80 hover:from-crypto-purple/90 hover:to-crypto-purple/70"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share with friends
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
