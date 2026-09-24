import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, ArrowUpRight, Clock, CheckCircle2, AlertCircle, Calendar } from '../components/Icons';
import { rfqService } from '../services/api';

export default function QuoteHistory() {
  const [rfqs, setRfqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await rfqService.getAssignedRfqs();
      // Filter for submitted or revision quotes
      setRfqs(data.filter((r) => r.quoteStatus === 'submitted' || r.isNegotiationRequested));
    } catch (err) {
      console.error('Failed to load quote history', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#004990] uppercase tracking-wider mb-1">
          <FileCheck className="w-4 h-4" />
          <span>Audit Log & Submissions</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Commercial Quotation History</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable historical audit log of all quotes submitted to Central Bank of India.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading submission history...</div>
        ) : rfqs.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-700">No Submissions Recorded Yet</div>
            <div className="text-xs text-slate-500 mt-1">Submit your first quote from the dashboard.</div>
            <Link to="/" className="inline-block mt-3 px-4 py-2 bg-[#004990] text-white text-xs font-bold rounded-lg">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Business Category</th>
                  <th className="py-3.5 px-4">Sum of Rates (%)</th>
                  <th className="py-3.5 px-4">Quote Version</th>
                  <th className="py-3.5 px-4">Submission Deadline</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rfqs.map((rfq) => (
                  <tr key={rfq.applicationId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-[#004990]">
                      #{rfq.applicationId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {rfq.businessCategory || 'Standard Merchant'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">
                      {rfq.sumOfRate ? `${rfq.sumOfRate}%` : 'Pending'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                        Version {rfq.quoteVersion || 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rfq.submissionDeadline || 'Closed'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {rfq.isNegotiationRequested ? (
                        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <AlertCircle className="w-3 h-3" />
                          <span>Negotiation Requested</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Submitted</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/rfqs/${rfq.applicationId}`}
                        className="inline-flex items-center space-x-1 text-[#004990] hover:text-[#003366] font-bold text-xs"
                      >
                        <span>View Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
