import { useState, useEffect } from "react";

export default function ApprovalPanel({ quotationId }) {
  const [riskScore, setRiskScore] = useState(null);
  const [status, setStatus] = useState("");
  const [approvalLogs, setApprovalLogs] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (quotationId) {
      fetchQuotationDetails();
      fetchApprovalLogs();
    }
  }, [quotationId]);

  const fetchQuotationDetails = () => {
    fetch(`/api/quotations/${quotationId}`)
      .then(res => res.json())
      .then(data => {
        setRiskScore(data.blended_risk_score || 0);
        setStatus(data.status || "");
      })
      .catch(err => console.error("Error fetching quotation:", err));
  };

  const fetchApprovalLogs = () => {
    fetch(`/api/quotations/${quotationId}/approval-logs`)
      .then(res => res.json())
      .then(data => setApprovalLogs(data))
      .catch(err => console.error("Error fetching approval logs:", err));
  };

  const calculateRisk = () => {
    setIsCalculating(true);
    fetch(`/api/quotations/${quotationId}/calculate-risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(data => {
        setRiskScore(data.risk_score);
        setStatus(data.new_status);
        fetchApprovalLogs(); // Refresh logs to see new entry
      })
      .catch(err => console.error("Error calculating risk:", err))
      .finally(() => setIsCalculating(false));
  };

  const handleApprove = () => {
    setIsApproving(true);
    // In a real app, this would call an approve endpoint
    setTimeout(() => {
      setIsApproving(false);
      setStatus("Approved");
      // Add to approval logs
      const newLog = {
        id: Date.now(),
        reviewer_id: 1,
        action: "Approved",
        reason: "Approved by manager",
        timestamp: new Date().toISOString()
      };
      setApprovalLogs([...approvalLogs, newLog]);
    }, 500);
  };

  const handleReject = () => {
    setIsRejecting(true);
    // In a real app, this would call a reject endpoint
    setTimeout(() => {
      setIsRejecting(false);
      setStatus("Rejected");
      // Add to approval logs
      const newLog = {
        id: Date.now(),
        reviewer_id: 1,
        action: "Rejected",
        reason: "Rejected by manager - discount too high",
        timestamp: new Date().toISOString()
      };
      setApprovalLogs([...approvalLogs, newLog]);
    }, 500);
  };

  const getRiskLevel = () => {
    if (riskScore === null) return "Not Calculated";
    if (riskScore === 0) return "No Risk";
    if (riskScore <= 20) return "Low Risk";
    if (riskScore <= 50) return "Medium Risk";
    return "High Risk";
  };

  const getRiskColor = () => {
    if (riskScore === null) return "#95a5a6";
    if (riskScore === 0) return "#2ecc71";
    if (riskScore <= 20) return "#f39c12";
    if (riskScore <= 50) return "#e67e22";
    return "#e74c3c";
  };

  const getStatusColor = () => {
    switch (status) {
      case "Draft": return "#3498db";
      case "Pending": return "#f39c12";
      case "Pending Review": return "#e67e22";
      case "Approved": return "#2ecc71";
      case "Rejected": return "#e74c3c";
      case "Confirmed": return "#27ae60";
      default: return "#95a5a6";
    }
  };

  if (!quotationId) {
    return (
      <div className="approval-panel">
        <div className="panel-header">
          <h3>Approval Panel</h3>
        </div>
        <p>No quotation selected. Select a quotation to view approval details.</p>
      </div>
    );
  }

  return (
    <div className="approval-panel">
      <div className="panel-header">
        <h3>Approval Panel - Quotation #{quotationId}</h3>
        <div className="status-badge" style={{ backgroundColor: getStatusColor() }}>
          {status || "Unknown"}
        </div>
      </div>

      <div className="risk-section">
        <div className="risk-score">
          <div className="score-label">Risk Score</div>
          <div 
            className="score-value"
            style={{ 
              backgroundColor: getRiskColor(),
              color: riskScore === null || riskScore > 20 ? "white" : "black"
            }}
          >
            {riskScore !== null ? riskScore.toFixed(1) : "N/A"}
          </div>
          <div className="risk-level">{getRiskLevel()}</div>
        </div>

        <button 
          onClick={calculateRisk} 
          disabled={isCalculating}
          className="btn-primary"
        >
          {isCalculating ? "Calculating..." : "Calculate Risk"}
        </button>
      </div>

      <div className="approval-actions">
        <button 
          onClick={handleApprove}
          disabled={status === "Approved" || isApproving || isRejecting}
          className="btn-approve"
        >
          {isApproving ? "Approving..." : "Approve"}
        </button>
        <button 
          onClick={handleReject}
          disabled={status === "Rejected" || isApproving || isRejecting}
          className="btn-reject"
        >
          {isRejecting ? "Rejecting..." : "Reject"}
        </button>
      </div>

      <div className="approval-logs">
        <h4>Approval History</h4>
        {approvalLogs.length === 0 ? (
          <p>No approval history available.</p>
        ) : (
          <div className="logs-list">
            {approvalLogs.map(log => (
              <div key={log.id} className="log-entry">
                <div className="log-header">
                  <span className="log-action">{log.action}</span>
                  <span className="log-timestamp">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
                {log.reason && (
                  <div className="log-reason">{log.reason}</div>
                )}
                <div className="log-reviewer">Reviewer ID: {log.reviewer_id}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .approval-panel {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .status-badge {
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .risk-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }
        
        .risk-score {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .score-label {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        
        .score-value {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        .risk-level {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .approval-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }
        
        .btn-primary {
          background: #2c3e50;
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .btn-primary:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }
        
        .btn-approve {
          background: #2ecc71;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          flex: 1;
        }
        
        .btn-approve:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .btn-reject {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          flex: 1;
        }
        
        .btn-reject:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .approval-logs h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .logs-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .log-entry {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        
        .log-entry:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .log-action {
          font-weight: 500;
          color: #2c3e50;
        }
        
        .log-timestamp {
          font-size: 0.875rem;
          color: #666;
        }
        
        .log-reason {
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .log-reviewer {
          font-size: 0.875rem;
          color: #666;
        }
      `}</style>
    </div>
  );
}