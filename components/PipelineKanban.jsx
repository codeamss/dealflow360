import { useState, useEffect } from "react";
import { quotations as initialQuotations } from "../mockData.js";

// Specific mock data matching Excalidraw Screen 3 exactly
const EXCALIDRAW_QUOTES = [
  { id: 1042, customer_name: "Acme Corp", total_price: 12400, status: "Draft", blended_risk_score: 18, lines: [{ product_id: 5, quantity: 10, applied_discount: 12 }] },
  { id: 1040, customer_name: "Delta LLC", total_price: 3200, status: "Draft", blended_risk_score: 5, lines: [{ product_id: 3, quantity: 4, applied_discount: 5 }] },
  { id: 1039, customer_name: "Beta Industries", total_price: 28000, status: "Pending Approval", blended_risk_score: 32, lines: [{ product_id: 1, quantity: 4, applied_discount: 18 }] },
  { id: 1035, customer_name: "Nova Retail", total_price: 9750, status: "Approved", blended_risk_score: 8, lines: [{ product_id: 2, quantity: 5, applied_discount: 8 }] },
  { id: 1030, customer_name: "Zenith Co", total_price: 15300, status: "Negotiation", blended_risk_score: 14, lines: [{ product_id: 4, quantity: 12, applied_discount: 14 }] },
  { id: 1025, customer_name: "Orion Ltd", total_price: 41000, status: "Confirmed", blended_risk_score: 10, lines: [{ product_id: 1, quantity: 6, applied_discount: 10 }] }
];

const STATUS_ORDER = ["Draft", "Pending Approval", "Approved", "Negotiation", "Confirmed"];

