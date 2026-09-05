import { useState, useEffect } from "react";
import { quotations } from "../mockData.js";

const STATUS_ORDER = ["Draft", "Pending Approval", "Negotiation", "Confirmed"];

export default function PipelineKanban() {
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Filter quotations based on search term
    if (searchTerm.trim() === "") {
      setFilteredQuotations(quotations);
    } else {
      const filtered = quotations.filter(q =>
        q.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.id.toString().includes(searchTerm)
      );
      setFilteredQuotations(filtered);
    }
  }, [searchTerm]);

  // Initialize with all quotations
  useEffect(() => {
    setFilteredQuotations(quotations);
  }, []);

  // Group quotations by status
  const columns = STATUS_ORDER.map((status) => ({
    status,
    items: filteredQuotations.filter((q) => q.status === status),
  }));

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Draft": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Pending Approval": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Negotiation": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Confirmed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft": return "bg-blue-100 border-blue-200";
      case "Pending Approval": return "bg-amber-100 border-amber-200";
      case "Negotiation": return "bg-orange-100 border-orange-200";
      case "Confirmed": return "bg-emerald-100 border-emerald-200";
      default: return "bg-slate-100 border-slate-200";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "Draft": return "text-blue-800";
      case "Pending Approval": return "text-amber-800";
      case "Negotiation": return "text-orange-800";
      case "Confirmed": return "text-emerald-800";
      default: return "text-slate-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-600 text-sm">Track and manage all quotations in real-time</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by customer or ID..."
              className="pl-10 pr-4 py-2.5 text-sm w-72 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <a href="/quotation/new" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm active:scale-[0.98] transition-all">
            New Quotation
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map((col) => (
          <div key={col.status} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className={`px-4 py-3 rounded-lg mb-4 ${getStatusColor(col.status)}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusTextColor(col.status).replace('text-', 'bg-')}`}></div>
                  <h3 className={`font-semibold text-sm ${getStatusTextColor(col.status)}`}>
                    {col.status}
                  </h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(col.status)}`}>
                  {col.items.length}
                </span>
              </div>
            </div>
            <div className="space-y-4 min-h-[400px]">
              {col.items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">No quotations</p>
                  <p className="text-xs text-slate-500 mt-1">Drag & drop to add items</p>
                </div>
              ) : (
                col.items.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 transition-all cursor-pointer hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">#{quote.id}</div>
                        <div className="font-medium text-slate-900 text-sm">{quote.customer_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-slate-900">${quote.total_price.toLocaleString()}</div>
                        {quote.blended_risk_score > 0 && (
                          <div className={`text-xs px-2.5 py-1 rounded-full mt-1 ${
                            quote.blended_risk_score > 30 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            quote.blended_risk_score > 15 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            Risk: {quote.blended_risk_score}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 mb-3">
                      {quote.lines.length} item{quote.lines.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">
                        {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                        View Details →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-5">Pipeline Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="text-center p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <div className="text-3xl font-bold text-slate-900">{quotations.length}</div>
            <div className="text-sm text-slate-600 mt-1">Total Quotes</div>
          </div>
          <div className="text-center p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <div className="text-3xl font-bold text-slate-900">
              ${quotations.reduce((sum, q) => sum + q.total_price, 0).toLocaleString()}
            </div>
            <div className="text-sm text-slate-600 mt-1">Total Value</div>
          </div>
          <div className="text-center p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <div className="text-3xl font-bold text-slate-900">
              {quotations.filter(q => q.status === "Pending Approval").length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Pending Approval</div>
          </div>
          <div className="text-center p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <div className="text-3xl font-bold text-slate-900">
              {quotations.filter(q => q.status === "Confirmed").length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Confirmed</div>
          </div>
        </div>
      </div>
    </div>
  );
}