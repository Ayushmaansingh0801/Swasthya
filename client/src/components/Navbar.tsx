import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Building2, Calendar, FileText, Heart, LogOut, Menu, Pill, Stethoscope, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { QuickDemoLogin } from './QuickDemoLogin';
import { WorkspaceSwitcherModal } from './WorkspaceSwitcherModal';

export const Navbar: React.FC = () => {
  const { user, logout, activeWorkspace } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);

  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'patient': return '/dashboard/patient';
      case 'hospital_doctor':
      case 'private_doctor':
      case 'homeopathy_doctor': return '/dashboard/doctor';
      case 'hospital_admin':
      case 'bed_manager': return '/dashboard/hospital';
      case 'hospital_receptionist':
      case 'clinic_receptionist': return '/dashboard/receptionist';
      case 'medical_store_owner':
      case 'pharmacist': return '/dashboard/pharmacy';
      case 'lab_admin':
      case 'lab_tech': return '/dashboard/lab';
      case 'verification_admin':
      case 'platform_super_admin':
      case 'public_health_admin': return '/dashboard/admin';
      default: return '/dashboard/patient';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-extrabold text-xl tracking-tight text-slate-900 leading-none flex items-center gap-1.5">
                    <span>Swasthya</span>
                    <span className="text-teal-600 font-black">AI</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium tracking-wide">
                    Smart Rewa Healthcare
                  </div>
                </div>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link
                  to="/hospitals"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 transition-colors"
                >
                  {t('nav.hospitals')}
                </Link>
                <Link
                  to="/doctors"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 transition-colors"
                >
                  {t('nav.doctors')}
                </Link>
                <Link
                  to="/pharmacies"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 transition-colors"
                >
                  {t('nav.pharmacies')}
                </Link>
                <Link
                  to="/labs"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 transition-colors"
                >
                  {t('nav.labs')}
                </Link>
              </nav>
            </div>

            {/* Right side controls */}
            <div className="hidden lg:flex items-center gap-3">
              <QuickDemoLogin />
              <LanguageToggle />

              {user ? (
                <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                  {/* Workspace selector button */}
                  <button
                    onClick={() => setWorkspaceModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                    title="Switch clinical or administrative workspace"
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span className="max-w-[130px] truncate">
                      {activeWorkspace ? activeWorkspace.organizationName : 'Personal Workspace'}
                    </span>
                  </button>

                  {/* Dashboard link */}
                  <Link
                    to={getDashboardPath(user.role)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
                  >
                    {t('nav.dashboard')}
                  </Link>

                  {/* Profile info & Logout */}
                  <div className="flex items-center gap-2 pl-1">
                    <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors"
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              <LanguageToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <div className="pb-2">
              <QuickDemoLogin />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/hospitals"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-teal-600" />
                {t('nav.hospitals')}
              </Link>
              <Link
                to="/doctors"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Stethoscope className="w-4 h-4 text-teal-600" />
                {t('nav.doctors')}
              </Link>
              <Link
                to="/pharmacies"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Pill className="w-4 h-4 text-teal-600" />
                {t('nav.pharmacies')}
              </Link>
              <Link
                to="/labs"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-lg border border-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                {t('nav.labs')}
              </Link>
            </div>

            {user ? (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link
                  to={getDashboardPath(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center font-bold text-sm bg-teal-600 text-white rounded-xl"
                >
                  Go to {t('nav.dashboard')}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="block w-full py-2 text-center text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-sm font-semibold border border-slate-200 rounded-lg text-slate-700"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-sm font-semibold bg-teal-600 text-white rounded-lg"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <WorkspaceSwitcherModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
      />
    </>
  );
};
