// Integrazione meteo con Open-Meteo (gratuito, senza chiave API).
// Se il servizio non risponde, l'UI mostra un avviso e non inventa previsioni.

export interface WeatherData {
  city: string;
  temperature: number;
  apparentTemperature: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  description: string;
  isDay: boolean;
  high: number;
  low: number;
}

export async function geocodeCity(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const q = encodeURIComponent(city.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=it&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data?.results?.[0];
    if (!hit) return null;
    return { lat: hit.latitude, lon: hit.longitude, name: hit.name };
  } catch {
    return null;
  }
}

export async function fetchWeather(lat: number, lon: number, name: string): Promise<WeatherData | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code,is_day` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const cur = data?.current;
    if (!cur) return null;
    return {
      city: name,
      temperature: Math.round(cur.temperature_2m),
      apparentTemperature: Math.round(cur.apparent_temperature),
      windSpeed: Math.round(cur.wind_speed_10m),
      precipitation: cur.precipitation ?? 0,
      weatherCode: cur.weather_code,
      description: weatherDescription(cur.weather_code),
      isDay: cur.is_day === 1,
      high: Math.round(data?.daily?.temperature_2m_max?.[0] ?? cur.temperature_2m),
      low: Math.round(data?.daily?.temperature_2m_min?.[0] ?? cur.temperature_2m),
    };
  } catch {
    return null;
  }
}

export async function getWeatherForCity(city: string): Promise<WeatherData | null> {
  const geo = await geocodeCity(city);
  if (!geo) return null;
  return fetchWeather(geo.lat, geo.lon, geo.name);
}

export function weatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: 'Cielo sereno',
    1: 'Prevalentemente sereno',
    2: 'Parzialmente nuvoloso',
    3: 'Coperto',
    45: 'Nebbia',
    48: 'Nebbia con brina',
    51: 'Pioviggine leggera',
    53: 'Pioviggine moderata',
    55: 'Pioviggine intensa',
    61: 'Pioggia leggera',
    63: 'Pioggia moderata',
    65: 'Pioggia forte',
    71: 'Neve leggera',
    73: 'Neve moderata',
    75: 'Neve intensa',
    80: 'Rovesci leggeri',
    81: 'Rovesci moderati',
    82: 'Rovesci violenti',
    95: 'Temporale',
    96: 'Temporale con grandine leggera',
    99: 'Temporale con grandine forte',
  };
  return map[code] ?? 'Condizioni variabili';
}

// Suggerimento abbigliamento in base alla temperatura
export function dressingAdvice(w: WeatherData): string[] {
  const tips: string[] = [];
  const t = w.apparentTemperature;
  if (t <= 5) tips.push('Cappotto pesante, sciarpa e guanti. Strati termici.');
  else if (t <= 12) tips.push('Giacca o cappotto leggero, maglione.');
  else if (t <= 18) tips.push('Cardigan o giacca leggera, maglia a maniche lunghe.');
  else if (t <= 25) tips.push('Maglia leggera, pantaloni o gonna, scarpe comode.');
  else tips.push('Tessuti leggeri e traspiranti, colori chiari, cappello per il sole.');

  if (w.precipitation > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(w.weatherCode)) {
    tips.push('Porta un ombrello o una giacca impermeabile.');
  }
  if (w.windSpeed > 25) tips.push('Vento forte: evita abiti ampi e scegli tessuti pesanti.');
  return tips;
}
