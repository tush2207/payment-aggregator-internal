import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, KeyRound, Loader2 } from './Icons';
import { authService } from '../services/api';

export default function ForcePasswordResetModal({ isOpen, isMandatory = true, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Validation criteria checklist
  const hasMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[!@#$%^&*()-_=+[\]{}|;:,.<>?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSymbol && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await authService.resetPassword({
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.access_token) {
        localStorage.setItem('aggregator_token', res.access_token);
      }

      setIsLoading(false);
      onSuccess?.();
      if (!isMandatory) {
        onClose?.();
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.response?.data?.detail || 'Failed to update password. Please check complexity requirements.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Top Strip */}
        <div className="h-1.5 bg-gradient-to-r from-[#004990] via-[#176FC1] to-[#C8102E]"></div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isMandatory ? 'Mandatory: Set Permanent Password' : 'Change Your Password'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isMandatory
                  ? 'First login detected. Set your private, permanent password before accessing the dashboard.'
                  : 'Ensure your account stays protected with a strong password.'}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#C8102E] font-medium flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004990] focus:border-transparent transition-all pr-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004990] focus:border-transparent transition-all pr-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Password Complexity Checklist */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                Password Policy Checklist:
              </div>
              <div className="flex items-center space-x-2">
                {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span className={hasMinLength ? 'text-emerald-700 font-semibold' : ''}>Minimum 12 characters</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span className={hasUpper ? 'text-emerald-700 font-semibold' : ''}>At least 1 uppercase letter (A-Z)</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasLower ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span className={hasLower ? 'text-emerald-700 font-semibold' : ''}>At least 1 lowercase letter (a-z)</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span className={hasNumber ? 'text-emerald-700 font-semibold' : ''}>At least 1 number (0-9)</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasSymbol ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span className={hasSymbol ? 'text-emerald-700 font-semibold' : ''}>At least 1 special character (!@#$%^&*)</span>
              </div>
              <div className="flex items-center space-x-2 pt-0.5">
                {passwordsMatch ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : ''}>Passwords match</span>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              {!isMandatory && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md ${
                  isFormValid && !isLoading
                    ? 'bg-gradient-to-r from-[#004990] to-[#176FC1] hover:shadow-lg cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set Permanent Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
