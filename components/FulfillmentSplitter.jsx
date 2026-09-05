import { useState, useEffect } from "react";

export default function FulfillmentSplitter({ quotationId }) {
  const [splitData, setSplitData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const [customSplit, setCustomSplit] = useState({});
  const [warehouses, setWarehouses] = useState([
    { id: 1, name: "Warehouse A", location: "East Coast" },
    { id: 2, name: "Warehouse B", location: "Midwest" },
    { id: 3, name: "Warehouse C", location: "West Coast" }
  ]);

  useEffect(() => {
    if (quotationId && !manualOverride) {
      fetchSplitSuggestion();
    }
  }, [quotationId, manualOverride]);

  const fetchSplitSuggestion = () => {
    setIsLoading(true);
    setError("");
    
    fetch(`/api/quotations/${quotationId}/split-fulfillment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ manual_override: false })
    })
      .then(res => res.json())
      .then(data => {
        if (data.suggestion && data.suggestion !== "No physical items to split.") {
          // Parse the suggestion string to extract warehouse quantities
          const allocations = {};
          const parts = data.suggestion.split(",");
          
          parts.forEach(part => {
            const match = part.match(/Warehouse\s+([A-C])\((\d+)\)/);
            if (match) {
              const warehouseId = match[1].charCodeAt(0) - 64; // A=1, B=2, C=3
              const quantity = parseInt(match[2]);
              allocations[warehouseId] = quantity;
            }
          });
          
          setSplitData({
            ...data,
            allocations
          });
          
          // Initialize custom split with suggested allocations
          if (!Object.keys(customSplit).length) {
            setCustomSplit(allocations);
          }
        } else {
          setSplitData(data);
        }
      })
      .catch(err => {
        setError("Failed to fetch split suggestion");
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  };

  const handleOverrideToggle = () => {
    setManualOverride(!manualOverride);
  };

  const updateCustomAllocation = (warehouseId, quantity) => {
    const qty = parseInt(quantity) || 0;
    setCustomSplit(prev => ({
      ...prev,
      [warehouseId]: qty
    }));
  };

  const calculateTotalRequested = () => {
    if (splitData?.details?.total_requested) {
      return splitData.details.total_requested;
    }
    // Fallback calculation
    return Object.values(customSplit).reduce((sum, qty) => sum + qty, 0);
  };

  const calculateUnmetUnits = () => {
    const totalAllocated = Object.values(customSplit).reduce((sum, qty) => sum + qty, 0);
    return calculateTotalRequested() - totalAllocated;
  };

  const applyCustomSplit = () => {
    if (!manualOverride) return;
    
    // In a real app, this would send the custom split to the backend
    const suggestion = warehouses
      .filter(wh => customSplit[wh.id] > 0)
      .map(wh => `${wh.name}(${customSplit[wh.id]})`)
      .join(", ");
    
    const unmet = calculateUnmetUnits();
    
    setSplitData({
      quotation_id: quotationId,
      manual_override: true,
      suggestion: suggestion || "No allocation",
      unmet_units: unmet,
      details: {
        total_requested: calculateTotalRequested()
      }
    });
  };

  const getWarehouseColor = (warehouseId) => {
    const colors = ["#3498db", "#2ecc71", "#e74c3c"];
    return colors[(warehouseId - 1) % colors.length];
  };

  const renderAutoSplit = () => {
    if (!splitData) return null;
    
    if (splitData.suggestion === "No physical items to split.") {
      return (
        <div className="no-items">
          <p>{splitData.suggestion}</p>
        </div>
      );
    }
    
    return (
      <div className="split-visualization">
        <div className="split-summary">
          <h4>Suggested Split:</h4>
          <p className="suggestion-text">{splitData.suggestion}</p>
          {splitData.unmet_units > 0 && (
            <div className="unmet-warning">
              ⚠️ {splitData.unmet_units} units cannot be fulfilled from current inventory
            </div>
          )}
        </div>
        
        <div className="warehouse-allocation">
          <h4>Allocation by Warehouse:</h4>
          <div className="warehouse-bars">
            {warehouses.map(warehouse => {
              const qty = splitData.allocations?.[warehouse.id] || 0;
              const percentage = (qty / calculateTotalRequested()) * 100 || 0;
              
              return (
                <div key={warehouse.id} className="warehouse-bar">
                  <div className="warehouse-info">
                    <span className="warehouse-name">{warehouse.name}</span>
                    <span className="warehouse-qty">{qty} units</span>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getWarehouseColor(warehouse.id)
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderManualSplit = () => {
    return (
      <div className="manual-split">
        <div className="split-header">
          <h4>Manual Allocation</h4>
          <p>Drag sliders to allocate units to warehouses:</p>
        </div>
        
        <div className="warehouse-controls">
          {warehouses.map(warehouse => (
            <div key={warehouse.id} className="warehouse-control">
              <div className="control-header">
                <span className="warehouse-name" style={{ color: getWarehouseColor(warehouse.id) }}>
                  {warehouse.name}
                </span>
                <span className="warehouse-location">{warehouse.location}</span>
              </div>
              
              <div className="control-input">
                <input
                  type="range"
                  min="0"
                  max={calculateTotalRequested()}
                  value={customSplit[warehouse.id] || 0}
                  onChange={(e) => updateCustomAllocation(warehouse.id, e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max={calculateTotalRequested()}
                  value={customSplit[warehouse.id] || 0}
                  onChange={(e) => updateCustomAllocation(warehouse.id, e.target.value)}
                  className="qty-input"
                />
                <span className="qty-label">units</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="allocation-summary">
          <div className="summary-item">
            <span>Total Requested:</span>
            <strong>{calculateTotalRequested()} units</strong>
          </div>
          <div className="summary-item">
            <span>Total Allocated:</span>
            <strong>{Object.values(customSplit).reduce((sum, qty) => sum + qty, 0)} units</strong>
          </div>
          <div className="summary-item" style={{ 
            color: calculateUnmetUnits() > 0 ? '#e74c3c' : '#27ae60'
          }}>
            <span>Unmet Units:</span>
            <strong>{calculateUnmetUnits()} units</strong>
          </div>
        </div>
        
        <button 
          onClick={applyCustomSplit}
          className="btn-primary"
        >
          Apply Custom Split
        </button>
      </div>
    );
  };

  if (!quotationId) {
    return (
      <div className="fulfillment-splitter">
        <div className="panel-header">
          <h3>Fulfillment Splitter</h3>
        </div>
        <p>Select a quotation to view fulfillment options.</p>
      </div>
    );
  }

  return (
    <div className="fulfillment-splitter">
      <div className="panel-header">
        <h3>Fulfillment Splitter - Quotation #{quotationId}</h3>
        <div className="override-toggle">
          <label>
            <input
              type="checkbox"
              checked={manualOverride}
              onChange={handleOverrideToggle}
            />
            <span>Manual Override</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading">Calculating optimal split...</div>
      ) : manualOverride ? (
        renderManualSplit()
      ) : (
        renderAutoSplit()
      )}

      <style jsx>{`
        .fulfillment-splitter {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
        
        .override-toggle label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        .override-toggle input[type="checkbox"] {
          width: 1.2rem;
          height: 1.2rem;
        }
        
        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          border: 1px solid #ffcdd2;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
          font-style: italic;
        }
        
        .no-items {
          text-align: center;
          padding: 2rem;
          background: #f8f9fa;
          border-radius: 4px;
        }
        
        .split-visualization {
          margin-top: 1rem;
        }
        
        .split-summary {
          margin-bottom: 2rem;
        }
        
        .suggestion-text {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          font-weight: 500;
          margin: 1rem 0;
        }
        
        .unmet-warning {
          background: #fff3cd;
          color: #856404;
          padding: 0.75rem;
          border-radius: 4px;
          border: 1px solid #ffeaa7;
          margin-top: 1rem;
        }
        
        .warehouse-allocation {
          margin-top: 2rem;
        }
        
        .warehouse-bars {
          margin-top: 1rem;
        }
        
        .warehouse-bar {
          margin-bottom: 1rem;
        }
        
        .warehouse-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        
        .bar-container {
          height: 20px;
          background: #f0f0f0;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .manual-split {
          margin-top: 1rem;
        }
        
        .split-header {
          margin-bottom: 2rem;
        }
        
        .warehouse-controls {
          display: grid;
          gap: 1.5rem;
        }
        
        .warehouse-control {
          padding: 1rem;
          border: 1px solid #eee;
          border-radius: 8px;
          background: #fafafa;
        }
        
        .control-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .warehouse-name {
          font-weight: 500;
        }
        
        .warehouse-location {
          font-size: 0.875rem;
          color: #666;
        }
        
        .control-input {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .control-input input[type="range"] {
          flex: 1;
        }
        
        .qty-input {
          width: 80px;
          padding: 0.25rem 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .qty-label {
          font-size: 0.875rem;
          color: #666;
        }
        
        .allocation-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin: 2rem 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .summary-item span {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.25rem;
        }
        
        .btn-primary {
          background: #2c3e50;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          width: 100%;
        }
        
        .btn-primary:hover {
          background: #34495e;
        }
      `}</style>
    </div>
  );
}