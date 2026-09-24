import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Building2, ShieldCheck, FileText, Bell, KeyRound } from './Icons';
import { authService } from '../services/api';

export default function Navbar({ profile, onOpenPasswordReset }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Accent Strip in Central Bank of India Brand Gradient */}
      <div className="h-1 bg-gradient-to-r from-[#004990] via-[#176FC1] to-[#C8102E]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Organization Identity */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#004990] flex items-center justify-center text-white font-bold text-xl shadow-md">
                CBI
              </div>
              <div>
                <div className="text-base font-extrabold text-[#004990] leading-none tracking-tight">
                  Central Bank of India
                </div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                  Payment Aggregator RFQ Portal
                </div>
              </div>
            </Link>

            <span className="hidden md:inline-block h-6 w-px bg-slate-200 mx-2"></span>

            <div className="hidden lg:flex items-center space-x-2 bg-blue-50/80 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold text-[#004990]">
              <Building2 className="w-3.5 h-3.5 text-[#004990]" />
              <span>Partner: <strong>{profile?.aggregatorName || 'Authorized Aggregator'}</strong></span>
            </div>
          </div>

          {/* Navigation Links & User Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <nav className="flex space-x-1 sm:space-x-2 mr-2">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  location.pathname === '/'
                    ? 'bg-[#004990] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  location.pathname === '/history'
                    ? 'bg-[#004990] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Quote History
              </Link>
            </nav>

            <button
              onClick={onOpenPasswordReset}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Password</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-[#C8102E] border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
              title="Logout from session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
