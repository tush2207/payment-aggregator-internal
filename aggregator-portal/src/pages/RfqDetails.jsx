import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Send,
  Loader2,
  Info,
  ShieldCheck,
  Percent,
  TrendingUp,
} from '../components/Icons';
import { rfqService } from '../services/api';

export default function RfqDetails({ profile }) {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rates, setRates] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [notificationMsg, setNotificationMsg] = useState(null);

  useEffect(() => {
    fetchRfq();
  }, [applicationId]);

  const fetchRfq = async () => {
    setIsLoading(true);
    try {
      const data = await rfqService.getRfqDetails(applicationId);
      setRfq(data);
      // Initialize projection rates table
      const initialRates = (data.projections || []).map((p) => ({
        id: p.id,
        transactionType: p.transactionType,
        rate: p.rate || 0,
        unit: p.unit || '%',
        chargesProposed: p.chargesProposed || p.rate || 0,
        vendorShare: p.vendorShare || 0,
        expectedRevenue: p.expectedRevenue || 0,
      }));
      setRates(initialRates);
    } catch (err) {
      console.error('Failed to load RFQ details', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateChange = (index, value) => {
    const valNum = parseFloat(value) || 0;
    const updated = [...rates];
    updated[index].rate = valNum;
    updated[index].chargesProposed = valNum;
    setRates(updated);
  };

  // Calculate sum of rates
  const sumOfRate = rates.reduce((acc, curr) => acc + (parseFloat(curr.rate) || 0), 0);

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotificationMsg(null);

    try {
      const payload = {
        sumOfRate: parseFloat(sumOfRate.toFixed(4)),
        remarks,
        projections: rates,
      };

      const res = await rfqService.submitQuote(applicationId, payload);
      setIsSubmitting(false);
      setNotificationMsg({
        type: 'success',
        text: `Quotation submitted successfully for Application #${applicationId}! Acknowledgement dispatched to your email.`,
      });
      fetchRfq();
    } catch (err) {
      setIsSubmitting(false);
      setNotificationMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to submit quote. Please verify all inputs.',
      });
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading RFQ specifications...</div>;
  }

  if (!rfq) {
    return (
      <div className="p-12 text-center">
        <div className="text-sm font-bold text-red-600">RFQ Application Not Found</div>
        <Link to="/" className="text-xs font-bold text-[#004990] underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#004990] hover:text-[#003366] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
          {rfq.quoteStatus === 'submitted' ? (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Quotation Submitted ({rfq.sumOfRate}%)</span>
            </span>
          ) : (
            <span className="bg-blue-50 text-[#004990] border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
              Quotation Pending
            </span>
          )}
        </div>
      </div>

      {notificationMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-start space-x-2.5 ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-[#C8102E]'
          }`}
        >
          {notificationMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          CENTRAL BANK OF INDIA OFFICIAL RFQ SPECIFICATION SHEET
          (Renders ONLY and EXACTLY the parameters present in the Quotation Email)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        {/* Official Header */}
        <div className="h-1.5 bg-gradient-to-r from-[#004990] via-[#176FC1] to-[#C8102E]"></div>
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-[#004990] uppercase tracking-widest">
              Commercial Quotation Request
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">
              Merchant Onboarding — Application #{rfq.applicationId}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Central Bank of India | Neo Banking & Emerging Technologies Department
            </p>
          </div>

          <div className="bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm">
            <div className="text-[11px] font-bold text-[#C8102E] uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Submission Deadline</span>
            </div>
            <div className="text-base font-black text-slate-900 mt-0.5">
              {rfq.submissionDeadline || 'Immediate'}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Negotiation / Revision Alert Box */}
          {rfq.isNegotiationRequested && rfq.negotiationRemarks && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Revised Quotation Request / Rate Negotiation (Version #{rfq.currentQuoteVersion})</span>
              </div>
              <p className="text-xs text-amber-900 mt-1.5 leading-relaxed font-medium">
                The merchant has reviewed initial submissions and requested negotiated rates:{' '}
                <strong>"{rfq.negotiationRemarks}"</strong>. Please submit your best revised rates below.
              </p>
            </div>
          )}

          {/* EXACT EMAIL SPECIFICATION PARAMETERS TABLE */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              1. Merchant Specification Requirements
            </h3>
            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#004990] text-white text-[11px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4 w-1/2">Parameter / Field</th>
                    <th className="py-3 px-4 w-1/2">Details / Requirement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-bold text-slate-700">Application ID</td>
                    <td className="py-3 px-4 font-black text-[#C8102E]">#{rfq.applicationId}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-bold text-slate-700">Mode of Collection of Fee/Payment</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">{rfq.modesOfCollection}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-bold text-slate-700">Type of Business / Entity Category</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{rfq.businessCategory}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-bold text-slate-700">Category (Private / Govt)</td>
                    <td className="py-3 px-4 text-slate-900">{rfq.category}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-bold text-slate-700">Average Ticket Size</td>
                    <td className="py-3 px-4 font-bold text-[#004990]">
                      ₹ {rfq.avgTransactionSize ? Number(rfq.avgTransactionSize).toLocaleString('en-IN') : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 bg-slate-50 font-bold text-slate-700">Expected Annual Online Transactions</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {rfq.avgTransactionYearly ? Number(rfq.avgTransactionYearly).toLocaleString('en-IN') : 'Standard'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* MANDATORY SUBMISSION TERMS & INSTRUCTIONS */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              2. Mandatory Instructions & Commercial Conditions
            </h3>
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 sm:p-5 space-y-2 text-xs text-slate-700">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-[#004990] shrink-0 mt-0.5" />
                <div>
                  <strong>System Integration Fee & AMC Charges:</strong> Must be <strong>NIL (₹ 0.00)</strong> as per Central Bank of India merchant onboarding standards.
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Official Submission:</strong> Rates submitted through this digital portal constitute your binding commercial quote for Application #{rfq.applicationId}.
                </div>
              </div>
            </div>
          </div>

          {/* COMMERCIAL QUOTATION RATE ENTRY FORM */}
          <form onSubmit={handleSubmitQuote} className="space-y-6 pt-2">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  3. Commercial Rate Schedule (Enter Percentage / Rates)
                </h3>
                <div className="text-xs font-bold text-[#004990] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                  Total Sum of Rates: <span className="font-black text-base">{sumOfRate.toFixed(2)}%</span>
                </div>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Payment Channel / Instrument</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4 w-48">Rate Quoted (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {rates.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.transactionType}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{p.unit || '%'}</td>
                        <td className="py-3 px-4">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              required
                              value={p.rate}
                              onChange={(e) => handleRateChange(idx, e.target.value)}
                              className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004990]"
                            />
                            <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Hardcoded Nil AMC & Integration Fee */}
                    <tr className="bg-slate-50/80 font-bold">
                      <td className="py-3 px-4 text-slate-700">System Integration Fee</td>
                      <td className="py-3 px-4 text-slate-500">INR</td>
                      <td className="py-3 px-4 font-black text-emerald-700">NIL (₹ 0.00)</td>
                    </tr>
                    <tr className="bg-slate-50/80 font-bold">
                      <td className="py-3 px-4 text-slate-700">Annual Maintenance Charges (AMC)</td>
                      <td className="py-3 px-4 text-slate-500">INR</td>
                      <td className="py-3 px-4 font-black text-emerald-700">NIL (₹ 0.00)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Remarks & Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Commercial Remarks / Value-Added Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Specify any special commercial conditions, SLA turnaround, or additional payment modes supported..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#004990]"
              />
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#004990] to-[#176FC1] hover:from-[#003d7a] hover:to-[#135ca3] text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-blue-900/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Quotation...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Commercial Quotation</span>
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
