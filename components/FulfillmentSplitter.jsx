import { useState, useEffect } from "react";
import { warehouses } from "../mockData.js";

export default function FulfillmentSplitter() {
  const [selectedProduct, setSelectedProduct] = useState("1");
  const [requestedQuantity, setRequestedQuantity] = useState(25);
  const [manualOverride, setManualOverride] = useState(false);
  const [allocations, setAllocations] = useState({});
  const [autoSplit, setAutoSplit] = useState([]);
  const [unmetUnits, setUnmetUnits] = useState(0);

  // Mock products for selection
  const mockProducts = [
    { id: "1", name: "Enterprise Server Rack", totalInventory: 55, sku: "HW-SR-42U" },
    { id: "3", name: "Network Switch Pro", totalInventory: 63, sku: "NET-SW-48P" },
    { id: "5", name: "Workstation Laptop", totalInventory: 100, sku: "HW-NB-PRO" }
  ];

  // Calculate auto-split whenever product or quantity changes
  useEffect(() => {
    if (!manualOverride) {
      calculateAutoSplit();
    }
  }, [selectedProduct, requestedQuantity, manualOverride]);

  // Initialize allocations
  useEffect(() => {
    const initialAllocations = {};
    warehouses.forEach(warehouse => {
      initialAllocations[warehouse.id] = 0;
    });
    setAllocations(initialAllocations);
  }, []);

  const calculateAutoSplit = () => {
    const productId = parseInt(selectedProduct);
    const productInventory = warehouses.map(wh => {
      const item = wh.inventory.find(inv => inv.product_id === productId);
      return { 
        warehouseId: wh.id, 
        warehouseName: wh.name,
        location: wh.location,
        quantity: item ? item.quantity : 0 
      };
    });

    const totalAvailable = productInventory.reduce((sum, item) => sum + item.quantity, 0);
    const unmet = Math.max(0, requestedQuantity - totalAvailable);
    setUnmetUnits(unmet);

    // Auto-split logic: allocate proportionally based on inventory
    const split = [];
    let remaining = Math.min(requestedQuantity, totalAvailable);

    // First pass: allocate based on proportion
    productInventory.forEach(item => {
      if (remaining > 0 && item.quantity > 0) {
        const proportion = item.quantity / totalAvailable;
        const allocation = Math.floor(proportion * requestedQuantity);
        const actualAllocation = Math.min(allocation, item.quantity, remaining);
        
        if (actualAllocation > 0) {
          split.push({
            warehouseId: item.warehouseId,
            warehouseName: item.warehouseName,
            location: item.location,
            quantity: actualAllocation,
            available: item.quantity
          });
          remaining -= actualAllocation;
        }
      }
    });

    // Distribute any remaining units
    let index = 0;
    while (remaining > 0 && productInventory.some(item => item.quantity > 0)) {
      const item = productInventory[index % productInventory.length];
      if (item.quantity > 0) {
        let warehouseAllocation = split.find(s => s.warehouseId === item.warehouseId);
        if (!warehouseAllocation) {
          warehouseAllocation = {
            warehouseId: item.warehouseId,
            warehouseName: item.warehouseName,
            location: item.location,
            quantity: 0,
            available: item.quantity
          };
          split.push(warehouseAllocation);
        }
        if (warehouseAllocation.quantity < item.quantity) {
          warehouseAllocation.quantity += 1;
          remaining -= 1;
        }
      }
      index++;
      if (index > 50) break; // safeguard
    }

    setAutoSplit(split);

    // Update allocations for manual mode
    if (!manualOverride) {
      const newAllocations = {};
      warehouses.forEach(warehouse => {
        const allocation = split.find(s => s.warehouseId === warehouse.id);
        newAllocations[warehouse.id] = allocation ? allocation.quantity : 0;
      });
      setAllocations(newAllocations);
    }
  };

  const handleAllocationChange = (warehouseId, value) => {
    const numValue = parseInt(value) || 0;
    setAllocations(prev => ({
      ...prev,
      [warehouseId]: Math.max(0, numValue)
    }));
  };

  const applyManualSplit = () => {
    const totalAllocated = Object.values(allocations).reduce((sum, qty) => sum + qty, 0);
    const unmet = Math.max(0, requestedQuantity - totalAllocated);
    setUnmetUnits(unmet);
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(`Allocated ${totalAllocated} units across ${Object.values(allocations).filter(v => v > 0).length} distribution centers`, "success");
    }
  };

  const handleExportDispatch = () => {
    const totalAllocated = manualOverride 
      ? Object.values(allocations).reduce((sum, qty) => sum + qty, 0)
      : autoSplit.reduce((sum, item) => sum + item.quantity, 0);
    
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(`Dispatch order exported: ${totalAllocated} units allocated`, "info");
    }
  };

  const getWarehouseBadgeColor = (index) => {
    const colors = [
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "bg-emerald-50 text-emerald-700 border-emerald-200",
      "bg-purple-50 text-purple-700 border-purple-200"
    ];
    return colors[index % colors.length];
  };

  const getProgressBarColor = (index) => {
    const colors = ["bg-indigo-600", "bg-emerald-600", "bg-purple-600"];
    return colors[index % colors.length];
  };

  const getTotalAllocated = () => {
    return Object.values(allocations).reduce((sum, qty) => sum + qty, 0);
  };

  const getProductInventory = () => {
    const productId = parseInt(selectedProduct);
    let total = 0;
    warehouses.forEach(warehouse => {
      const item = warehouse.inventory.find(inv => inv.product_id === productId);
      if (item) total += item.quantity;
    });
    return total;
  };

  const currentProductInfo = mockProducts.find(p => p.id === selectedProduct) || mockProducts[0];

  return (
    <div className="space-y-6">
      {/* Header & Product Control Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Multi-Warehouse Fulfillment Router</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Inventory Connected
              </span>
            </div>
            <p className="text-slate-600 text-sm mt-1">
              Algorithmic inventory partitioning to minimize shipping zones and transit latency
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportDispatch}
              className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export Dispatch Manifest
            </button>
          </div>
        </div>

        {/* Product & Quantity Selection Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-6 items-center">
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Product Line</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-300 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all shadow-sm"
            >
              {mockProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku}) &bull; {product.totalInventory} units in stock
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Required Volume</label>
            <div className="relative">
              <input
                type="number"
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                min="1"
                max={getProductInventory() * 2}
                className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">units</span>
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Available Network Stock</label>
            <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xl font-extrabold text-slate-900">{getProductInventory()}</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">units ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Toggle Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${manualOverride ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`}></div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                {manualOverride ? "Manual Allocation Mode Enabled" : "Automated Proportional Split Engine"}
              </div>
              <div className="text-xs text-slate-500">
                {manualOverride 
                  ? "Custom warehouse quotas are active. Fine-tune quantities with sliders." 
                  : "Dynamic balance across regional facilities based on stock depth and fulfillment speed."}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setManualOverride(!manualOverride)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              manualOverride
                ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            {manualOverride ? "Switch to Automated Mode" : "Enable Manual Override"}
          </button>
        </div>
      </div>

      {/* Fulfillment Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Demand Ordered</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{requestedQuantity} units</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Allocated</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {manualOverride ? getTotalAllocated() : requestedQuantity - unmetUnits} units
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Shortage / Backorder</span>
          <div className={`text-2xl font-black mt-1 ${unmetUnits > 0 ? "text-rose-600" : "text-slate-400"}`}>
            {unmetUnits} units
          </div>
        </div>
      </div>

      {/* Unmet Units Warning Alert */}
      {unmetUnits > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.948-.833-2.678 0L4.196 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <div className="font-bold text-sm text-rose-800">Inventory Shortage Detected</div>
            <div className="text-xs text-rose-700 mt-0.5">
              Network stock is short by <strong>{unmetUnits} units</strong>. Recommend triggering an emergency transfer order or splitting shipment into partial delivery.
            </div>
          </div>
        </div>
      )}

      {/* Auto Split Mode Visualization */}
      {!manualOverride && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 text-base mb-4">Optimized Distribution Matrix</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {autoSplit.map((item, index) => {
              const pct = requestedQuantity > 0 ? Math.round((item.quantity / requestedQuantity) * 100) : 0;
              return (
                <div key={item.warehouseId} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.warehouseName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.location}</div>
                      <div className="text-xs text-slate-600 mt-1 font-medium">Available: {item.available} units</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getWarehouseBadgeColor(index)}`}>
                      {item.quantity} units
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden mt-4">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarColor(index)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 font-medium">
                    <span>Quota Share</span>
                    <span className="font-bold text-slate-700">{pct}% of order</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Override Controls */}
      {manualOverride && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Manual Warehouse Partitioning</h3>
            <button
              onClick={applyManualSplit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              Confirm Allocations
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {warehouses.map((warehouse, index) => {
              const inventoryItem = warehouse.inventory.find(inv => inv.product_id === parseInt(selectedProduct));
              const available = inventoryItem ? inventoryItem.quantity : 0;
              const allocated = allocations[warehouse.id] || 0;

              return (
                <div key={warehouse.id} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{warehouse.name}</div>
                      <div className="text-xs text-slate-500">{warehouse.location}</div>
                      <div className="text-xs text-slate-600 font-medium mt-1">Available: {available} units</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getWarehouseBadgeColor(index)}`}>
                      {allocated} units
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={available}
                      value={allocated}
                      onChange={(e) => handleAllocationChange(warehouse.id, e.target.value)}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={allocated}
                        onChange={(e) => handleAllocationChange(warehouse.id, e.target.value)}
                        min="0"
                        max={available}
                        className="w-20 px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500">/ {available} max capacity</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Facility Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 text-base mb-4">Regional Facility Capacity Overview</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Facility</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Server Racks</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Network Switches</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Workstations</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {warehouses.map((warehouse) => {
                const serverRack = warehouse.inventory.find(inv => inv.product_id === 1)?.quantity || 0;
                const networkSwitch = warehouse.inventory.find(inv => inv.product_id === 3)?.quantity || 0;
                const workstation = warehouse.inventory.find(inv => inv.product_id === 5)?.quantity || 0;
                const total = serverRack + networkSwitch + workstation;
                const status = total > 50 ? "High Capacity" : total > 20 ? "Optimal" : "Low Stock";

                return (
                  <tr key={warehouse.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">{warehouse.name}</td>
                    <td className="px-4 py-3 text-slate-600">{warehouse.location}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{serverRack} units</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{networkSwitch} units</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{workstation} units</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        status === "High Capacity" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        status === "Optimal" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}