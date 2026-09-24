import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ForcePasswordResetModal from './components/ForcePasswordResetModal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RfqDetails from './pages/RfqDetails';
import QuoteHistory from './pages/QuoteHistory';
import { authService } from './services/api';

// Protected Route Guard
function ProtectedLayout({ profile, onOpenPasswordReset, children }) {
  const token = localStorage.getItem('aggregator_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar profile={profile} onOpenPasswordReset={onOpenPasswordReset} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center space-x-2 text-slate-800 font-bold text-sm mb-1">
          <span className="text-[#C8102E]">सेन्ट्रल बैंक ऑफ़ इंडिया</span>
          <span className="text-slate-400">|</span>
          <span className="text-[#004990]">Central Bank of India</span>
        </div>
        <p className="text-slate-500 font-medium text-[11px] mb-2">
          "1911 से आपके लिए केंद्रित" &nbsp;•&nbsp; "Central to you since 1911"
        </p>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>🔒 RBI Cyber Security Master Directions & NPCI Compliant • AES-256-GCM Secured</span>
        </div>
        <p className="text-[11px] text-slate-400 max-w-xl mx-auto">
          Official Payment Aggregator RFQ & Commercial Bidding Portal. Confidentiality notice applies. Chandramukhi, Nariman Point, Mumbai - 400 021.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isMandatoryReset, setIsMandatoryReset] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('aggregator_token');
    if (token) {
      authService
        .getProfile()
        .then((data) => {
          setProfile(data);
          if (data.must_reset_password) {
            setIsMandatoryReset(true);
            setIsResetModalOpen(true);
          }
        })
        .catch(() => {
          // Token invalid or expired
        });
    }
  }, []);

  const handlePasswordResetSuccess = () => {
    setIsResetModalOpen(false);
    setIsMandatoryReset(false);
    authService.getProfile().then(setProfile);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedLayout
              profile={profile}
              onOpenPasswordReset={() => {
                setIsMandatoryReset(false);
                setIsResetModalOpen(true);
              }}
            >
              <Dashboard profile={profile} />
            </ProtectedLayout>
          }
        />

        <Route
          path="/rfqs/:applicationId"
          element={
            <ProtectedLayout
              profile={profile}
              onOpenPasswordReset={() => {
                setIsMandatoryReset(false);
                setIsResetModalOpen(true);
              }}
            >
              <RfqDetails profile={profile} />
            </ProtectedLayout>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedLayout
              profile={profile}
              onOpenPasswordReset={() => {
                setIsMandatoryReset(false);
                setIsResetModalOpen(true);
              }}
            >
              <QuoteHistory />
            </ProtectedLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Password Reset Modal (Mandatory or On-demand) */}
      <ForcePasswordResetModal
        isOpen={isResetModalOpen}
        isMandatory={isMandatoryReset}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={handlePasswordResetSuccess}
      />
    </BrowserRouter>
  );
}
