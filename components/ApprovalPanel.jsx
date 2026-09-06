import { useState, useEffect } from "react";
import { approvals as mockApprovals } from "../mockData.js";

// Generate rich rows from 210+ mock approvals
const ALL_APPROVAL_ROWS = mockApprovals.map(a => ({
  id: `Q-${a.quotation_id}`,
  numericId: a.quotation_id,
  customer: a.customer,
  tier: a.blended_risk >= 25 ? "Gold" : (a.blended_risk >= 15 ? "Silver" : "Bronze"),
  blendedRisk: a.risk_level,
  riskScore: a.blended_risk,
  stage: a.stage,
  assignedTo: a.assigned_to,
  status: a.status,
  lines: [
    { name: a.breach_line, given: `${a.breach_discount}%`, limit: `${a.allowed_limit}%`, overBy: `${a.over_by} pt OVER`, isBreach: a.over_by > 0 }
  ],
  auditLogs: a.audit_history.map(h => ({ user: h.user, action: h.action, date: h.date, note: h.note }))
}));

export default function ApprovalPanel() {
  const [rows, setRows] = useState(ALL_APPROVAL_ROWS);
  const [selectedQuoteId, setSelectedQuoteId] = useState(ALL_APPROVAL_ROWS[0]?.id || "Q-1042");
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const [activeStep, setActiveStep] = useState(2); // 1: Submitted, 2: Sales Manager, 3: Finance, 4: Confirmed
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Selected quotation record
  const currentQuote = rows.find(r => r.id === selectedQuoteId) || rows[0];

  // Counts for pills
  const pendingCount = rows.filter(r => r.status === "Pending").length;
  const returnedCount = rows.filter(r => r.status === "Returned").length;
  const approvedCount = rows.filter(r => r.status === "Approved").length;

  const displayRows = filterPendingOnly ? rows.filter(r => r.status === "Pending") : rows;
  const totalPages = Math.ceil(displayRows.length / pageSize) || 1;
  const paginatedRows = displayRows.slice((page - 1) * pageSize, page * pageSize);

  const handleApprove = () => {
    setRows(prev => prev.map(r => {
      if (r.id === selectedQuoteId) {
        return {
          ...r,
          status: "Approved",
          stage: "Confirmed",
          auditLogs: [
            ...r.auditLogs,
            { user: "You (Reviewer)", action: "Approved", date: "Just now", note: "Quotation ratified and approved" }
          ]
        };
      }
      return r;
    }));
    setActiveStep(4);
    if (window.showToast) {
      window.showToast(`Quotation ${selectedQuoteId} approved successfully`, "success");
    }
  };

  const handleReturn = () => {
    setRows(prev => prev.map(r => {
      if (r.id === selectedQuoteId) {
        return {
          ...r,
          status: "Returned",
          stage: "Revision Needed",
          auditLogs: [
            ...r.auditLogs,
            { user: "You (Reviewer)", action: "Returned", date: "Just now", note: "Returned for revision: discount exceeds allowable floor" }
          ]
        };
      }
      return r;
    }));
    if (window.showToast) {
      window.showToast(`Quotation ${selectedQuoteId} returned for revision`, "info");
    }
  };

  const handleReject = () => {
    setRows(prev => prev.map(r => {
      if (r.id === selectedQuoteId) {
        return {
          ...r,
          status: "Rejected",
          stage: "Rejected",
          auditLogs: [
            ...r.auditLogs,
            { user: "You (Reviewer)", action: "Rejected", date: "Just now", note: "Commercial margins unacceptable" }
          ]
        };
      }
      return r;
    }));
    if (window.showToast) {
      window.showToast(`Quotation ${selectedQuoteId} rejected`, "error");
    }
  };

  return (
    <div className="space-y-10 max-w-[1500px] mx-auto">
      
      {/* ========================================================================= */}
      {/* TOP SECTION: Approvals (List) - Matching Excalidraw Approvals List Screen */}
      {/* ========================================================================= */}
      <div className="space-y-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Approvals (List)</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Every quotation that needed, needs, or is going through discount approval
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>{pendingCount} Pending</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm flex items-center gap-1.5">
            <span>{returnedCount} Returned</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm flex items-center gap-1.5">
            <span>{approvedCount} Approved</span>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="border border-slate-700 rounded-xl overflow-hidden shadow-lg bg-slate-950/40">
          <table className="min-w-full divide-y divide-slate-700 text-xs sm:text-sm">
            <thead className="bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3 text-left">Quotation</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-center">Blended Risk</th>
                <th className="px-5 py-3 text-left">Stage</th>
                <th className="px-5 py-3 text-left">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedRows.map((row) => {
                const isSelected = row.id === selectedQuoteId;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedQuoteId(row.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-sky-950/50 border-l-4 border-l-sky-400" : "hover:bg-slate-800/60"
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-sky-400">
                      {row.id}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-white">
                      {row.customer}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border ${
                        row.blendedRisk === "HIGH" 
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : row.blendedRisk === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      }`}>
                        {row.blendedRisk}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">
                      {row.stage}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {row.assignedTo}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 gap-3">
          <div>
            Showing {displayRows.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, displayRows.length)} of {displayRows.length} approval tickets
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className={`px-3 py-1 rounded-lg border border-slate-700 font-bold transition-all ${
                page > 1 ? 'hover:bg-slate-800 text-slate-200' : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              ← Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = page - 2 + i;
              if (pageNum < 1) pageNum = i + 1;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    page === pageNum ? 'bg-sky-400 text-slate-950 shadow-md' : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              className={`px-3 py-1 rounded-lg border border-slate-700 font-bold transition-all ${
                page < totalPages ? 'hover:bg-slate-800 text-slate-200' : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Yellow Callout Box matching Excalidraw */}
        <div className="excalidraw-callout">
          Click any row to open its full approval detail, risk breakdown, and audit trail.
        </div>

        {/* Filter Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setFilterPendingOnly(!filterPendingOnly)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
              filterPendingOnly 
                ? "bg-sky-400 text-slate-950 border-sky-300"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
            }`}
          >
            {filterPendingOnly ? "✓ Filtering: Pending Only" : "Filter: Pending Only"}
          </button>
        </div>
      </div>


      {/* ========================================================================================= */}
      {/* BOTTOM SECTION: Screen 6: Approval Detail - Matching Excalidraw Screen 6 Exactly         */}
      {/* ========================================================================================= */}
      <div className="space-y-6 bg-slate-900/95 border-2 border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
        
        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Approval Detail: {currentQuote.id} ({currentQuote.customer})
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Opened by clicking a row on the Approvals list
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Blended Risk Pill (Rose/Red) */}
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/50">
              Blended Risk: {currentQuote.blendedRisk}
            </span>
            {/* Customer Tier Pill (Sky Blue) */}
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/50">
              Customer Tier: {currentQuote.tier}
            </span>
          </div>
        </div>

        {/* Section: Why This Quote Was Flagged */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-sky-400 tracking-wide">Why This Quote Was Flagged</h3>
          
          <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="min-w-full divide-y divide-slate-700 text-xs sm:text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3 text-left">Line</th>
                  <th className="px-4 py-3 text-center">Discount Given</th>
                  <th className="px-4 py-3 text-center">Limit Allowed</th>
                  <th className="px-5 py-3 text-left">Over By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {currentQuote.lines.map((line, idx) => (
                  <tr key={idx} className={line.isBreach ? "bg-rose-950/20" : ""}>
                    <td className="px-5 py-3.5 font-bold text-white">
                      {line.name}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-400">
                      {line.given}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-slate-400">
                      {line.limit}
                    </td>
                    <td className="px-5 py-3.5 font-bold font-mono">
                      <span className={line.isBreach ? "text-rose-400 font-black" : "text-emerald-400"}>
                        {line.overBy}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Yellow Callout Box matching Excalidraw */}
        <div className="excalidraw-callout">
          Worst single line (8pt over) plus overall pattern across the order sets the blended score. One bad line is enough to require approval.
        </div>

        {/* 4-Step Stepper (Submitted -> Sales Manager -> Finance -> Confirmed) */}
        <div className="py-6 px-4 bg-slate-950/40 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {/* Connecting line */}
            <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-700 -z-0"></div>

            {/* Step 1: Submitted */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-slate-900">
                ✓
              </div>
              <span className="text-xs font-bold text-slate-300 mt-2">Submitted</span>
            </div>

            {/* Step 2: Sales Manager */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md border-2 border-slate-900 ${
                activeStep >= 2 ? "bg-sky-500 text-slate-950 ring-4 ring-sky-500/30" : "bg-slate-700 text-slate-400"
              }`}>
                2
              </div>
              <span className="text-xs font-bold text-sky-400 mt-2">Sales Manager</span>
            </div>

            {/* Step 3: Finance */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md border-2 border-slate-900 ${
                activeStep >= 3 ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}>
                3
              </div>
              <span className="text-xs font-bold text-slate-400 mt-2">Finance</span>
            </div>

            {/* Step 4: Confirmed */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md border-2 border-slate-900 ${
                activeStep >= 4 ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}>
                4
              </div>
              <span className="text-xs font-bold text-slate-400 mt-2">Confirmed</span>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Log</h4>
          <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="min-w-full divide-y divide-slate-700 text-xs sm:text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-2.5 text-left">User</th>
                  <th className="px-5 py-2.5 text-left">Action</th>
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-5 py-2.5 text-left">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {currentQuote.auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="px-5 py-2.5 font-bold text-white font-mono">{log.user}</td>
                    <td className="px-5 py-2.5 text-sky-400 font-medium">{log.action}</td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{log.date}</td>
                    <td className="px-5 py-2.5 text-slate-300">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Action Buttons: Approve / Return for Revision / Reject */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleApprove}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center gap-2"
          >
            <span>✓</span>
            <span>Approve</span>
          </button>

          <button
            type="button"
            onClick={handleReturn}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center gap-2"
          >
            <span>↺</span>
            <span>Return for Revision</span>
          </button>

          <button
            type="button"
            onClick={handleReject}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center gap-2"
          >
            <span>✕</span>
            <span>Reject</span>
          </button>
        </div>

      </div>

    </div>
  );
}