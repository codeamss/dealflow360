import { useState, useEffect } from "react";
import { quotations as mockQuotations, products } from "../mockData.js";

export default function DealHealthAndReports() {
  const [activeTab, setActiveTab] = useState("health"); // "health" or "reports"
  const [quotes, setQuotes] = useState([]);
  
  // Reporting Filter states
  const [periodFilter, setPeriodFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [healthPage, setHealthPage] = useState(1);
  const [healthFilter, setHealthFilter] = useState("all");
  const healthPageSize = 25;

  const repNames = {
    201: "Sarah Jenkins (Enterprise)",
    202: "Marcus Vance (Mid-Market)",
    203: "Elena Rostova (EMEA)",
    default: "Alex Johnson (Strategic)"
  };

  const getRepName = (repId) => repNames[repId] || repNames.default;

  // Load quotes from localStorage + mockData
  const loadQuotes = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("dealflow360_custom_quotes") || "[]");
      const merged = [...stored];
      mockQuotations.forEach(mq => {
        if (!merged.some(m => m.id === mq.id)) {
          merged.push(mq);
        }
      });
      setQuotes(merged);
    } catch (e) {
      setQuotes(mockQuotations);
    }
  };

  useEffect(() => {
    loadQuotes();
    window.addEventListener("storage", loadQuotes);
    return () => window.removeEventListener("storage", loadQuotes);
  }, []);

  // Compute deal health attributes for each quote
  const evaluatedDeals = quotes.map(quote => {
    const createdAt = new Date(quote.created_at || Date.now());
    const now = new Date("2026-09-05T20:00:00Z"); // Anchor to system demo time
    const ageHours = Math.max(0, Math.round((now - createdAt) / (1000 * 60 * 60)));
    const isStalled = ageHours >= 48 && (quote.status === "Draft" || quote.status === "Negotiation" || quote.status === "Pending Approval");
    const isHighRisk = (quote.blended_risk_score || 0) > 25;
    const isMediumRisk = (quote.blended_risk_score || 0) > 12 && (quote.blended_risk_score || 0) <= 25;
    
    let healthCategory = "healthy";
    let healthBadge = "Healthy";
    let healthColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    let issueReason = "Deal progressing normally";

    if (isHighRisk) {
      healthCategory = "risk";
      healthBadge = "High Risk";
      healthColor = "bg-rose-500/20 text-rose-300 border-rose-500/40";
      issueReason = `Governance breach: Risk score at ${quote.blended_risk_score}% (>25% safety ceiling)`;
    } else if (isStalled) {
      healthCategory = "stalled";
      healthBadge = `Stalled (${ageHours}h)`;
      healthColor = "bg-amber-500/20 text-amber-300 border-amber-500/40";
      issueReason = `Inactive for ${ageHours}h without customer progression (>48h policy)`;
    } else if (isMediumRisk) {
      healthCategory = "warning";
      healthBadge = "Approval Gate";
      healthColor = "bg-orange-500/20 text-orange-300 border-orange-500/40";
      issueReason = `Pending Sales Manager discount authorization (${quote.blended_risk_score}% score)`;
    }

    return {
      ...quote,
      ageHours,
      healthCategory,
      healthBadge,
      healthColor,
      issueReason,
      repName: getRepName(quote.rep_id)
    };
  });

  // Action handlers for manager intervention
  const handleNudgeRep = (deal) => {
    if (window.showToast) {
      window.showToast(`Automated follow-up ping dispatched to ${deal.repName} for Quote #${deal.id}`, 'info');
    }
  };

  const handleExpediteApproval = (deal) => {
    if (window.showToast) {
      window.showToast(`Priority escalation sent to Sales VP & Finance for Quote #${deal.id}`, 'success');
    }
  };

  // Filtered Reporting Calculations
  const filteredReportQuotes = evaluatedDeals.filter(quote => {
    if (statusFilter !== "all" && quote.status !== statusFilter) return false;
    
    if (repFilter !== "all") {
      if (quote.rep_id?.toString() !== repFilter && !quote.repName.toLowerCase().includes(repFilter.toLowerCase())) {
        return false;
      }
    }

    if (categoryFilter !== "all") {
      const hasCat = (quote.lines || []).some(l => {
        const prod = l.product || products.find(p => p.id === l.product_id);
        return prod && prod.category === categoryFilter;
      });
      if (!hasCat && quote.lines && quote.lines.length > 0) return false;
    }

    if (periodFilter === "recent") {
      return quote.ageHours <= 72;
    } else if (periodFilter === "older") {
      return quote.ageHours > 72;
    }

    return true;
  });

  const totalFilteredValue = filteredReportQuotes.reduce((sum, q) => sum + (q.total_price || 0), 0);
  const avgFilteredRisk = filteredReportQuotes.length > 0
    ? Math.round(filteredReportQuotes.reduce((sum, q) => sum + (q.blended_risk_score || 0), 0) / filteredReportQuotes.length)
    : 0;
  const estimatedFilteredMargin = totalFilteredValue > 0 ? (totalFilteredValue * 0.35).toFixed(0) : 0;

  const exportReportCSV = () => {
    const headers = ["Quote ID", "Customer Name", "Status", "Total Price", "Risk Score", "Representative", "Created At"];
    const rows = filteredReportQuotes.map(q => [
      q.id,
      `"${q.customer_name}"`,
      q.status,
      q.total_price,
      `${q.blended_risk_score || 0}%`,
      `"${q.repName}"`,
      q.created_at
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dealflow360_commercial_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.showToast) {
      window.showToast("Commercial pipeline report exported to CSV successfully!", "success");
    }
  };

  const stalledDeals = evaluatedDeals.filter(d => d.healthCategory === "stalled");
  const riskyDeals = evaluatedDeals.filter(d => d.healthCategory === "risk");

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden text-white">
      {/* Tab Navigation Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/20 px-2.5 py-0.5 rounded-full border border-sky-500/30">
              Commercial Governance Hub
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-medium">Flow Steps 11 & 12</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {activeTab === "health" ? "Manager Deal Health & Stalled Pipeline Monitor" : "Multi-Dimensional Filtered Reporting Engine"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {activeTab === "health" 
              ? "Catches deals stalled past 48 hours and proposals with excessive commercial risk" 
              : "Slice pipeline by Period, Sales Representative, Approval Gate, and Product Family"}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-sm text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("health")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "health" 
                ? "bg-sky-400 text-slate-950 font-bold shadow-md" 
                : "text-slate-300 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>Deal Health Matrix</span>
            {(stalledDeals.length > 0 || riskyDeals.length > 0) && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'health' ? 'bg-slate-950/20 text-slate-950' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
                {stalledDeals.length + riskyDeals.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "reports" 
                ? "bg-sky-400 text-slate-950 font-bold shadow-md" 
                : "text-slate-300 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            <span>Filtered Reporting</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Deal Health Matrix Content */}
      {activeTab === "health" && (
        <div className="p-6 space-y-6">
          {/* Health Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">At-Risk Deals (&gt;25% Risk)</span>
                <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{riskyDeals.length}</div>
                <span className="text-[11px] text-rose-300/80 font-medium">Exceeds discount safety caps</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black">
                !
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Stalled Deals (&gt;48h Inactive)</span>
                <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{stalledDeals.length}</div>
                <span className="text-[11px] text-amber-300/80 font-medium">Awaiting rep or client next step</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                ⏳
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Healthy Pipeline</span>
                <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                  {evaluatedDeals.filter(d => d.healthCategory === "healthy").length}
                </div>
                <span className="text-[11px] text-emerald-300/80 font-medium">Within standard SLA cadence</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
                ✓
              </div>
            </div>
          </div>

          {/* Deal Health Table */}
          <div className="border border-slate-700 rounded-xl overflow-hidden shadow-lg bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700 text-sm">
                <thead className="bg-slate-800/80 text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-3 text-left">Quotation & Account</th>
                    <th className="px-4 py-3 text-left">Owner / Rep</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Health Diagnosis</th>
                    <th className="px-4 py-3 text-right">Contract Value</th>
                    <th className="px-6 py-3 text-right">Manager Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {evaluatedDeals
                    .filter(d => healthFilter === "all" || d.healthCategory === healthFilter)
                    .slice((healthPage - 1) * healthPageSize, healthPage * healthPageSize)
                    .map(deal => (
                    <tr key={deal.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{deal.customer_name}</span>
                          <span className="text-xs font-mono text-sky-400 font-bold">#DF-{deal.id}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{deal.title || "Standard proposal"}</div>
                      </td>

                      <td className="px-4 py-4 text-xs font-medium text-slate-300">
                        {deal.repName}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {deal.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${deal.healthColor}`}>
                            {deal.healthBadge}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1 max-w-[220px] truncate" title={deal.issueReason}>
                            {deal.issueReason}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right font-black text-white font-mono">
                        ${(deal.total_price || 0).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {deal.healthCategory === "stalled" && (
                            <button
                              type="button"
                              onClick={() => handleNudgeRep(deal)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
                              title="Send reminder to account rep"
                            >
                              Nudge Rep
                            </button>
                          )}

                          {deal.healthCategory === "risk" && (
                            <button
                              type="button"
                              onClick={() => handleExpediteApproval(deal)}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                              title="Escalate to Finance VP"
                            >
                              Escalate
                            </button>
                          )}

                          <a
                            href={`/portal/quote/${deal.id}`}
                            className="px-2.5 py-1 text-xs font-bold text-sky-400 hover:text-sky-300 hover:bg-sky-500/20 rounded-lg transition-colors"
                          >
                            Inspect →
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3 bg-slate-950/50 border-t border-slate-800 text-xs text-slate-400 gap-3">
              <div>
                Showing {(healthPage - 1) * healthPageSize + 1}–{Math.min(healthPage * healthPageSize, evaluatedDeals.length)} of {evaluatedDeals.length} tracked opportunities
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={healthPage === 1}
                  onClick={() => setHealthPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                >
                  ← Prev
                </button>
                <span className="font-mono font-bold text-white px-2">Page {healthPage} of {Math.ceil(evaluatedDeals.length / healthPageSize)}</span>
                <button
                  type="button"
                  disabled={healthPage >= Math.ceil(evaluatedDeals.length / healthPageSize)}
                  onClick={() => setHealthPage(p => Math.min(Math.ceil(evaluatedDeals.length / healthPageSize), p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Filtered Reporting Engine Content */}
      {activeTab === "reports" && (
        <div className="p-6 space-y-6">
          {/* Filter Bar Controls */}
          <div className="p-5 bg-slate-800/60 rounded-xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Multi-Dimensional Parameters
              </span>
              <button
                type="button"
                onClick={() => {
                  setPeriodFilter("all");
                  setRepFilter("all");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="text-xs text-slate-400 hover:text-white font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filter 1: Period */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  1. Time Horizon
                </label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 font-medium text-white focus:ring-2 focus:ring-sky-400"
                >
                  <option className="bg-slate-900 text-white" value="all">All Available Periods</option>
                  <option className="bg-slate-900 text-white" value="recent">Active Recently (&le; 72 Hours)</option>
                  <option className="bg-slate-900 text-white" value="older">Aged Pipeline (&gt; 72 Hours)</option>
                </select>
              </div>

              {/* Filter 2: Sales Team / Rep */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  2. Sales Representative
                </label>
                <select
                  value={repFilter}
                  onChange={(e) => setRepFilter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 font-medium text-white focus:ring-2 focus:ring-sky-400"
                >
                  <option className="bg-slate-900 text-white" value="all">All Sales Representatives</option>
                  <option className="bg-slate-900 text-white" value="201">Sarah Jenkins (Enterprise)</option>
                  <option className="bg-slate-900 text-white" value="202">Marcus Vance (Mid-Market)</option>
                  <option className="bg-slate-900 text-white" value="203">Elena Rostova (EMEA)</option>
                  <option className="bg-slate-900 text-white" value="Alex">Alex Johnson (Strategic)</option>
                </select>
              </div>

              {/* Filter 3: Approval Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  3. Approval Gate / Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 font-medium text-white focus:ring-2 focus:ring-sky-400"
                >
                  <option className="bg-slate-900 text-white" value="all">All Pipeline Stages</option>
                  <option className="bg-slate-900 text-white" value="Draft">Draft Stage</option>
                  <option className="bg-slate-900 text-white" value="Pending Approval">Pending Executive Approval</option>
                  <option className="bg-slate-900 text-white" value="Negotiation">Customer Negotiation</option>
                  <option className="bg-slate-900 text-white" value="Confirmed">Confirmed / Dispatch Ready</option>
                </select>
              </div>

              {/* Filter 4: Product Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  4. Product Line / Family
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-700 p-2.5 bg-slate-800 font-medium text-white focus:ring-2 focus:ring-sky-400"
                >
                  <option className="bg-slate-900 text-white" value="all">All Product Families</option>
                  <option className="bg-slate-900 text-white" value="Hardware">Hardware Systems & Racks</option>
                  <option className="bg-slate-900 text-white" value="Services">Cloud Subscriptions & Support</option>
                </select>
              </div>
            </div>
          </div>

          {/* Aggregated Report KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtered Pipeline Value</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">
                ${totalFilteredValue.toLocaleString()}
              </div>
              <span className="text-[11px] text-sky-400 font-medium">{filteredReportQuotes.length} matching proposals</span>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Gross Margin</span>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                ${parseInt(estimatedFilteredMargin).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">~35% baseline margin</span>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Risk Score</span>
              <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
                {avgFilteredRisk}%
              </div>
              <span className="text-[11px] text-slate-400">Governance index</span>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Export Report</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Download CSV ledger</p>
              </div>
              <button
                type="button"
                onClick={exportReportCSV}
                className="px-3.5 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filtered Quotations Table */}
          <div className="border border-slate-700 rounded-xl overflow-hidden shadow-lg bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700 text-sm">
                <thead className="bg-slate-800/80 text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-3 text-left">Quote Ref</th>
                    <th className="px-6 py-3 text-left">Client Account</th>
                    <th className="px-4 py-3 text-left">Sales Rep</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Risk</th>
                    <th className="px-6 py-3 text-right">Contract Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredReportQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-xs text-slate-400">
                        No quotations match the selected filter criteria. Try broadening your parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredReportQuotes.map(q => (
                      <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-3 text-xs font-mono font-bold text-sky-400">
                          #DF-{q.id}
                        </td>
                        <td className="px-6 py-3 font-bold text-white text-xs">
                          {q.customer_name}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">
                          {q.repName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-mono font-semibold text-slate-300">
                          {q.blended_risk_score || 0}%
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-black text-white text-xs">
                          ${(q.total_price || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
