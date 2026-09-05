import { useState } from "react";

export default function NegotiationBox({ quotationId, isCustomerView = false }) {
  const [counterDiscount, setCounterDiscount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [negotiationHistory, setNegotiationHistory] = useState([
    {
      id: 1,
      type: "internal",
      message: "Initial quote sent with 15% discount",
      discount: 15,
      timestamp: "2026-09-04T10:30:00Z",
      user: "Sales Rep"
    },
    {
      id: 2,
      type: "customer",
      message: "Can you do 20%? Budget constraints",
      discount: 20,
      timestamp: "2026-09-04T14:45:00Z",
      user: "Customer"
    }
  ]);

  const handleSubmitCounter = () => {
    if (!counterDiscount || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // In a real app, this would call a negotiation API
    setTimeout(() => {
      const newNegotiation = {
        id: Date.now(),
        type: isCustomerView ? "customer" : "internal",
        message: counterMessage || `Counter offer: ${counterDiscount}% discount`,
        discount: parseFloat(counterDiscount),
        timestamp: new Date().toISOString(),
        user: isCustomerView ? "Customer" : "Sales Rep"
      };
      
      setNegotiationHistory([newNegotiation, ...negotiationHistory]);
      setCounterDiscount("");
      setCounterMessage("");
      setIsSubmitting(false);
    }, 500);
  };

  const calculateCurrentDiscount = () => {
    if (negotiationHistory.length === 0) return 0;
    // Return the most recent discount proposal
    return negotiationHistory[0].discount;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDiscountColor = (discount) => {
    if (discount <= 10) return "#2ecc71";
    if (discount <= 20) return "#f39c12";
    if (discount <= 30) return "#e67e22";
    return "#e74c3c";
  };

  return (
    <div className="negotiation-box">
      <div className="negotiation-header">
        <h3>Negotiation</h3>
        <div className="current-discount">
          <span>Current Offer:</span>
          <div 
            className="discount-badge"
            style={{ backgroundColor: getDiscountColor(calculateCurrentDiscount()) }}
          >
            {calculateCurrentDiscount()}%
          </div>
        </div>
      </div>

      <div className="negotiation-form">
        <div className="form-group">
          <label htmlFor="counterDiscount">Counter Discount (%)</label>
          <input
            type="number"
            id="counterDiscount"
            value={counterDiscount}
            onChange={(e) => setCounterDiscount(e.target.value)}
            min="0"
            max="100"
            step="0.5"
            placeholder="Enter discount percentage"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="counterMessage">Message (Optional)</label>
          <textarea
            id="counterMessage"
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            placeholder="Add a message to explain your counter offer..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>
        
        <button
          onClick={handleSubmitCounter}
          disabled={!counterDiscount || isSubmitting}
          className="btn-submit"
        >
          {isSubmitting ? "Submitting..." : "Submit Counter Offer"}
        </button>
      </div>

      <div className="negotiation-history">
        <h4>Negotiation History</h4>
        {negotiationHistory.length === 0 ? (
          <p className="no-history">No negotiation history yet.</p>
        ) : (
          <div className="history-timeline">
            {negotiationHistory.map((item) => (
              <div 
                key={item.id} 
                className={`history-item ${item.type}`}
              >
                <div className="item-header">
                  <div className="item-user">
                    <div className={`user-badge ${item.type}`}>
                      {item.type === "customer" ? "👤" : "🏢"}
                    </div>
                    <span className="user-name">{item.user}</span>
                  </div>
                  <div className="item-meta">
                    <div 
                      className="item-discount"
                      style={{ color: getDiscountColor(item.discount) }}
                    >
                      {item.discount}%
                    </div>
                    <div className="item-time">
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="item-message">
                  {item.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .negotiation-box {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .negotiation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
        
        .current-discount {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .current-discount span {
          font-size: 0.875rem;
          color: #666;
        }
        
        .discount-badge {
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .negotiation-form {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.875rem;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        
        .btn-submit {
          background: #2c3e50;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          width: 100%;
        }
        
        .btn-submit:hover:not(:disabled) {
          background: #34495e;
        }
        
        .btn-submit:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .negotiation-history h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .no-history {
          text-align: center;
          padding: 2rem;
          color: #666;
          font-style: italic;
        }
        
        .history-timeline {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        
        .history-item {
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 8px;
          background: #f8f9fa;
          border-left: 4px solid #ddd;
        }
        
        .history-item.customer {
          border-left-color: #3498db;
          background: #f0f8ff;
        }
        
        .history-item.internal {
          border-left-color: #2ecc71;
          background: #f0fff4;
        }
        
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .item-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .user-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }
        
        .user-badge.customer {
          background: #ebf5ff;
          color: #3498db;
        }
        
        .user-badge.internal {
          background: #ebffeb;
          color: #2ecc71;
        }
        
        .user-name {
          font-weight: 500;
          color: #333;
        }
        
        .item-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
        }
        
        .item-discount {
          font-weight: 500;
          font-size: 1rem;
        }
        
        .item-time {
          color: #666;
        }
        
        .item-message {
          color: #333;
          line-height: 1.4;
        }
        
        /* Scrollbar styling */
        .history-timeline::-webkit-scrollbar {
          width: 6px;
        }
        
        .history-timeline::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .history-timeline::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;
        }
        
        .history-timeline::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
      `}</style>
    </div>
  );
}