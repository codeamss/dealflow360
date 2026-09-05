import { useState, useEffect } from "react";
import { quotations as mockQuotations } from "../mockData.js";

export default function ApprovalPanel() {
  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState(1002);
  const [riskScore, setRiskScore] = useState(35);
  const [status, setStatus] = useState("Pending Approval");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalLogs, setApprovalLogs] = useState([
    {
      id: 1,
      reviewer: "Alex Johnson",
      role: "Sales Rep",
      action: "Submitted for Approval",
      reason: "Discount of 15% requested for enterprise volume purchase",
      timestamp: "2026-09-02T14:15:00Z"
    },
    {
      id: 2,
      reviewer: "Sarah Chen",
      role: "Sales Manager",
      action: "Reviewed",
      reason: "Exceeds standard 10% tier; requires executive sign-off",
      timestamp: "2026-09-02T16:30:00Z"
    }
  ]);

  // Load quotes from mockData + localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dealflow360_custom_quotes");
      const customQuotes = saved ? JSON.parse(saved) : [];
      const merged = [...customQuotes, ...mockQuotations];
      setQuotes(merged);

      // Default to quote 1002 or first pending quote
      const pendingQuote = merged.find(q => q.status === "Pending Approval") || merged[0];
      if (pendingQuote) {
        setSelectedQuoteId(pendingQuote.id);
        setStatus(pendingQuote.status || "Pending Approval");
        setRiskScore(pendingQuote.blended_risk_score || 35);
      }
    } catch (e) {
      console.warn("Could not load quotes for approval panel:", e);
      setQuotes(mockQuotations);
    }
  }, []);

  // When selected quote changes, update view
  const handleSelectQuote = (id) => {
    const qId = parseInt(id);
    setSelectedQuoteId(qId);
    const q = quotes.find(item => item.id === qId);
    if (q) {
      setStatus(q.status || "Pending Approval");
      setRiskScore(q.blended_risk_score !== undefined ? q.blended_risk_score : 25);
      setApprovalLogs(prev => [
        {
          id: Date.now(),
          reviewer: "System",
          role: "Audit Log",
          action: "Loaded Quotation",
          reason: `Loaded quote #${q.id} for ${q.customer_name}`,
          timestamp: new Date().toISOString()
        },
        ...prev.slice(0, 3)
      ]);
    }
  };

  const currentQuote = quotes.find(q => q.id === selectedQuoteId) || quotes[0] || {
    id: 1002,
    customer_name: "Global Tech Inc",
    status: "Pending Approval",
    total_price: 25600,
    lines: []
  };

  const updateQuoteStatusInStorage = (newStatus) => {
    try {
      const saved = localStorage.getItem("dealflow360_custom_quotes");
      let customQuotes = saved ? JSON.parse(saved) : [];
      const existsInCustom = customQuotes.some(q => q.id === selectedQuoteId);
      
      if (existsInCustom) {
        customQuotes = customQuotes.map(q => 
          q.id === selectedQuoteId ? { ...q, status: newStatus, blended_risk_score: riskScore } : q
        );
      } else {
        // Add as custom override
        customQuotes.unshift({
          ...currentQuote,
          status: newStatus,
          blended_risk_score: riskScore
        });
      }
      localStorage.setItem("dealflow360_custom_quotes", JSON.stringify(customQuotes));
      
      // Update local state quotes
      setQuotes(prev => prev.map(q => q.id === selectedQuoteId ? { ...q, status: newStatus } : q));
    } catch (e) {
      console.warn("Could not persist quote update:", e);
    }
  };

  const handleApprove = () => {
    const newLog = {
      id: Date.now(),
      reviewer: "Sarah Chen",
      role: "Sales Director",
      action: "Approved",
      reason: `Quotation #${selectedQuoteId} approved for order execution`,
      timestamp: new Date().toISOString()
    };
    setApprovalLogs([newLog, ...approvalLogs]);
    setStatus("Approved");
    updateQuoteStatusInStorage("Approved");
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(`Quotation #${selectedQuoteId} approved successfully`, "success");
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Please provide a reason for rejection", "error");
      }
      return;
    }
    
    const newLog = {
      id: Date.now(),
      reviewer: "Sarah Chen",
      role: "Sales Director",
      action: "Rejected",
      reason: rejectionReason,
      timestamp: new Date().toISOString()
    };
    setApprovalLogs([newLog, ...approvalLogs]);
    setStatus("Rejected");
    updateQuoteStatusInStorage("Rejected");
    setShowRejectModal(false);
    setRejectionReason("");
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(`Quotation #${selectedQuoteId} rejected`, "error");
    }
  };

  const handleReturn = () => {
    const newLog = {
      id: Date.now(),
      reviewer: "Sarah Chen",
      role: "Sales Director",
      action: "Returned for Revision",
      reason: "Discount exceeds margin threshold. Lower line discounts by 5% or increase volume commitment.",
      timestamp: new Date().toISOString()
    };
    setApprovalLogs([newLog, ...approvalLogs]);
    setStatus("Draft");
    updateQuoteStatusInStorage("Draft");
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(`Quotation #${selectedQuoteId} returned for revision`, "info");
    }
  };

  const calculateRisk = () => {
    // Dynamic risk based on total price and discount
    let calculated = 15;
    if (currentQuote.lines && currentQuote.lines.length > 0) {
      const avgDiscount = currentQuote.lines.reduce((sum, l) => sum + (l.applied_discount || 0), 0) / currentQuote.lines.length;
      calculated = Math.min(Math.round(avgDiscount * 2.2 + (currentQuote.total_price > 20000 ? 12 : 5)), 95);
    } else {
      calculated = Math.floor(Math.random() * 30) + 15;
    }

    setRiskScore(calculated);
    const newLog = {
      id: Date.now(),
      reviewer: "Risk Engine AI",
      role: "Automated Governance",
      action: "Risk Evaluated",
      reason: `Recalculated blended risk index to ${calculated}% based on line item margins & credit history`,
      timestamp: new Date().toISOString()
    };
    setApprovalLogs([newLog, ...approvalLogs]);
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(`Risk recalculated: ${calculated}%`, "info");
    }
  };

  const getRiskLevel = () => {
    if (riskScore <= 15) return { level: "Low", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (riskScore <= 30) return { level: "Medium", color: "bg-amber-50 text-amber-700 border-amber-200" };
    if (riskScore <= 50) return { level: "High", color: "bg-orange-50 text-orange-700 border-orange-200" };
    return { level: "Critical", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  const getStatusBadge = () => {
    switch (status) {
      case "Approved":
      case "Confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Pending Approval":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  const riskLevel = getRiskLevel();

  return (
    <div className="space-y-6">
      {/* Top Header Card with Quote Selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Governance & Approval Hub</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge()}`}>
                {status}
              </span>
            </div>
            <p className="text-slate-600 text-sm mt-1">
              Multi-tiered policy evaluation and executive authorization engine
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Quote:</label>
            <select
              value={selectedQuoteId}
              onChange={(e) => handleSelectQuote(e.target.value)}
              className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
            >
              {quotes.map(q => (
                <option key={q.id} value={q.id}>
                  #{q.id} - {q.customer_name} (${(q.total_price || 0).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Quote Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Customer</span>
            <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{currentQuote.customer_name}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Quoted Total</span>
            <p className="text-sm font-bold text-indigo-600 mt-0.5">${(currentQuote.total_price || 0).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Line Items</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{currentQuote.lines ? currentQuote.lines.length : 0} items</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Policy Tier</span>
            <p className="text-sm font-bold text-amber-700 mt-0.5">Tier 2 (Manager + VP)</p>
          </div>
        </div>
      </div>

      {/* Risk Assessment Block */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Algorithmic Risk Assessment</h3>
            <p className="text-xs text-slate-500 mt-0.5">Blended risk index evaluating discount depth, margin floor, and credit exposure</p>
          </div>
          <button
            onClick={calculateRisk}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all"
          >
            <svg className="w-4 h-4 mr-1.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recalculate Risk
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="text-center p-6 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="text-5xl font-black text-slate-900 tracking-tight mb-2">{riskScore}%</div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-2 ${riskLevel.color}`}>
              {riskLevel.level} Risk Index
            </div>
            <p className="text-xs text-slate-500">
              Auto-triggers VP authorization when score exceeds 30%
            </p>
          </div>
          
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-600">Discount Deviation Risk</span>
                <span className="font-bold text-slate-900">{Math.min(riskScore + 8, 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(riskScore + 8, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-600">Customer Credit Health</span>
                <span className="font-bold text-slate-900">{Math.max(100 - riskScore, 10)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(100 - riskScore, 10)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-600">Net Margin Cushion</span>
                <span className="font-bold text-slate-900">{Math.max(85 - riskScore, 5)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(85 - riskScore, 5)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 text-base mb-4">Executive Actions</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={handleApprove}
            disabled={status === "Approved" || status === "Confirmed"}
            className={`px-5 py-3.5 rounded-lg text-sm font-semibold flex items-center justify-center transition-all shadow-sm ${
              status === "Approved" || status === "Confirmed"
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]"
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {status === "Approved" ? "Already Approved" : "Approve Quotation"}
          </button>
          
          <button
            onClick={handleReturn}
            className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold flex items-center justify-center shadow-sm transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Return for Revision
          </button>
          
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={status === "Rejected"}
            className={`px-5 py-3.5 rounded-lg text-sm font-semibold flex items-center justify-center transition-all shadow-sm ${
              status === "Rejected"
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 active:scale-[0.98]"
            }`}
          >
            <svg className="w-5 h-5 mr-2 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {status === "Rejected" ? "Rejected" : "Reject Quotation"}
          </button>
        </div>
      </div>

      {/* Modal for Rejection */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.948-.833-2.678 0L4.196 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Quotation #{selectedQuoteId}</h3>
                <p className="text-xs text-slate-500">Provide formal feedback for the sales representative</p>
              </div>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Specify the reason for rejection (e.g., margins under minimum floor, unapproved extended payment terms)..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder:text-slate-400"
              rows={4}
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all shadow-sm active:scale-[0.98]"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Tier Governance Progression */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 text-base mb-4">Governance Policy Gates</h3>
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
            status === "Approved" || status === "Confirmed"
              ? "bg-emerald-50/70 border-emerald-200" 
              : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs mr-3.5 ${
                status === "Approved" || status === "Confirmed"
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-200 text-slate-700"
              }`}>
                1
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900">Commercial Sales Director Approval</div>
                <div className="text-xs text-slate-500">Mandatory for all quotes with discounts above 10%</div>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
              status === "Approved" || status === "Confirmed"
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-amber-100 text-amber-800 border-amber-300"
            }`}>
              {status === "Approved" || status === "Confirmed" ? "Passed" : "Awaiting Action"}
            </span>
          </div>
          
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
            riskScore > 30 ? "bg-amber-50/70 border-amber-200" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs mr-3.5 ${
                riskScore > 30 ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                2
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900">Finance & Credit Controller Sign-Off</div>
                <div className="text-xs text-slate-500">Required when algorithmic risk index exceeds 30%</div>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
              riskScore > 30 
                ? "bg-amber-100 text-amber-800 border-amber-300" 
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              {riskScore > 30 ? "Gate Active" : "Bypassed (Low Risk)"}
            </span>
          </div>
        </div>
      </div>

      {/* Approval Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 text-base mb-4">Immutable Audit Trail</h3>
        <div className="space-y-3">
          {approvalLogs.map((log) => (
            <div key={log.id} className="border-l-4 border-indigo-600 pl-4 py-3 bg-slate-50/60 rounded-r-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{log.reviewer}</div>
                  <div className="text-xs text-indigo-700 font-medium mt-0.5">{log.role} &bull; {log.action}</div>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {log.reason && (
                <div className="mt-2 text-slate-700 bg-white p-2.5 rounded border border-slate-200 text-xs">
                  {log.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}