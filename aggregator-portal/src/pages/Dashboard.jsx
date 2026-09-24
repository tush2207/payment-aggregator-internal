import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, AlertCircle, ArrowUpRight, Search, Building2, Calendar, ShieldCheck } from '../components/Icons';
import { rfqService } from '../services/api';

export default function Dashboard({ profile }) {
  const [rfqs, setRfqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchRfqs();
  }, []);

  const fetchRfqs = async () => {
    setIsLoading(true);
    try {
      const data = await rfqService.getAssignedRfqs();
      setRfqs(data);
    } catch (err) {
      console.error('Failed to load RFQs', err);
    } finally {
      setIsLoading(false);
    }
  };

  // KPI Metrics calculation
  const totalAssigned = rfqs.length;
  const submittedCount = rfqs.filter((r) => r.quoteStatus === 'submitted').length;
  const pendingCount = rfqs.filter((r) => r.quoteStatus === 'quoterequested' || r.quoteStatus === 'pending').length;
  const negotiationCount = rfqs.filter((r) => r.isNegotiationRequested).length;

  const filteredRfqs = rfqs.filter((r) => {
    const matchesSearch =
      r.applicationId.toString().includes(searchQuery) ||
      (r.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.businessCategory || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'SUBMITTED') return matchesSearch && r.quoteStatus === 'submitted';
    if (statusFilter === 'PENDING') return matchesSearch && r.quoteStatus !== 'submitted';
    if (statusFilter === 'REVISION') return matchesSearch && r.isNegotiationRequested;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Welcome & Partner Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#004990] uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Authorized Payment Aggregator</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {profile?.aggregatorName || 'Partner Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review merchant onboarding requirements from Central Bank of India and submit commercial rate quotations.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-slate-800">Account Status: Active</div>
            <div className="text-slate-500 text-[11px]">POC: {profile?.contactPersonName} ({profile?.email})</div>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total RFQs Assigned</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalAssigned}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004990] flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Quotations</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Submitted Quotes</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{submittedCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#C8102E] uppercase tracking-wider">Revision Requests</div>
            <div className="text-2xl font-black text-[#C8102E] mt-1">{negotiationCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#C8102E] flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* RFQ Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Assigned RFQ Applications</h2>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {filteredRfqs.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by App ID or merchant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#004990]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004990]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Quote</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVISION">Revision Requested</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading assigned RFQs...</div>
        ) : filteredRfqs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-700">No RFQs Found</div>
            <div className="text-xs text-slate-500 mt-1">There are currently no RFQ applications matching your filter.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Business Category</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Avg Ticket Size</th>
                  <th className="py-3.5 px-4">Annual Transactions</th>
                  <th className="py-3.5 px-4">Submission Deadline</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRfqs.map((rfq) => (
                  <tr key={rfq.applicationId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-[#004990]">
                      #{rfq.applicationId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {rfq.businessCategory || 'Standard'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {rfq.category || 'Private'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      ₹ {rfq.avgTransactionSize ? Number(rfq.avgTransactionSize).toLocaleString('en-IN') : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {rfq.avgTransactionYearly ? Number(rfq.avgTransactionYearly).toLocaleString('en-IN') : 'Standard'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#C8102E]" />
                        <span>{rfq.submissionDeadline || 'Open'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {rfq.isNegotiationRequested ? (
                        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <AlertCircle className="w-3 h-3" />
                          <span>Revision Req (v{rfq.quoteVersion})</span>
                        </span>
                      ) : rfq.quoteStatus === 'submitted' ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Quote Submitted ({rfq.sumOfRate}%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-blue-50 text-[#004990] border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Quote Requested</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/rfqs/${rfq.applicationId}`}
                        className="inline-flex items-center space-x-1 bg-[#004990] hover:bg-[#003d7a] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <span>{rfq.quoteStatus === 'submitted' ? 'View / Revise' : 'Submit Quote'}</span>
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
