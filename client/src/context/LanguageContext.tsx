import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation & Brand
  'app.name': { en: 'Swasthya AI', hi: 'स्वास्थ्य AI' },
  'app.tagline': { en: 'Unified Healthcare Coordination Platform', hi: 'एकीकृत स्वास्थ्य समन्वय मंच' },
  'nav.findCare': { en: 'Find Care', hi: 'स्वास्थ्य सेवाएं ढूंढें' },
  'nav.hospitals': { en: 'Hospitals & Beds', hi: 'अस्पताल एवं बेड' },
  'nav.doctors': { en: 'Doctors & OPD', hi: 'डॉक्टर एवं ओपीडी' },
  'nav.pharmacies': { en: 'Pharmacies', hi: 'दवा दुकानें' },
  'nav.labs': { en: 'Diagnostic Labs', hi: 'डायग्नोस्टिक लैब' },
  'nav.emergency': { en: 'Emergency 112/108', hi: 'आपातकालीन 112/108' },
  'nav.signIn': { en: 'Sign In', hi: 'लॉग इन' },
  'nav.register': { en: 'Register', hi: 'रजिस्टर' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.logout': { en: 'Logout', hi: 'लॉग आउट' },

  // General Status & Warnings
  'demo.badge': { en: 'DEMO / PROTOTYPE ENVIRONMENT', hi: 'डेमो / प्रोटोटाइप वातावरण' },
  'demo.disclaimer': {
    en: 'All data shown is simulated for demonstration. In a medical emergency, call 112 / 108 immediately.',
    hi: 'प्रदर्शित सभी डेटा परीक्षण के लिए सिम्युलेटेड है। चिकित्सीय आपात स्थिति में तुरंत 112 / 108 पर कॉल करें।',
  },
  'stale.warning': { en: 'Stale Data: Not updated in >12 hours', hi: 'पुराना डेटा: >12 घंटे से अपडेट नहीं हुआ' },
  'verified.badge': { en: 'Verified Facility', hi: 'सत्यापित सुविधा' },
  'pending.badge': { en: 'Verification Pending', hi: 'सत्यापन लंबित' },

  // Patient Actions
  'patient.bookAppt': { en: 'Book Appointment', hi: 'अपॉइंटमेंट बुक करें' },
  'patient.timeline': { en: 'Health Timeline', hi: 'स्वास्थ्य समयरेखा' },
  'patient.records': { en: 'Medical Records', hi: 'मेडिकल रिकॉर्ड' },
  'patient.prescriptions': { en: 'Prescriptions', hi: 'प्रिस्क्रिप्शन' },
  'patient.aiTriage': { en: 'AI Symptom Check', hi: 'AI लक्षण जांच' },
  'patient.aiReport': { en: 'AI Report Explainer', hi: 'AI रिपोर्ट व्याख्याकार' },

  // Bed Categories
  'bed.general': { en: 'General Ward', hi: 'सामान्य वार्ड' },
  'bed.icu': { en: 'ICU / Ventilator', hi: 'आईसीयू / वेंटिलेटर' },
  'bed.emergency': { en: 'Emergency Trauma', hi: 'इमरजेंसी ट्रॉमा' },
  'bed.oxygen': { en: 'Oxygen Supported', hi: 'ऑक्सीजन युक्त' },
  'bed.available': { en: 'Available', hi: 'उपलब्ध' },
  'bed.occupied': { en: 'Occupied', hi: 'भरे हुए' },
  'bed.total': { en: 'Total Capacity', hi: 'कुल क्षमता' },

  // Doctor & Clinical
  'doctor.specialty': { en: 'Specialty', hi: 'विशेषज्ञता' },
  'doctor.fee': { en: 'Consultation Fee', hi: 'परामर्श शुल्क' },
  'doctor.schedule': { en: 'OPD Timings', hi: 'ओपीडी समय' },
  'doctor.queue': { en: "Today's Patient Queue", hi: 'आज के मरीज' },
  'doctor.draftAi': { en: 'Generate AI Clinical Summary Draft', hi: 'AI ड्राफ्ट सारांश तैयार करें' },

  // AI & Safety
  'ai.disclaimer': {
    en: 'AI is an informational assistant and does not provide medical diagnoses or prescriptions. Always consult a certified clinician.',
    hi: 'AI एक सूचनात्मक सहायक है और चिकित्सीय निदान या प्रिस्क्रिप्शन नहीं देता। हमेशा प्रमाणित डॉक्टर से परामर्श लें।',
  },
  'ai.emergencyRedFlag': {
    en: 'POTENTIAL MEDICAL EMERGENCY DETECTED',
    hi: 'संभावित चिकित्सीय आपात स्थिति पाई गई',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('swasthya_lang') as Language) || 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('swasthya_lang', newLang);
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
