import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Coins, Mail, Lock, UserPlus, LogIn, Sparkles, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email({ message: "Email nije validan" }),
  password: z.string().min(6, { message: "Lozinka mora imati minimalno 6 karaktera" }),
});

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Dobrodošli natrag!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: referralCode ? { referral_code: referralCode } : undefined,
          },
        });
        if (error) throw error;
        toast.success('Račun kreiran! Možete se prijaviti.');
      }
    } catch (error: any) {
      if (error.message?.includes('User already registered')) {
        toast.error('Korisnik s ovim emailom već postoji');
      } else if (error.message?.includes('Invalid login credentials')) {
        toast.error('Pogrešan email ili lozinka');
      } else {
        toast.error(error.message || 'Greška pri autentifikaciji');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crypto-dark flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-crypto-gold/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-crypto-green/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-crypto-purple/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-crypto-gold to-crypto-gold/60 shadow-2xl shadow-crypto-gold/20 mb-4">
            <Coins className="w-12 h-12 text-crypto-dark" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            WALK<span className="text-crypto-gold">COIN</span>
          </h1>
          <p className="text-crypto-muted">Hodaj. Zarađuj. Rastu tvoji coini.</p>
        </div>

        {/* Stats preview */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-md w-full">
          <div className="text-center p-4 rounded-xl bg-crypto-card/50 border border-crypto-border">
            <TrendingUp className="w-6 h-6 text-crypto-green mx-auto mb-2" />
            <p className="text-sm text-crypto-muted">100 WALK</p>
            <p className="text-xs text-crypto-muted/60">po kilometru</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-crypto-card/50 border border-crypto-border">
            <Sparkles className="w-6 h-6 text-crypto-gold mx-auto mb-2" />
            <p className="text-sm text-crypto-muted">Level Up</p>
            <p className="text-xs text-crypto-muted/60">svaki km</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-crypto-card/50 border border-crypto-border">
            <Users className="w-6 h-6 text-crypto-purple mx-auto mb-2" />
            <p className="text-sm text-crypto-muted">+100 WALK</p>
            <p className="text-xs text-crypto-muted/60">po referalu</p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="w-full max-w-md bg-crypto-card/80 backdrop-blur-xl border-crypto-border">
          <CardHeader className="text-center pb-2">
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? 'Prijavi se' : 'Kreiraj račun'}
            </h2>
            <p className="text-crypto-muted text-sm">
              {isLogin ? 'Nastavi skupljati WALK Coins' : 'Započni svoju crypto fitness avanturu'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-crypto-muted" />
                  <Input
                    type="email"
                    placeholder="Email adresa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-crypto-dark border-crypto-border text-white placeholder:text-crypto-muted/50 focus:border-crypto-gold focus:ring-crypto-gold/20"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-crypto-muted" />
                  <Input
                    type="password"
                    placeholder="Lozinka"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-crypto-dark border-crypto-border text-white placeholder:text-crypto-muted/50 focus:border-crypto-gold focus:ring-crypto-gold/20"
                    required
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-crypto-muted" />
                    <Input
                      type="text"
                      placeholder="Referral kod (opcionalno)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="pl-10 bg-crypto-dark border-crypto-border text-white placeholder:text-crypto-muted/50 focus:border-crypto-purple focus:ring-crypto-purple/20"
                    />
                  </div>
                  <p className="text-xs text-crypto-muted/60">
                    Imaš referral kod? Unesi ga za bonus!
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-crypto-gold to-crypto-gold/80 text-crypto-dark font-bold py-6 hover:from-crypto-gold/90 hover:to-crypto-gold/70 transition-all shadow-lg shadow-crypto-gold/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-crypto-dark/30 border-t-crypto-dark rounded-full animate-spin" />
                    Učitavanje...
                  </span>
                ) : isLogin ? (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Prijavi se
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Kreiraj račun
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-crypto-muted hover:text-crypto-gold transition-colors text-sm"
              >
                {isLogin ? (
                  <>Nemaš račun? <span className="text-crypto-gold font-medium">Registriraj se</span></>
                ) : (
                  <>Već imaš račun? <span className="text-crypto-gold font-medium">Prijavi se</span></>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-crypto-muted/50 text-xs text-center">
          Hodaj više, zarađuj više. Svaki korak se isplati! 🚀
        </p>
      </div>
    </div>
  );
};

export default Auth;
