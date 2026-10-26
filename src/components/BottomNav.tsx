import { Home, Shirt, Sparkles, Heart, Cloud, Palette } from 'lucide-react';
import { useRouter, type Route } from '@/lib/router';

const ITEMS: { route: Route; label: string; icon: typeof Home }[] = [
  { route: 'home', label: 'Home', icon: Home },
  { route: 'guardaroba', label: 'Guardaroba', icon: Shirt },
  { route: 'outfit', label: 'Outfit', icon: Sparkles },
  { route: 'colori', label: 'Colori', icon: Palette },
  { route: 'meteo', label: 'Meteo', icon: Cloud },
  { route: 'preferiti', label: 'Preferiti', icon: Heart },
];

export function BottomNav() {
  const { route, navigate } = useRouter();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-cream-50/90 backdrop-blur-md border-t border-cream-200">
      <div className="max-w-2xl mx-auto grid grid-cols-6 px-1 py-1.5">
        {ITEMS.map(({ route: r, label, icon: Icon }) => {
          const active = route === r;
          return (
            <button
              key={r}
              onClick={() => navigate(r)}
              className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all ${
                active ? 'text-terracotta-600' : 'text-cream-600 hover:text-cream-800'
              }`}
              aria-label={label}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
