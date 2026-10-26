import React, { useState } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const DemoBanner: React.FC = () => {
  const { t, lang } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between border-b border-amber-600 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 md:gap-4 text-center">
        <span className="inline-flex items-center gap-1 font-bold bg-amber-950 text-amber-200 px-2 py-0.5 rounded text-[11px] uppercase tracking-wide">
          <ShieldAlert className="w-3.5 h-3.5" />
          {t('demo.badge')}
        </span>
        <span className="text-slate-900 font-medium">
          {t('demo.disclaimer')}
        </span>
        <a
          href="tel:112"
          className="inline-flex items-center gap-1 bg-rose-700 hover:bg-rose-800 text-white font-bold px-2.5 py-0.5 rounded shadow-sm transition-colors"
        >
          <PhoneCall className="w-3 h-3" />
          Emergency: 112 / 108
        </a>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-950 hover:text-black p-1 transition-colors"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
