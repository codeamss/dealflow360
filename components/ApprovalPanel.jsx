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
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Approval Panel</h2>
            <p className="text-gray-600">Review and approve quotations with risk assessment</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-medium ${getStatusColor()}`}>
            {status}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
            <button
              onClick={calculateRisk}
              className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 text-sm font-medium"
            >
              Recalculate Risk
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl font-bold text-gray-900 mb-2">{riskScore}%</div>
              <div className={`px-3 py-1 rounded-full font-medium inline-block ${riskLevel.color}`}>
                {riskLevel.level} Risk
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Blended risk score across all quotation lines
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Discount Risk</span>
                  <span className="font-medium">{Math.min(riskScore + 10, 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(riskScore + 10, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Customer Credit</span>
                  <span className="font-medium">{Math.max(100 - riskScore, 0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${Math.max(100 - riskScore, 0)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Margin Safety</span>
                  <span className="font-medium">{Math.max(80 - riskScore, 0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.max(80 - riskScore, 0)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Actions */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Approval Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={handleApprove}
              disabled={status === "Approved"}
              className={`px-6 py-4 rounded-lg font-medium flex items-center justify-center ${
                status === "Approved"
                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve Quotation
            </button>
            
            <button
              onClick={handleReturn}
              className="px-6 py-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 font-medium flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Return for Revision
            </button>
            
            <button
              onClick={() => document.getElementById('reject-modal').classList.remove('hidden')}
              disabled={status === "Rejected"}
              className={`px-6 py-4 rounded-lg font-medium flex items-center justify-center ${
                status === "Rejected"
                  ? 'bg-red-100 text-red-800 cursor-not-allowed'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Quotation
            </button>
          </div>

          {/* Rejection Modal */}
          <div id="reject-modal" className="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Quotation</h3>
                <div className="mt-2">
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 h-32"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => document.getElementById('reject-modal').classList.add('hidden')}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleReject();
                      document.getElementById('reject-modal').classList.add('hidden');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
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
          <h3 className="font-semibold text-gray-900 mb-4">Approval Workflow</h3>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              status === "Approved" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  status === "Approved" ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-600"
                }`}>
                  1
                </div>
                <div>
                  <div className="font-medium text-gray-900">Sales Manager Approval</div>
                  <div className="text-sm text-gray-600">Required for discounts over 15%</div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === "Approved" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}>
                {status === "Approved" ? "✓ Approved" : "Pending"}
              </div>
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              riskScore > 25 ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  riskScore > 25 ? "bg-yellow-100 text-yellow-600" : "bg-gray-200 text-gray-600"
                }`}>
                  2
                </div>
                <div>
                  <div className="font-medium text-gray-900">Finance Department Review</div>
                  <div className="text-sm text-gray-600">Required when risk score exceeds 25%</div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                riskScore > 25 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
              }`}>
                {riskScore > 25 ? "Required" : "Not Required"}
              </div>
            </div>
          </div>
        </div>

        {/* Approval History */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Approval History</h3>
          <div className="space-y-4">
            {approvalLogs.map((log) => (
              <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{log.reviewer}</div>
                    <div className="text-sm text-gray-600">{log.role} • {log.action}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {log.reason && (
                  <div className="mt-2 text-gray-700 bg-gray-50 p-3 rounded-md">
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