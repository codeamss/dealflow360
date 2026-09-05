import { useState, useEffect } from "react";
import { quotations as initialQuotations } from "../mockData.js";

const STATUS_ORDER = ["Draft", "Pending Approval", "Negotiation", "Confirmed"];

export default function PipelineKanban() {
  const [allQuotations, setAllQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Load initial quotes merged with user-saved quotes from localStorage
  const loadQuotations = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("dealflow360_custom_quotes") || "[]");
      // Filter duplicates by ID
      const merged = [...stored];
      initialQuotations.forEach(iq => {
        if (!merged.some(m => m.id === iq.id)) {
          merged.push(iq);
        }
      });
      setAllQuotations(merged);
    } catch (e) {
      setAllQuotations(initialQuotations);
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

    // Save to localStorage
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
      case "Draft": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Pending Approval": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Negotiation": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Confirmed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusHeaderStyle = (status) => {
    switch (status) {
      case "Draft": return "border-t-4 border-t-blue-500";
      case "Pending Approval": return "border-t-4 border-t-amber-500";
      case "Negotiation": return "border-t-4 border-t-orange-500";
      case "Confirmed": return "border-t-4 border-t-emerald-500";
      default: return "border-t-4 border-t-slate-400";
    }
  };

  const getRiskBadge = (score) => {
    if (!score || score <= 0) return null;
    if (score > 25) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">Risk {score}%</span>;
    }
    if (score > 12) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Risk {score}%</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Risk {score}%</span>;
  };

  const totalPipelineValue = filteredQuotations.reduce((acc, q) => acc + (q.total_price || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Deal Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Real-time commercial deal flow and approval stages</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <input
              type="text"
              placeholder="Search by client or quote #..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <a 
            href="/quotation/new" 
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
            <span>Create Quote</span>
          </a>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Active Deals</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{filteredQuotations.length}</div>
          <span className="text-[11px] text-slate-400">Total pipeline records</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Pipeline Value</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">${Math.round(totalPipelineValue).toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Weighted commercial sum</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Pending Review</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {filteredQuotations.filter(q => q.status === "Pending Approval").length}
          </div>
          <span className="text-[11px] text-slate-400">Awaiting manager sign-off</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Confirmed Closed</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {filteredQuotations.filter(q => q.status === "Confirmed").length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Ready for fulfillment</span>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div 
            key={col.status} 
            className={`bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-h-[500px] ${getStatusHeaderStyle(col.status)}`}
          >
            {/* Column Header */}
            <div className="flex justify-between items-center mb-3 px-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">{col.status}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeStyle(col.status)}`}>
                {col.items.length}
              </span>
            </div>

            {/* Quotation Cards List */}
            <div className="space-y-3 flex-1">
              {col.items.length === 0 ? (
                <div className="h-40 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <span className="text-xs font-medium">No deals in {col.status}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Create a quote or advance stage</span>
                </div>
              ) : (
                col.items.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
                  >
                    {/* Card Top */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                          #{quote.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                          {quote.customer_name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          ${(quote.total_price || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Risk & Items count */}
                    <div className="flex items-center justify-between gap-2 my-2.5">
                      <div className="flex items-center gap-1.5">
                        {getRiskBadge(quote.blended_risk_score)}
                        <span className="text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          {quote.lines ? quote.lines.length : 1} items
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {quote.created_at ? new Date(quote.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setSelectedQuote(quote)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-0.5"
                      >
                        View Details →
                      </button>

                      {/* Stage Advance Dropdown */}
                      <select
                        value={quote.status}
                        onChange={(e) => updateQuoteStatus(quote.id, e.target.value)}
                        className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 hover:border-indigo-300 focus:outline-none"
                      >
                        {STATUS_ORDER.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quote Detail Inspection Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-slate-400 uppercase">Proposal #{selectedQuote.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(selectedQuote.status)}`}>
                    {selectedQuote.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{selectedQuote.customer_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Created on {new Date(selectedQuote.created_at || Date.now()).toLocaleDateString()}</p>
              </div>

              <button
                onClick={() => setSelectedQuote(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500">Contract Total</span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">${(selectedQuote.total_price || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500">Discount Risk</span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {selectedQuote.blended_risk_score ? `${selectedQuote.blended_risk_score}%` : '0%'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500">Approval State</span>
                <div className="text-xs font-bold text-indigo-700 mt-1">
                  {selectedQuote.status === 'Confirmed' ? 'Approved & Closed' : selectedQuote.status === 'Pending Approval' ? 'In Review' : 'Active'}
                </div>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Proposal Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-center">Discount</th>
                      <th className="px-4 py-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedQuote.lines && selectedQuote.lines.length > 0 ? (
                      selectedQuote.lines.map((l, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 font-medium text-slate-900">
                            {l.product ? l.product.name : `Product #${l.product_id || i + 1}`}
                          </td>
                          <td className="px-3 py-2.5 text-center">{l.quantity || 1}</td>
                          <td className="px-3 py-2.5 text-center text-emerald-600 font-medium">{l.applied_discount || 0}%</td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            ${l.product ? (l.product.price * l.quantity).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-center text-slate-400">Standard enterprise package items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stage Movement Control */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Stage:</span>
                <select
                  value={selectedQuote.status}
                  onChange={(e) => updateQuoteStatus(selectedQuote.id, e.target.value)}
                  className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5"
                >
                  {STATUS_ORDER.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/portal/quote/${selectedQuote.id}`}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  View Client Portal →
                </a>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
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