import { useState } from "react";

export default function ApprovalPanel() {
  const [riskScore, setRiskScore] = useState(28);
  const [status, setStatus] = useState("Pending Approval");
  const [approvalLogs, setApprovalLogs] = useState([
    {
      id: 1,
      reviewer: "Alex Johnson",
      role: "Sales Rep",
      action: "Submitted for Approval",
      reason: "Quote ready for manager review",
      timestamp: "2026-09-05T10:30:00Z"
    },
    {
      id: 2,
      reviewer: "Sarah Chen",
      role: "Sales Manager",
      action: "Reviewed",
      reason: "Discount threshold exceeded, needs finance approval",
      timestamp: "2026-09-05T11:45:00Z"
    }
  ]);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = () => {
    const newLog = {
      id: Date.now(),
      reviewer: "Current User",
      role: "Approver",
      action: "Approved",
      reason: "All criteria met, approved for fulfillment",
      timestamp: new Date().toISOString()
    };
    setApprovalLogs([newLog, ...approvalLogs]);
    setStatus("Approved");
    console.log("✅ Quotation approved");
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    
    const newLog = {
      id: Date.now(),
      reviewer: "Current User",
      role: "Approver",
      action: "Rejected",
      reason: rejectionReason,
      timestamp: new Date().toISOString()
    };
    setApprovalLogs([newLog, ...approvalLogs]);
    setStatus("Rejected");
    setRejectionReason("");
    console.log("❌ Quotation rejected:", rejectionReason);
  };

  const handleReturn = () => {
    const newLog = {
      id: Date.now(),
      reviewer: "Current User",
      role: "Approver",
      action: "Returned for Revision",
      reason: "Needs additional documentation and discount justification",
      timestamp: new Date().toISOString()
    };
    setApprovalLogs([newLog, ...approvalLogs]);
    setStatus("Returned");
    console.log("↩️ Quotation returned for revision");
  };

  const calculateRisk = () => {
    // Simulate risk calculation
    const newRiskScore = Math.floor(Math.random() * 50) + 1;
    setRiskScore(newRiskScore);
    
    const newLog = {
      id: Date.now(),
      reviewer: "System",
      role: "Risk Engine",
      action: "Risk Recalculated",
      reason: `New blended risk score: ${newRiskScore}%`,
      timestamp: new Date().toISOString()
    };
    setApprovalLogs([newLog, ...approvalLogs]);
    console.log("📊 Risk score calculated:", newRiskScore);
  };

  const getRiskLevel = () => {
    if (riskScore <= 10) return { level: "Low", color: "bg-green-100 text-green-800" };
    if (riskScore <= 25) return { level: "Medium", color: "bg-yellow-100 text-yellow-800" };
    if (riskScore <= 40) return { level: "High", color: "bg-orange-100 text-orange-800" };
    return { level: "Critical", color: "bg-red-100 text-red-800" };
  };

  const getStatusColor = () => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Returned": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const riskLevel = getRiskLevel();

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Approval Panel</h2>
            <p className="text-slate-600 text-sm mt-1">Review and approve quotations with risk assessment</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor().replace('bg-', 'bg-').replace('text-', 'text-')} border-slate-200`}>
            {status}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-900 text-lg">Risk Assessment</h3>
            <button
              onClick={calculateRisk}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium rounded-lg shadow-sm transition-all"
            >
              Recalculate Risk
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
              <div className="text-5xl font-bold text-slate-900 mb-3">{riskScore}%</div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium border mb-4 ${riskLevel.color.replace('bg-', 'bg-').replace('text-', 'text-')} border-slate-200`}>
                {riskLevel.level} Risk
              </div>
              <div className="text-sm text-slate-600">
                Blended risk score across all quotation lines
              </div>
            </div>
            
            <div className="lg:col-span-2 space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-700 font-medium">Discount Risk</span>
                  <span className="font-semibold text-slate-900">{Math.min(riskScore + 10, 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(riskScore + 10, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-700 font-medium">Customer Credit</span>
                  <span className="font-semibold text-slate-900">{Math.max(100 - riskScore, 0)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${Math.max(100 - riskScore, 0)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-700 font-medium">Margin Safety</span>
                  <span className="font-semibold text-slate-900">{Math.max(80 - riskScore, 0)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${Math.max(80 - riskScore, 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Actions */}
        <div className="mb-8">
          <h3 className="font-semibold text-slate-900 text-lg mb-5">Approval Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <button
              onClick={handleApprove}
              disabled={status === "Approved"}
              className={`px-6 py-4 rounded-xl font-medium flex items-center justify-center transition-all ${
                status === "Approved"
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve Quotation
            </button>
            
            <button
              onClick={handleReturn}
              className="px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-medium flex items-center justify-center shadow-sm transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Return for Revision
            </button>
            
            <button
              onClick={() => document.getElementById('reject-modal').classList.remove('hidden')}
              disabled={status === "Rejected"}
              className={`px-6 py-4 rounded-xl font-medium flex items-center justify-center transition-all ${
                status === "Rejected"
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Quotation
            </button>
          </div>

          {/* Rejection Modal */}
          <div id="reject-modal" className="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-96 shadow-2xl rounded-xl bg-white border-slate-200">
              <div className="mt-2">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Reject Quotation</h3>
                <div className="mt-2">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejection..."
                    className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 placeholder:text-slate-400 text-sm"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => document.getElementById('reject-modal').classList.add('hidden')}
                    className="px-4 py-2.5 text-slate-700 hover:text-slate-900 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleReject();
                      document.getElementById('reject-modal').classList.add('hidden');
                    }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-sm active:scale-[0.98] transition-all"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Workflow */}
        <div className="mb-8">
          <h3 className="font-semibold text-slate-900 text-lg mb-5">Approval Workflow</h3>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              status === "Approved" ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                  status === "Approved" ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"
                }`}>
                  1
                </div>
                <div>
                  <div className="font-medium text-slate-900">Sales Manager Approval</div>
                  <div className="text-sm text-slate-600">Required for discounts over 15%</div>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                status === "Approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                {status === "Approved" ? "✓ Approved" : "Pending"}
              </div>
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              riskScore > 25 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                  riskScore > 25 ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-600"
                }`}>
                  2
                </div>
                <div>
                  <div className="font-medium text-slate-900">Finance Department Review</div>
                  <div className="text-sm text-slate-600">Required when risk score exceeds 25%</div>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                riskScore > 25 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                {riskScore > 25 ? "Required" : "Not Required"}
              </div>
            </div>
          </div>
        </div>

        {/* Approval History */}
        <div>
          <h3 className="font-semibold text-slate-900 text-lg mb-5">Approval History</h3>
          <div className="space-y-4">
            {approvalLogs.map((log) => (
              <div key={log.id} className="border-l-4 border-indigo-500 pl-4 py-4 bg-gradient-to-r from-white to-slate-50 rounded-r-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-slate-900 text-sm">{log.reviewer}</div>
                    <div className="text-xs text-slate-600 mt-1">{log.role} • {log.action}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {log.reason && (
                  <div className="mt-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                    {log.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}