export default function PipelineKanban() {
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" or "table"
  const [allQuotations, setAllQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [tablePage, setTablePage] = useState(1);
  const tablePageSize = 25;

  // Load initial quotes merged with user-saved quotes from localStorage
  const loadQuotations = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("dealflow360_custom_quotes") || "[]");
      const merged = [...stored];
      EXCALIDRAW_QUOTES.forEach(eq => {
        if (!merged.some(m => m.id === eq.id)) {
          merged.push(eq);
        }
      });
      initialQuotations.forEach(iq => {
        if (!merged.some(m => m.id === iq.id)) {
          merged.push(iq);
        }
      });
      setAllQuotations(merged);
    } catch (e) {
      setAllQuotations(EXCALIDRAW_QUOTES);
    }
  };

  useEffect(() => {
    loadQuotations();
    const handleStorage = () => loadQuotations();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Filter based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredQuotations(allQuotations);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = allQuotations.filter(q =>
        (q.customer_name && q.customer_name.toLowerCase().includes(term)) ||
        q.id.toString().includes(term) ||
        (q.title && q.title.toLowerCase().includes(term))
      );
      setFilteredQuotations(filtered);
    }
  }, [searchTerm, allQuotations]);

  // Advance or change status of a quote
  const updateQuoteStatus = (quoteId, newStatus) => {
    const updated = allQuotations.map(q => {
      if (q.id === quoteId) {
        return { ...q, status: newStatus };
      }
      return q;
    });

    setAllQuotations(updated);

    try {
      const stored = JSON.parse(localStorage.getItem("dealflow360_custom_quotes") || "[]");
      const existingIdx = stored.findIndex(s => s.id === quoteId);
      const targetQuote = updated.find(q => q.id === quoteId);

      if (existingIdx >= 0) {
        stored[existingIdx] = targetQuote;
      } else if (targetQuote) {
        stored.push(targetQuote);
      }
      localStorage.setItem("dealflow360_custom_quotes", JSON.stringify(stored));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Storage update failed", e);
    }

    if (selectedQuote && selectedQuote.id === quoteId) {
      setSelectedQuote(prev => ({ ...prev, status: newStatus }));
    }

    if (window.showToast) {
      window.showToast(`Quotation #${quoteId} moved to ${newStatus}`, 'success');
    }
  };

  const columns = STATUS_ORDER.map((status) => ({
    status,
    items: filteredQuotations.filter((q) => q.status === status),
  }));

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Draft": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Pending Approval": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Approved": return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      case "Negotiation": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "Confirmed": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      default: return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  const getRiskBadge = (score) => {
    if (!score || score <= 0) return null;
    if (score > 25) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">Risk {score}%</span>;
    }
    if (score > 12) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">Risk {score}%</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">Risk {score}%</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* Screen 3 Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Quotations (List)</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Every quotation in the system, one row per quotation, click a row to open it</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search customer or quote #..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* + New Quotation (Sky Blue Button) */}
          <a 
            href="/quotation/new" 
            className="px-4 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span className="text-sm leading-none">+</span>
            <span>New Quotation</span>
          </a>

          {/* Switch to Table View / Kanban View Button */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "kanban" ? "table" : "kanban")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            {viewMode === "kanban" ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                <span>Switch to Table View</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                <span>Switch to Kanban View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KANBAN VIEW (Matching Excalidraw Screen 3 Columns) */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div 
              key={col.status} 
              className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/80 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-3 px-1 pt-1 border-b border-slate-700/50 pb-2.5">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">{col.status}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${getStatusBadgeStyle(col.status)}`}>
                  {col.items.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1">
                {col.items.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                    <span className="text-xs">No deals in {col.status}</span>
                  </div>
                ) : (
                  col.items.map((quote) => (
                    <div
                      key={quote.id}
                      onClick={() => setSelectedQuote(quote)}
                      className="bg-slate-900/90 hover:bg-slate-900 border border-slate-700/90 hover:border-sky-400/80 rounded-xl p-3.5 shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                          #{quote.id}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          ${(quote.total_price || 0).toLocaleString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors leading-tight">
                        {quote.customer_name}
                      </h4>

                      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2 border-t border-slate-800 text-[11px]">
                        {getRiskBadge(quote.blended_risk_score)}
                        <span className="text-slate-400 ml-auto group-hover:text-white transition-colors">Open &rarr;</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          {/* TABLE VIEW */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700 text-sm">
              <thead className="bg-slate-900/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 text-left">Quote #</th>
                  <th className="px-5 py-3.5 text-left">Customer</th>
                  <th className="px-4 py-3.5 text-center">Stage</th>
                  <th className="px-4 py-3.5 text-center">Blended Risk</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 bg-slate-900/30">
                {filteredQuotations.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize).map((quote) => (
                  <tr 
                    key={quote.id} 
                    onClick={() => setSelectedQuote(quote)}
                    className="hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-sky-400">
                      #{quote.id}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      {quote.customer_name}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeStyle(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getRiskBadge(quote.blended_risk_score) || <span className="text-slate-500 text-xs">Normal</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-white">
                      ${(quote.total_price || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <a
                          href={`/portal/quote/${quote.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 rounded-lg transition-colors"
                        >
                          Portal
                        </a>
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table View Pagination Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-slate-700/80 bg-slate-900/60 text-xs text-slate-400 gap-3">
            <div>
              Showing {filteredQuotations.length === 0 ? 0 : (tablePage - 1) * tablePageSize + 1}–{Math.min(tablePage * tablePageSize, filteredQuotations.length)} of {filteredQuotations.length} quotations
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={tablePage === 1}
                onClick={() => setTablePage(prev => Math.max(1, prev - 1))}
                className={`px-3 py-1 rounded-lg border border-slate-700 font-bold transition-all ${
                  tablePage > 1 ? 'hover:bg-slate-800 text-slate-200' : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                ← Prev
              </button>

              {Array.from({ length: Math.min(5, Math.ceil(filteredQuotations.length / tablePageSize) || 1) }, (_, i) => {
                const totalPages = Math.ceil(filteredQuotations.length / tablePageSize) || 1;
                let pageNum = tablePage - 2 + i;
                if (pageNum < 1) pageNum = i + 1;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setTablePage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      tablePage === pageNum ? 'bg-sky-400 text-slate-950 shadow-md' : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={tablePage >= Math.ceil(filteredQuotations.length / tablePageSize)}
                onClick={() => setTablePage(prev => Math.min(Math.ceil(filteredQuotations.length / tablePageSize), prev + 1))}
                className={`px-3 py-1 rounded-lg border border-slate-700 font-bold transition-all ${
                  tablePage < Math.ceil(filteredQuotations.length / tablePageSize) ? 'hover:bg-slate-800 text-slate-200' : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-xl w-full p-6 space-y-5">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-slate-400">Quotation #{selectedQuote.id}</span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedQuote.customer_name}</h3>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                <span className="text-xs text-slate-400 font-medium">Total Value</span>
                <div className="text-lg font-bold text-white font-mono mt-1">${(selectedQuote.total_price || 0).toLocaleString()}</div>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                <span className="text-xs text-slate-400 font-medium">Risk Score</span>
                <div className="text-lg font-bold text-amber-400 font-mono mt-1">{selectedQuote.blended_risk_score || 0}%</div>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
                <span className="text-xs text-slate-400 font-medium">Stage</span>
                <div className="text-xs font-bold text-sky-400 mt-2">{selectedQuote.status}</div>
              </div>
            </div>

            {/* Stage Movement */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">Change Stage:</span>
                <select
                  value={selectedQuote.status}
                  onChange={(e) => updateQuoteStatus(selectedQuote.id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                >
                  {STATUS_ORDER.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/portal/quote/${selectedQuote.id}`}
                  className="px-3.5 py-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Open Negotiation Portal &rarr;
                </a>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}