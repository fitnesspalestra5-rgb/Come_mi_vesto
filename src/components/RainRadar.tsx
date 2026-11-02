import { ExternalLink, Radar } from 'lucide-react';

const RADAR_URL = 'https://mappe.protezionecivile.gov.it/it/mappe-e-dashboard-rischi/piattaforma-radar';

export function RainRadar() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Radar size={18} className="text-terracotta-600" />
          <h2 className="font-display text-lg text-cream-900">Radar piogge</h2>
        </div>
        <a
          href={RADAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-terracotta-700 hover:text-terracotta-800 transition"
        >
          Schermo intero <ExternalLink size={13} />
        </a>
      </div>
      <p className="text-xs text-cream-600 mb-3">Mappa ufficiale Radar-DPC del Dipartimento della Protezione Civile, aggiornata ogni 5 minuti.</p>
      <div className="rounded-xl overflow-hidden border border-cream-200 bg-cream-100 aspect-[4/3]">
        <iframe
          src={RADAR_URL}
          title="Radar piogge Protezione Civile"
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
