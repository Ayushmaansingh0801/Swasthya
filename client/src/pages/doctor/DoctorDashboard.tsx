import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Pill,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Appointment } from '../../types';

export const DoctorDashboard: React.FC = () => {
  const { user, activeWorkspace } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Patient & Consultation State
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [examination, setExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [plan, setPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  // Prescription State
  const [medicines, setMedicines] = useState<Array<{ name: string; genericName: string; dosage: string; frequency: string; duration: string; instructions: string }>>([
    { name: '', genericName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' },
  ]);
  const [rxSuccess, setRxSuccess] = useState<any>(null);
  const [rxAllergyWarning, setRxAllergyWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [activeWorkspace]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/appointments');
      if (res.success) {
        setAppointments(res.data);
        if (res.data.length > 0 && !selectedAppt) {
          setSelectedAppt(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (apptId: string, status: string) => {
    try {
      const res: any = await api.patch(`/appointments/${apptId}/status`, { status });
      if (res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === apptId ? { ...a, status: status as any } : a))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleGenerateAiDraft = async () => {
    try {
      setDraftLoading(true);
      const res: any = await api.post('/records/ai-draft', {
        symptoms,
        examination,
        diagnosis,
        plan,
      });
      if (res.success) {
        setAiDraft(res.draft);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI draft');
    } finally {
      setDraftLoading(false);
    }
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    try {
      setSavingNote(true);
      const res: any = await api.post('/records', {
        patientId: selectedAppt.patientId._id,
        type: 'visit_note',
        title: `OPD Consultation - ${diagnosis || 'General Checkup'}`,
        clinicalNotes: {
          symptoms,
          examination,
          diagnosis,
          plan,
          followUpDate,
        },
        aiDraftSummary: aiDraft,
        aiApprovedByDoctor: !!aiDraft,
      });

      if (res.success) {
        setNoteSuccess(true);
        setTimeout(() => setNoteSuccess(false), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleAddMedicineRow = () => {
    setMedicines([...medicines, { name: '', genericName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After food' }]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    try {
      setRxAllergyWarning(null);
      const validMeds = medicines.filter((m) => m.name.trim() !== '');
      if (validMeds.length === 0) {
        alert('Please add at least one medicine.');
        return;
      }

      const res: any = await api.post('/prescriptions', {
        patientId: selectedAppt.patientId._id,
        appointmentId: selectedAppt._id,
        diagnosis: diagnosis || 'Clinical Management',
        medicines: validMeds,
        advice: plan,
        followUpDate,
      });

      if (res.success) {
        setRxSuccess(res.data);
        if (res.allergyWarningTriggered) {
          setRxAllergyWarning(res.allergyDetails);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate prescription');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Clinician Workspace Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">{user?.name}</h1>
            <span className="badge-verified text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Clinician
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Active Workspace:{' '}
            <strong className="text-slate-800">
              {activeWorkspace ? activeWorkspace.organizationName : 'Independent Private Practice'}
            </strong>{' '}
            &bull; Role: {user?.role.replace(/_/g, ' ')}
          </div>
        </div>

        <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-teal-900 text-xs font-semibold">
          Active OPD Queue: {appointments.filter((a) => a.status === 'confirmed').length} waiting
        </div>
      </div>

      {/* Main Grid: Queue on left, Consultation Suite on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600" />
              Today's Consultation Queue
            </h2>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {appointments.length} Scheduled
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading queue...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No appointments scheduled today.</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {appointments.map((appt) => {
                const isSelected = selectedAppt?._id === appt._id;
                return (
                  <div
                    key={appt._id}
                    onClick={() => setSelectedAppt(appt)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/50 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Token #{appt.tokenNumber} &bull; {appt.patientId?.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize font-medium">
                        {appt.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-teal-600" />
                      <span>{appt.timeSlot}</span>
                      <span>&bull;</span>
                      <span className="truncate">{appt.reason}</span>
                    </div>

                    {/* Quick status actions */}
                    <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-slate-200/60" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStatusChange(appt._id, 'checked_in')}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded"
                      >
                        Check-in
                      </button>
                      <button
                        onClick={() => handleStatusChange(appt._id, 'completed')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusChange(appt._id, 'no_show')}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded"
                      >
                        No-show
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Consultation & Clinical Documentation */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAppt ? (
            <>
              {/* Selected Patient Banner */}
              <div className="bg-teal-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-teal-300 font-semibold uppercase tracking-wider">
                    Currently Examining
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selectedAppt.patientId?.name} (Token #{selectedAppt.tokenNumber})
                  </h3>
                  <div className="text-xs text-teal-200">
                    Slot: {selectedAppt.timeSlot} &bull; Stated Reason: {selectedAppt.reason}
                  </div>
                </div>

                <div className="text-xs font-semibold bg-teal-800/80 px-3 py-1.5 rounded-xl border border-teal-700">
                  Patient Phone: {selectedAppt.patientId?.phone || 'Not provided'}
                </div>
              </div>

              {/* Consultation Visit Notes Form */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Clinical Visit Notes
                  </h3>
                  {noteSuccess && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Note Saved!
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveConsultation} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Symptoms & History</label>
                      <textarea
                        rows={2}
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="e.g. Mild exertional dyspnea, occasional palpitations..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Examination Findings</label>
                      <textarea
                        rows={2}
                        value={examination}
                        onChange={(e) => setExamination(e.target.value)}
                        placeholder="e.g. BP 130/84, PR 76 regular, Chest clear, S1 S2 normal..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Working Diagnosis</label>
                      <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. Pre-hypertension, Allergic Rhinitis"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Date</label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Plan & Advice</label>
                    <textarea
                      rows={2}
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      placeholder="e.g. Dietary salt restriction, brisk walk 30 mins, review in 4 weeks..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* AI Documentation Helper Button */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        AI Documentation Helper
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateAiDraft}
                        disabled={draftLoading}
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                      >
                        {draftLoading ? 'Drafting...' : 'Draft Summary'}
                      </button>
                    </div>

                    {aiDraft && (
                      <div className="space-y-1 pt-2">
                        <textarea
                          rows={3}
                          value={aiDraft}
                          onChange={(e) => setAiDraft(e.target.value)}
                          className="w-full p-2.5 bg-white border border-teal-300 rounded-lg text-xs font-mono text-slate-800"
                        />
                        <div className="text-[10px] text-slate-500 italic">
                          *Clinician must review and edit this draft before signing.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <button
                      type="submit"
                      disabled={savingNote}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                    >
                      {savingNote ? 'Saving...' : 'Sign & Save Clinical Note'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Digital Prescription Generator with Live Allergy Conflict Warning */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Pill className="w-5 h-5 text-teal-600" />
                    Digital Prescription Generator
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </button>
                </div>

                {rxAllergyWarning && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2 animate-pulse">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{rxAllergyWarning}</span>
                  </div>
                )}

                {rxSuccess && !rxAllergyWarning && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Prescription issued successfully and transmitted to pharmacy network.</span>
                  </div>
                )}

                <form onSubmit={handleSavePrescription} className="space-y-3">
                  <div className="space-y-2">
                    {medicines.map((med, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            placeholder="Medicine Name (e.g. Telmisartan 40mg)"
                            value={med.name}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx].name = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Dosage (40mg)"
                            value={med.dosage}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx].dosage = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Freq (1-0-1)"
                            value={med.frequency}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx].frequency = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                          />
                        </div>

                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Instructions (After food)"
                            value={med.instructions}
                            onChange={(e) => {
                              const updated = [...medicines];
                              updated[idx].instructions = e.target.value;
                              setMedicines(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                          />
                        </div>

                        <div className="col-span-1 flex items-center justify-center">
                          {medicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicineRow(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-right pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                    >
                      Issue Digital Prescription
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
              Please select a patient from today's queue to begin consultation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
