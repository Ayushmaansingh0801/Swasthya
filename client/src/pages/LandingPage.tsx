import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  HeartPulse,
  Pill,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TestTube2,
  Users,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [bedSummary, setBedSummary] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [triageResult, setTriageResult] = useState<any>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  useEffect(() => {
    api
      .get('/beds/summary')
      .then((res: any) => {
        if (res.success) setBedSummary(res.data);
      })
      .catch((err) => console.warn('Could not fetch bed summary:', err));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/hospitals?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleTriageCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomText.trim()) return;

    try {
      setTriageLoading(true);
      const res: any = await api.post('/ai/triage', { symptoms: symptomText });
      if (res.success) {
        setTriageResult(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Triage check failed');
    } finally {
      setTriageLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero pt-12 pb-20 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-300 text-teal-800 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Smart Rewa 2030 Healthcare Ecosystem
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Unified Healthcare Access & Real-Time Coordination
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed">
              Find verified hospitals, live reported ICU & oxygen beds, book OPD appointments, track generic medicines, and access AI-assisted medical summaries.
            </p>

            {/* Live Search Form */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-xl border border-slate-200">
                <div className="flex-1 flex items-center px-3 gap-2">
                  <Search className="w-5 h-5 text-teal-600 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hospitals, doctors, specialties or medicines..."
                    className="w-full py-2.5 text-sm sm:text-base outline-none bg-transparent placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all text-sm sm:text-base"
                >
                  Search Facilities
                </button>
              </div>
            </form>

            {/* Quick Filter Pills */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link to="/hospitals" className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-slate-700 border border-slate-200 hover:border-teal-500 hover:text-teal-700 shadow-2xs transition-all flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                ICU & Oxygen Beds
              </Link>
              <Link to="/doctors" className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-slate-700 border border-slate-200 hover:border-teal-500 hover:text-teal-700 shadow-2xs transition-all flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                Cardiology & OPD
              </Link>
              <Link to="/pharmacies" className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-slate-700 border border-slate-200 hover:border-teal-500 hover:text-teal-700 shadow-2xs transition-all flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                Jan Aushadhi Generics
              </Link>
              <Link to="/labs" className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-slate-700 border border-slate-200 hover:border-teal-500 hover:text-teal-700 shadow-2xs transition-all flex items-center gap-1.5">
                <TestTube2 className="w-3.5 h-3.5 text-teal-600" />
                Pathology Tests
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Reported Bed Availability Widget */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h2 className="text-lg font-bold text-slate-900">Hospital Bed Availability (Rewa Region)</h2>
              </div>
              <p className="text-xs text-slate-500">
                Facility-reported vacancy from Sanjay Gandhi Memorial & participating centers.
              </p>
            </div>
            <Link
              to="/hospitals"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 underline underline-offset-4 flex items-center gap-1"
            >
              View Detailed Ward Board &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {/* General Beds */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('bed.general')}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {bedSummary ? bedSummary.availableGeneral : 22}
                <span className="text-xs font-medium text-slate-400 ml-1">/ {bedSummary ? bedSummary.totalGeneral : 60} Total</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified Hospital-reported
              </div>
            </div>

            {/* ICU Beds */}
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
              <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">{t('bed.icu')}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-900 mt-1">
                {bedSummary ? bedSummary.availableICU : 6}
                <span className="text-xs font-medium text-teal-600/70 ml-1">/ {bedSummary ? bedSummary.totalICU : 24} Total</span>
              </div>
              <div className="mt-2 text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                <Activity className="w-3 h-3 text-teal-600" />
                Ventilator equipped
              </div>
            </div>

            {/* Oxygen Beds */}
            <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100">
              <div className="text-xs font-semibold text-sky-800 uppercase tracking-wider">{t('bed.oxygen')}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-900 mt-1">
                {bedSummary ? bedSummary.availableOxygen : 18}
                <span className="text-xs font-medium text-sky-600/70 ml-1">/ {bedSummary ? bedSummary.totalOxygen : 50} Total</span>
              </div>
              <div className="mt-2 text-[11px] text-sky-700 font-semibold flex items-center gap-1">
                <HeartPulse className="w-3 h-3 text-sky-600" />
                Central Manifold Line
              </div>
            </div>

            {/* Emergency Trauma */}
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
              <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider">{t('bed.emergency')}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-900 mt-1">
                {bedSummary ? bedSummary.availableEmergency : 5}
                <span className="text-xs font-medium text-rose-600/70 ml-1">/ {bedSummary ? bedSummary.totalEmergency : 20} Total</span>
              </div>
              <div className="mt-2 text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-600" />
                24x7 Emergency intake
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Symptom & Triage Safety Assistant Demonstration */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Bilingual AI Symptom & Triage Assistant
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold mt-4">
              Instant Symptom Guidance with Built-in Medical Safety Filters
            </h2>

            <p className="text-slate-300 text-sm sm:text-base mt-2">
              Our AI safety layer immediately intercepts medical emergencies (such as crushing chest pain, difficulty breathing, or stroke indicators) and redirects users to emergency services.
            </p>

            <form onSubmit={handleTriageCheck} className="mt-6 space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  placeholder="Describe symptoms in Hindi or English (e.g. 'Fever and throat pain since 2 days' or test emergency: 'Severe chest pain radiating to left arm')..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-400 text-sm focus:border-teal-400 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 italic">
                  *Informational guidance only. Does not replace professional clinical diagnosis.
                </div>
                <button
                  type="submit"
                  disabled={triageLoading}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
                >
                  {triageLoading ? 'Evaluating...' : 'Run Safety Triage'}
                </button>
              </div>
            </form>

            {/* Triage Output */}
            {triageResult && (
              <div
                className={`mt-6 p-5 rounded-2xl border ${
                  triageResult.isEmergency
                    ? 'bg-rose-950/80 border-rose-500 text-rose-100 animate-pulse'
                    : 'bg-teal-950/60 border-teal-500 text-teal-100'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                  {triageResult.isEmergency ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  )}
                  <span>
                    {triageResult.isEmergency
                      ? 'EMERGENCY RED-FLAG TRIGGERED'
                      : 'Recommended OPD: ' + triageResult.recommendedDepartment}
                  </span>
                </div>

                <div className="mt-2 text-sm leading-relaxed font-medium">
                  {triageResult.advice}
                </div>

                <div className="mt-2 text-xs opacity-90 border-t border-slate-700/50 pt-2 font-sans font-medium">
                  {triageResult.adviceHindi}
                </div>

                <div className="mt-3 text-[10px] text-slate-300 uppercase tracking-wider">
                  Disclaimer: {triageResult.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Role-based Healthcare Network Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            End-to-End Coordinated Network
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            23 specialized role workspaces built around patient safety, verified data feeds, and role-based access control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Patients & Families</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Self-register, manage dependents, view chronological health timeline, digital prescriptions, and consult AI for plain-language medical report explanations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Clinicians & Specialists</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              View authorized patient queues, generate visit notes with AI draft assistance, and create digital prescriptions with automated allergy conflict checks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hospital & Capacity Admins</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Manage live bed boards across ICU, oxygen and emergency wards, record updater timestamps, manage staff invitations, and view operational metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="font-bold text-white text-base">Swasthya AI Healthcare Ecosystem</div>
          <p className="max-w-xl mx-auto text-slate-400">
            Developed for prototype demonstration under the Smart Rewa 2030 Healthcare Vision. All data is synthetic and marked as demo.
          </p>
          <div className="text-slate-500 pt-4 border-t border-slate-800">
            &copy; 2026 Swasthya AI. Built with React, TypeScript, Node.js & Mongoose.
          </div>
        </div>
      </footer>
    </div>
  );
};
