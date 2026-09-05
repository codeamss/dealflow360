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
    { id: "1", name: "Enterprise Server Rack", totalInventory: 55 },
    { id: "3", name: "Network Switch Pro", totalInventory: 63 },
    { id: "5", name: "Workstation Laptop", totalInventory: 100 }
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
      return { warehouseId: wh.id, quantity: item ? item.quantity : 0 };
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
            warehouseName: warehouses.find(w => w.id === item.warehouseId)?.name || `Warehouse ${item.warehouseId}`,
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
        const warehouseAllocation = split.find(s => s.warehouseId === item.warehouseId);
        if (warehouseAllocation && warehouseAllocation.quantity < item.quantity) {
          warehouseAllocation.quantity += 1;
          remaining -= 1;
        }
      }
      index++;
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
    console.log("✅ Manual split applied:", allocations);
  };

  const getWarehouseColor = (index) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500"];
    return colors[index % colors.length];
  };

  const getSelectedProductName = () => {
    const product = mockProducts.find(p => p.id === selectedProduct);
    return product ? product.name : "Unknown Product";
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Fulfillment Splitter</h2>
            <p className="text-gray-600">Optimize warehouse allocations for order fulfillment</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Product Inventory</div>
              <div className="text-lg font-bold text-gray-900">{getProductInventory()} units</div>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Product & Quantity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {mockProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.totalInventory} units available)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Requested</label>
              <div className="relative">
                <input
                  type="number"
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 0)}
                  min="1"
                  max={getProductInventory() * 2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500">units</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Override Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <div className="font-medium text-gray-900">Manual Allocation Override</div>
              <div className="text-sm text-gray-600">
                {manualOverride 
                  ? "Manually adjust warehouse allocations" 
                  : "Using optimized auto-split based on inventory levels"}
              </div>
            </div>
            <button
              onClick={() => setManualOverride(!manualOverride)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                manualOverride ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                manualOverride ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Auto Split View */}
        {!manualOverride && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Optimized Auto-Split</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {autoSplit.map((item, index) => (
                  <div key={item.warehouseId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">{item.warehouseName}</div>
                        <div className="text-sm text-gray-600">Available: {item.available} units</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getWarehouseColor(index)} text-white`}>
                        {item.quantity} units
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getWarehouseColor(index)}`}
                        style={{ width: `${(item.quantity / requestedQuantity) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {((item.quantity / requestedQuantity) * 100).toFixed(0)}% of order
                    </div>
                  </div>
                ))}
              </div>

              {unmetUnits > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.948-.833-2.678 0L4.196 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <div className="font-medium text-yellow-800">Inventory Shortage</div>
                      <div className="text-sm text-yellow-700">
                        {unmetUnits} units cannot be fulfilled from current inventory. Consider backorder or alternative products.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600">Requested</div>
                    <div className="text-2xl font-bold text-gray-900">{requestedQuantity}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Can Be Fulfilled</div>
                    <div className="text-2xl font-bold text-green-600">{requestedQuantity - unmetUnits}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Unmet Units</div>
                    <div className={`text-2xl font-bold ${unmetUnits > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {unmetUnits}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Split View */}
        {manualOverride && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Manual Allocation</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {warehouses.map((warehouse, index) => {
                  const inventoryItem = warehouse.inventory.find(inv => inv.product_id === parseInt(selectedProduct));
                  const available = inventoryItem ? inventoryItem.quantity : 0;
                  const allocated = allocations[warehouse.id] || 0;

                  return (
                    <div key={warehouse.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-semibold text-gray-900">{warehouse.name}</div>
                          <div className="text-sm text-gray-600">{warehouse.location}</div>
                          <div className="text-sm text-gray-600">Available: {available} units</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getWarehouseColor(index)} text-white`}>
                          {allocated} units
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Allocate from {warehouse.name}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max={available}
                            value={allocated}
                            onChange={(e) => handleAllocationChange(warehouse.id, e.target.value)}
                            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={allocated}
                            onChange={(e) => handleAllocationChange(warehouse.id, e.target.value)}
                            min="0"
                            max={available}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-gray-500">/ {available}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600">Requested</div>
                    <div className="text-2xl font-bold text-gray-900">{requestedQuantity}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Allocated</div>
                    <div className="text-2xl font-bold text-blue-600">{getTotalAllocated()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Unmet Units</div>
                    <div className={`text-2xl font-bold ${unmetUnits > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {unmetUnits}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Utilization</div>
                    <div className="text-2xl font-bold text-green-600">
                      {requestedQuantity > 0 ? ((getTotalAllocated() / requestedQuantity) * 100).toFixed(0) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={applyManualSplit}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Apply Manual Split
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warehouse Summary */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Warehouse Inventory Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Server Rack</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network Switch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workstation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses.map((warehouse) => {
                  const serverRack = warehouse.inventory.find(inv => inv.product_id === 1)?.quantity || 0;
                  const networkSwitch = warehouse.inventory.find(inv => inv.product_id === 3)?.quantity || 0;
                  const workstation = warehouse.inventory.find(inv => inv.product_id === 5)?.quantity || 0;
                  const total = serverRack + networkSwitch + workstation;
                  const status = total > 50 ? "High" : total > 20 ? "Medium" : "Low";

                  return (
                    <tr key={warehouse.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{warehouse.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{warehouse.location}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(serverRack / 30) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-900">{serverRack}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(networkSwitch / 25) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-900">{networkSwitch}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${(workstation / 50) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-900">{workstation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === "High" ? "bg-green-100 text-green-800" :
                          status === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {status} Inventory
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
    </div>
  );
}