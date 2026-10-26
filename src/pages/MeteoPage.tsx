import { useState } from 'react';
import { Cloud, Search, MapPin, CloudRain, Wind, Sun, Thermometer } from 'lucide-react';
import { PageHeader, EmptyState, Banner } from '@/components/ui';
import { getWeatherForCity, dressingAdvice, type WeatherData } from '@/lib/weather';
import { Spinner } from '@/components/ui';

export function MeteoPage() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    setWeather(null);
    try {
      const data = await getWeatherForCity(city);
      if (!data) {
        setError('Città non trovata o servizio meteo non raggiungibile. Riprova tra poco.');
      } else {
        setWeather(data);
      }
    } catch {
      setError('Impossibile recuperare le previsioni. Verifica la connessione.');
    } finally {
      setLoading(false);
    }
  };

  const useGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non disponibile su questo dispositivo.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { fetchWeather } = await import('@/lib/weather');
          const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude, 'La tua posizione');
          if (!data) setError('Non sono riuscito a recuperare il meteo per la tua posizione.');
          else { setWeather(data); setCity(data.city); }
        } catch {
          setError('Errore nel recupero del meteo.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Permesso di localizzazione negato. Inserisci una città manualmente.');
        setLoading(false);
      }
    );
  };

  const tips = weather ? dressingAdvice(weather) : [];

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Meteo" subtitle="Come vestirsi oggi, in base alle condizioni reali" />

      <div className="max-w-2xl mx-auto w-full px-5 space-y-5">
        <form onSubmit={search} className="card p-4">
          <div className="relative mb-3">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-500" />
            <input className="input pl-10" value={city} onChange={(e) => setCity(e.target.value)} placeholder="es. Milano, Roma, Bari…" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              <Cloud size={16} /> Cerca
            </button>
            <button type="button" onClick={useGeolocation} disabled={loading} className="btn-secondary">
              <MapPin size={16} /> Posizione
            </button>
          </div>
        </form>

        {loading && <Spinner label="Recupero previsioni…" />}

        {error && <Banner tone="warn">{error}</Banner>}

        {weather && (
          <div className="card p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-cream-600">{weather.city}</p>
                <p className="text-4xl font-display font-semibold text-cream-900">{weather.temperature}°</p>
                <p className="text-sm text-cream-700">{weather.description}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-warm flex items-center justify-center text-terracotta-600">
                {weather.precipitation > 0 ? <CloudRain size={30} /> : weather.isDay ? <Sun size={30} /> : <Cloud size={30} />}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <Metric icon={<Thermometer size={15} />} label="Percepita" value={`${weather.apparentTemperature}°`} />
              <Metric icon={<Sun size={15} />} label="Max / Min" value={`${weather.high}° / ${weather.low}°`} />
              <Metric icon={<Wind size={15} />} label="Vento" value={`${weather.windSpeed} km/h`} />
            </div>

            <div className="rounded-xl bg-olive-50 p-4">
              <h3 className="font-display text-base text-olive-800 mb-2">Come vestirsi oggi</h3>
              <ul className="space-y-2">
                {tips.map((t, i) => (
                  <li key={i} className="text-sm text-olive-800 flex gap-2">
                    <span className="text-oliva-500 mt-0.5">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!weather && !loading && !error && (
          <EmptyState icon={<Cloud size={28} />} title="Cerca una città" hint="Inserisci il nome di una città o usa la tua posizione per ricevere consigli su come vestirti." />
        )}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-cream-100 p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-cream-600 text-[10px] uppercase tracking-wide mb-0.5">{icon} {label}</div>
      <p className="text-sm font-medium text-cream-900">{value}</p>
    </div>
  );
}
