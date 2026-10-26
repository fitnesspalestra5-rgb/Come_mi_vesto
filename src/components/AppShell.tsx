import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { BottomNav } from '@/components/BottomNav';
import { HomePage } from '@/pages/HomePage';
import { GuardarobaPage } from '@/pages/GuardarobaPage';
import { OutfitPage } from '@/pages/OutfitPage';
import { ColoriPage } from '@/pages/ColoriPage';
import { MeteoPage } from '@/pages/MeteoPage';
import { PreferitiPage } from '@/pages/PreferitiPage';
import { BG } from '@/lib/backgrounds';

export function AppShell() {
  const { route, navigate } = useRouter();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-warm">
      <div className="max-w-2xl mx-auto min-h-screen relative bg-cream-50/60">
        {route !== 'home' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <img src={BG.internal} alt="" className="w-full h-full object-cover opacity-[0.16]" />
            <div className="absolute inset-0 bg-cream-50/60" />
          </div>
        )}
        <div className="relative z-10 flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-1">
          <button onClick={() => navigate('home')} className="font-display text-lg font-semibold text-terracotta-700">
            Come mi vesto?
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-cream-600 truncate max-w-[140px]">{user?.email}</span>
            <button onClick={signOut} className="p-2 rounded-lg text-cream-600 hover:bg-cream-100" aria-label="Esci">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <main className="relative z-10 pb-24">
          {route === 'home' && <HomePage />}
          {route === 'guardaroba' && <GuardarobaPage />}
          {route === 'outfit' && <OutfitPage />}
          {route === 'colori' && <ColoriPage />}
          {route === 'meteo' && <MeteoPage />}
          {route === 'preferiti' && <PreferitiPage />}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
