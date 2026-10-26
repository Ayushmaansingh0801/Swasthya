import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  Pill,
  Plus,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TestTube2,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Appointment, MedicalRecord, Prescription, LabOrder } from '../../types';
import { Link } from 'react-router-dom';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'records' | 'prescriptions' | 'labs' | 'aiExplainer'>('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // AI Report Explainer State
  const [reportParamName, setReportParamName] = useState('Platelet Count');
  const [reportParamValue, setReportParamValue] = useState('110000');
  const [reportParamUnit, setReportParamUnit] = useState('/mcL');
  const [explainerResult, setExplainerResult] = useState<any>(null);
  const [explainerLoading, setExplainerLoading] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [apptsRes, recsRes, rxRes, labRes, meRes]: any = await Promise.all([
        api.get('/appointments'),
        api.get('/records'),
        api.get('/prescriptions'),
        api.get('/lab-orders'),
        api.get('/auth/me'),
      ]);

      if (apptsRes.success) setAppointments(apptsRes.data);
      if (recsRes.success) setRecords(recsRes.data);
      if (rxRes.success) setPrescriptions(rxRes.data);
      if (labRes.success) setLabOrders(labRes.data);
      if (meRes.success) setPatientProfile(meRes.profile);
    } catch (err) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res: any = await api.patch(`/appointments/${apptId}/status`, {
        status: 'cancelled',
        notes: 'Cancelled by patient',
      });
      if (res.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === apptId ? { ...a, status: 'cancelled' } : a))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const handleRunAiExplainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setExplainerLoading(true);
      const res: any = await api.post('/ai/explain-report', {
        parameters: [
          {
            name: reportParamName,
            value: reportParamValue,
            unit: reportParamUnit,
          },
        ],
      });
      if (res.success) {
        setExplainerResult(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Report explanation failed');
    } finally {
      setExplainerLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Patient Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-extrabold text-2xl shadow-inner">
            {user?.name.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{user?.name}</h1>
              <span className="badge-verified text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Patient
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span>{user?.email}</span>
              <span>&bull;</span>
              <span>Phone: {user?.phone || 'Not set'}</span>
              <span>&bull;</span>
              <span className="font-semibold text-slate-700">Blood Group: {patientProfile?.bloodGroup || 'B+'}</span>
            </div>

            {/* Recorded Allergies Warning */}
            {patientProfile?.allergies && patientProfile.allergies.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-flex">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Recorded Allergies: {patientProfile.allergies.join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/doctors"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            Book New Doctor
          </Link>
          <Link
            to="/hospitals"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <HeartPulse className="w-4 h-4 text-teal-600" />
            Check Live Beds
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-1 pb-px">
        {[
          { id: 'overview', label: 'Timeline & Overview', icon: Activity },
          { id: 'appointments', label: `Appointments (${appointments.filter(a => a.status !== 'cancelled').length})`, icon: Calendar },
          { id: 'records', label: `Clinical Records (${records.length})`, icon: FileText },
          { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: Pill },
          { id: 'labs', label: `Lab Reports (${labOrders.length})`, icon: TestTube2 },
          { id: 'aiExplainer', label: 'AI Report Explainer', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-all ${
                isActive
                  ? 'border-teal-600 text-teal-700 bg-teal-50/40 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Timeline & Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Health Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              Chronological Health Timeline
            </h2>

            {records.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No past consultations recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((rec) => (
                  <div
                    key={rec._id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {rec.type.replace(/_/g, ' ')}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{rec.title}</h3>
                        <div className="text-xs text-slate-500">
                          {new Date(rec.recordDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          &bull; Recorded by Dr. {rec.doctorId?.name || 'Practitioner'}
                        </div>
                      </div>
                    </div>

                    {rec.clinicalNotes && (
                      <div className="text-xs space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-slate-700">
                        <div>
                          <strong>Symptoms:</strong> {rec.clinicalNotes.symptoms}
                        </div>
                        <div>
                          <strong>Diagnosis:</strong> {rec.clinicalNotes.diagnosis}
                        </div>
                        <div>
                          <strong>Clinical Plan:</strong> {rec.clinicalNotes.plan}
                        </div>
                        {rec.clinicalNotes.followUpDate && (
                          <div className="text-teal-700 font-semibold pt-1">
                            Follow-up Due: {rec.clinicalNotes.followUpDate}
                          </div>
                        )}
                      </div>
                    )}

                    {rec.aiDraftSummary && (
                      <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900">
                        <div className="flex items-center gap-1 font-bold text-[11px] text-teal-800 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          Clinician-Reviewed AI Summary
                        </div>
                        <p className="italic text-[11px] leading-relaxed">{rec.aiDraftSummary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Dependents & Quick Contacts */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Family & Dependents
            </h2>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              {patientProfile?.dependents && patientProfile.dependents.length > 0 ? (
                patientProfile.dependents.map((dep: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="font-bold text-slate-900">{dep.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      Relation: {dep.relation} &bull; Gender: {dep.gender || 'Not specified'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No family members registered.</div>
              )}
            </div>

            {/* Emergency Contacts */}
            <div className="bg-rose-50 rounded-2xl p-5 border border-rose-200 shadow-2xs space-y-2">
              <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Emergency Contact
              </div>
              <div className="text-xs text-rose-800">
                <div><strong>Name:</strong> {patientProfile?.emergencyContact?.name || 'Sunita Verma'}</div>
                <div><strong>Phone:</strong> {patientProfile?.emergencyContact?.phone || '+91 98260 99887'}</div>
                <div><strong>Relation:</strong> {patientProfile?.emergencyContact?.relation || 'Mother'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your Doctor Appointments</h2>
            <Link
              to="/doctors"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 underline"
            >
              + Book Another Appointment
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No appointments found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((appt) => (
                <div
                  key={appt._id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        appt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {appt.status}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        Token #{appt.tokenNumber} &bull; {appt.timeSlot}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Date: <strong>{appt.appointmentDate}</strong>
                      </div>
                    </div>
                    {appt.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelAppointment(appt._id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 hover:bg-rose-50 rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div><strong>Doctor:</strong> {appt.doctorId?.userId?.name || 'Dr. Specialist'}</div>
                    <div><strong>Hospital/Clinic:</strong> {appt.organizationId?.name}</div>
                    <div><strong>Reason:</strong> {appt.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Digital Prescriptions</h2>
          {prescriptions.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No prescriptions recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx._id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                        {rx.status}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        Diagnosis: {rx.diagnosis}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Prescribed by: {rx.doctorId?.name} &bull; {new Date(rx.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Medicines Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-3.5 py-2">Medicine</th>
                          <th className="px-3.5 py-2">Dosage</th>
                          <th className="px-3.5 py-2">Schedule</th>
                          <th className="px-3.5 py-2">Duration</th>
                          <th className="px-3.5 py-2">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rx.medicines.map((med, idx) => (
                          <tr key={idx}>
                            <td className="px-3.5 py-2.5 font-bold text-slate-900">{med.name}</td>
                            <td className="px-3.5 py-2.5 text-slate-600">{med.dosage}</td>
                            <td className="px-3.5 py-2.5 font-semibold text-teal-700">{med.frequency}</td>
                            <td className="px-3.5 py-2.5 text-slate-600">{med.duration}</td>
                            <td className="px-3.5 py-2.5 text-slate-500">{med.instructions || 'After food'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rx.advice && (
                    <div className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Clinician Advice:</strong> {rx.advice}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Diagnostic Lab Reports (Authorized Release Gating Test) */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Diagnostic Pathology Reports</h2>
          {labOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No lab tests recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {labOrders.map((order) => {
                const isReleased = order.isReleasedToPatient;
                return (
                  <div
                    key={order._id}
                    className={`bg-white rounded-2xl p-6 border shadow-2xs space-y-4 ${
                      isReleased ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isReleased
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {isReleased ? 'Released & Verified' : 'Under Lab Review (Not Released)'}
                          </span>
                          <span className="text-xs font-mono text-slate-500">Sample: {order.sampleId}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{order.testName}</h3>
                        <div className="text-xs text-slate-500">
                          {order.organizationId?.name} &bull; Sample Status: <strong className="capitalize">{order.sampleStatus}</strong>
                        </div>
                      </div>

                      {isReleased && (
                        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Authorized Report
                        </div>
                      )}
                    </div>

                    {/* RELEASE GATING CHECK */}
                    {!isReleased ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-700" />
                          Report Results Withheld
                        </div>
                        <p>{order.reportStatusNotice || 'This diagnostic test is currently being processed and validated by the pathologist. Results will become viewable once authorized.'}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="px-3.5 py-2">Parameter</th>
                                <th className="px-3.5 py-2">Measured Value</th>
                                <th className="px-3.5 py-2">Unit</th>
                                <th className="px-3.5 py-2">Standard Range</th>
                                <th className="px-3.5 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {order.results.map((res, i) => (
                                <tr key={i}>
                                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{res.parameter}</td>
                                  <td className="px-3.5 py-2.5 font-extrabold text-teal-800">{res.value}</td>
                                  <td className="px-3.5 py-2.5 text-slate-500">{res.unit}</td>
                                  <td className="px-3.5 py-2.5 text-slate-600">{res.referenceRange}</td>
                                  <td className="px-3.5 py-2.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        res.isAbnormal
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-emerald-50 text-emerald-700'
                                      }`}
                                    >
                                      {res.isAbnormal ? 'Attention' : 'Normal'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {order.aiExplanation && (
                          <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900 space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-teal-800 text-[11px]">
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              AI Plain Language Report Summary
                            </div>
                            <p>{order.aiExplanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: AI Report Explainer Interactive Tool */}
      {activeTab === 'aiExplainer' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Patient Educational AI Assistant
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Understand Your Laboratory Findings in Simple Terms
            </h2>
            <p className="text-xs text-slate-500">
              Enter test names and values from your paper or digital report to receive immediate bilingual (Hindi/English) explanations.
            </p>
          </div>

          <form onSubmit={handleRunAiExplainer} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Test Parameter</label>
              <input
                type="text"
                required
                value={reportParamName}
                onChange={(e) => setReportParamName(e.target.value)}
                placeholder="e.g. Hemoglobin, Platelets, Fasting Blood Sugar"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Measured Value</label>
              <input
                type="text"
                required
                value={reportParamValue}
                onChange={(e) => setReportParamValue(e.target.value)}
                placeholder="e.g. 11.2, 110000, 135"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                value={reportParamUnit}
                onChange={(e) => setReportParamUnit(e.target.value)}
                placeholder="g/dL, mg/dL, /mcL"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={explainerLoading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {explainerLoading ? 'Analyzing...' : 'Explain Results'}
              </button>
            </div>
          </form>

          {explainerResult && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-900 space-y-2">
                <div className="font-bold text-sm text-teal-950">English Clinical Overview:</div>
                <p className="text-xs leading-relaxed">{explainerResult.summary}</p>
                <div className="font-bold text-sm text-teal-950 pt-2 border-t border-teal-200/60">
                  हिंदी व्याख्या (Hindi Explanation):
                </div>
                <p className="text-xs leading-relaxed font-sans">{explainerResult.summaryHindi}</p>
              </div>

              {/* Key parameter breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Detailed Findings:</h4>
                {explainerResult.keyFindings.map((finding: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl border bg-white border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{finding.parameter}: {finding.value}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          finding.status === 'normal'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {finding.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-700">{finding.explanation}</div>
                    <div className="text-slate-500 text-[11px] font-sans">{finding.explanationHindi}</div>
                  </div>
                ))}
              </div>

              {/* Suggested Questions */}
              {explainerResult.suggestedQuestionsForDoctor && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800">Suggested Questions to Ask Your Doctor:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {explainerResult.suggestedQuestionsForDoctor.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-[10px] text-slate-400 italic text-center">
                Disclaimer: {explainerResult.disclaimer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
