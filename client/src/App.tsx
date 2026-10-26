import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DirectoryHospitalsPage } from './pages/DirectoryHospitalsPage';
import { DirectoryDoctorsPage } from './pages/DirectoryDoctorsPage';
import { DirectoryPharmaciesPage } from './pages/DirectoryPharmaciesPage';
import { DirectoryLabsPage } from './pages/DirectoryLabsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

// Dashboards
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { HospitalAdminDashboard } from './pages/hospital/HospitalAdminDashboard';
import { ReceptionistDashboard } from './pages/receptionist/ReceptionistDashboard';
import { PharmacyDashboard } from './pages/pharmacy/PharmacyDashboard';
import { LabDashboard } from './pages/lab/LabDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center py-20 text-slate-400">Verifying session security...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            {/* Top Demo Disclaimer & Emergency Helpline */}
            <DemoBanner />

            {/* Main Navigation Bar */}
            <Navbar />

            {/* Application Views */}
            <main className="flex-1">
              <Routes>
                {/* Public Directories & Landing */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/hospitals" element={<DirectoryHospitalsPage />} />
                <Route path="/doctors" element={<DirectoryDoctorsPage />} />
                <Route path="/pharmacies" element={<DirectoryPharmaciesPage />} />
                <Route path="/labs" element={<DirectoryLabsPage />} />

                {/* Authentication Flows */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Role-Specific Protected Workspaces */}
                <Route
                  path="/dashboard/patient"
                  element={
                    <ProtectedRoute>
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/doctor"
                  element={
                    <ProtectedRoute>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/hospital"
                  element={
                    <ProtectedRoute>
                      <HospitalAdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/receptionist"
                  element={
                    <ProtectedRoute>
                      <ReceptionistDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/pharmacy"
                  element={
                    <ProtectedRoute>
                      <PharmacyDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/lab"
                  element={
                    <ProtectedRoute>
                      <LabDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
