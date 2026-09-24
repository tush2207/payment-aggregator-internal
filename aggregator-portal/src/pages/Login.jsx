import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, RefreshCw, ArrowRight, AlertCircle, Building2, CheckCircle2 } from '../components/Icons';
import { authService } from '../services/api';
import ForcePasswordResetModal from '../components/ForcePasswordResetModal';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaData, setCaptchaData] = useState({ challenge_id: '', captcha_image: '' });
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showForcedResetModal, setShowForcedResetModal] = useState(false);

  const fetchCaptcha = async () => {
    setIsLoadingCaptcha(true);
    try {
      const data = await authService.getCaptcha();
      setCaptchaData(data);
      setCaptchaAnswer('');
    } catch (err) {
      console.error('Failed to load captcha', err);
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await authService.login({
        email,
        password,
        captcha_challenge_id: captchaData.challenge_id,
        captcha_answer: captchaAnswer,
      });

      if (res.access_token) {
        localStorage.setItem('aggregator_token', res.access_token);
        localStorage.setItem('aggregator_profile', JSON.stringify(res.aggregator));
      }

      setIsSubmitting(false);

      if (res.must_reset_password) {
        setShowForcedResetModal(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please verify your credentials and CAPTCHA.');
      fetchCaptcha(); // Refresh captcha on failure
    }
  };

  const handlePasswordResetSuccess = () => {
    setShowForcedResetModal(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#004990] text-white font-extrabold text-2xl shadow-xl shadow-blue-900/20 mb-4">
          CBI
        </div>
        <h2 className="text-2xl font-extrabold text-[#004990] tracking-tight">
          Central Bank of India
        </h2>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
          Payment Aggregator RFQ Portal
        </p>
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl shadow-slate-200/80 rounded-2xl border border-slate-200/80 relative overflow-hidden">
          {/* Top Brand Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#004990] via-[#176FC1] to-[#C8102E]"></div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Partner Authentication</h3>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with the credentials provided in your official CBI onboarding email.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#C8102E] font-medium flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Email / User ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="aggregator.partner@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004990] focus:border-transparent transition-all pr-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004990] focus:border-transparent transition-all pr-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Interactive Visual CAPTCHA */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Security Verification (CAPTCHA)
              </label>
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-11 bg-slate-50 border border-slate-300 rounded-lg p-1 flex items-center justify-center min-w-[150px] overflow-hidden select-none">
                  {captchaData.captcha_image ? (
                    <img src={captchaData.captcha_image} alt="CAPTCHA" className="h-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400">Loading CAPTCHA...</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={isLoadingCaptcha}
                  className="p-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Reload CAPTCHA challenge"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingCaptcha ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="Enter characters shown above"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm uppercase tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#004990] focus:border-transparent transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#004990] to-[#176FC1] hover:from-[#003d7a] hover:to-[#135ca3] flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/20 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to RFQ Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Compliance Footnote */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-start space-x-2 text-[11px] text-slate-500 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Bank-grade 256-bit encryption. Access is restricted to authorized Payment Aggregator representatives only.
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Forced Password Reset Modal */}
      <ForcePasswordResetModal
        isOpen={showForcedResetModal}
        isMandatory={true}
        onSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
}
