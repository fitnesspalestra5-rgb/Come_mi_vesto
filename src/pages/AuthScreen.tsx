import { useState } from 'react';
import { Shirt, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { BG } from '@/lib/backgrounds';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) setError(error);
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <img src={BG.welcome} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overlay-scrim" />

      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-10 pt-[calc(4rem+env(safe-area-inset-top))] max-w-md mx-auto w-full">
        <div className="mb-8 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-cream-50/90 backdrop-blur flex items-center justify-center mb-5 shadow-card">
            <Shirt className="text-terracotta-600" size={28} />
          </div>
          <h1 className="text-4xl font-display font-semibold text-cream-50 text-shadow-soft leading-tight">
            Come mi vesto?
          </h1>
          <p className="text-cream-100 mt-2 text-shadow-soft max-w-xs">
            Il tuo stylist personale: fotografa i capi, scopri abbinamenti e crea outfit per ogni occasione.
          </p>
        </div>

        <div className="card p-6 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="flex gap-2 mb-5 bg-cream-100 rounded-full p-1">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                mode === 'signup' ? 'bg-cream-50 text-cream-900 shadow-soft' : 'text-cream-600'
              }`}
            >
              Crea account
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                mode === 'signin' ? 'bg-cream-50 text-cream-900 shadow-soft' : 'text-cream-600'
              }`}
            >
              Accedi
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="almeno 6 caratteri"
                  className="input pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-cream-500 hover:text-cream-800 hover:bg-cream-100 transition"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-terracotta-700 bg-terracotta-50 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Attendi…' : mode === 'signin' ? 'Accedi' : 'Inizia ora'}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-xs text-cream-600 text-center mt-4">
            I tuoi capi sono privati e visibili solo a te.
          </p>
        </div>
      </div>
    </div>
  );
}
