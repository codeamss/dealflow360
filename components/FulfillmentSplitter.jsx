import { useState } from "react";
import { warehouse_inventory, orders_awaiting_fulfillment } from "../mockData.js";

const FORMATTED_STOCK = warehouse_inventory.map(w => ({
  warehouse: w.warehouse_name,
  product: w.product_name,
  inStock: w.in_stock,
  reserved: w.reserved,
  available: w.available
}));

const FORMATTED_ORDERS = orders_awaiting_fulfillment.map(o => {
  const total = o.items.reduce((s, i) => s + i.quantity, 0);
  const main = Math.ceil(total * 0.65);
  const east = total - main;
  return {
    order: o.order_number,
    customer: o.customer,
    status: o.status,
    warehouses: o.assigned_warehouses.join(" + "),
    requestedQty: total,
    mainQty: main,
    eastQty: east,
    backorder: 0
  };
});

export default function FulfillmentSplitter() {
  const [stockList, setStockList] = useState(FORMATTED_STOCK);
  const [ordersAwaiting, setOrdersAwaiting] = useState(FORMATTED_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(FORMATTED_ORDERS[0]);
  
  // Pagination states (20 per page)
  const [stockPage, setStockPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const pageSize = 20;

  // Interactive Split adjustments
  const [mainAllocation, setMainAllocation] = useState(selectedOrder?.mainQty || 22);
  const [eastAllocation, setEastAllocation] = useState(selectedOrder?.eastQty || 4);
  const [isManual, setIsManual] = useState(false);

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setMainAllocation(order.mainQty);
    setEastAllocation(order.eastQty);
  };

  const totalAllocated = mainAllocation + eastAllocation;
  const currentShortage = Math.max(0, selectedOrder.requestedQty - totalAllocated);

  const handleConfirmSplit = () => {
    setOrdersAwaiting(prev => prev.map(o => {
      if (o.order === selectedOrder.order) {
        return {
          ...o,
          mainQty: mainAllocation,
          eastQty: eastAllocation,
          backorder: currentShortage,
          status: currentShortage > 0 ? "Backorder" : "Split Confirmed",
          warehouses: mainAllocation > 0 && eastAllocation > 0 ? "Main + East Depot" : mainAllocation > 0 ? "Main Warehouse" : "East Depot"
        };
      }
      return o;
    }));

    if (window.showToast) {
      window.showToast(`Warehouse split confirmed for ${selectedOrder.order}: Main (${mainAllocation}), East (${eastAllocation})`, 'success');
    }
  };

  const handleExportManifest = () => {
    if (window.showToast) {
      window.showToast(`Dispatch manifest for ${selectedOrder.order} exported to shipping desk!`, 'info');
    }
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto">
      
      {/* ========================================================================= */}
      {/* SCREEN 7: Fulfillment and Stock (List)                                    */}
      {/* ========================================================================= */}
      <div className="space-y-6 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Fulfillment and Stock (List)</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Live stock per warehouse, plus every order that still needs fulfilling
          </p>
        </div>

        {/* Table 1: Live Stock Per Warehouse */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Warehouse Inventory Levels</h3>
            <span className="text-[11px] text-emerald-400 font-bold">● Live Sync Active</span>
          </div>

          <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="min-w-full divide-y divide-slate-700 text-xs sm:text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3 text-left">Warehouse</th>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-center">In Stock</th>
                  <th className="px-4 py-3 text-center">Reserved</th>
                  <th className="px-5 py-3 text-right">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {stockList.slice((stockPage - 1) * pageSize, stockPage * pageSize).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white font-mono">{item.warehouse}</td>
                    <td className="px-5 py-3.5 text-slate-200">{item.product}</td>
                    <td className="px-4 py-3.5 text-center font-mono">{item.inStock}</td>
                    <td className="px-4 py-3.5 text-center font-mono text-amber-400">{item.reserved}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400">{item.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table 1 Pagination Bar */}
          <div className="flex justify-between items-center px-4 py-2 bg-slate-950/40 rounded-lg border border-slate-800 text-xs text-slate-400">
            <span>Showing {(stockPage - 1) * pageSize + 1}–{Math.min(stockPage * pageSize, stockList.length)} of {stockList.length} warehouse inventory items</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={stockPage === 1}
                onClick={() => setStockPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
              >
                ← Prev
              </button>
              <span className="font-mono text-white px-2">Page {stockPage} of {Math.ceil(stockList.length / pageSize)}</span>
              <button
                type="button"
                disabled={stockPage >= Math.ceil(stockList.length / pageSize)}
                onClick={() => setStockPage(p => Math.min(Math.ceil(stockList.length / pageSize), p + 1))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Table 2: Orders Awaiting Fulfillment */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Orders Awaiting Fulfillment</h3>

          <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="min-w-full divide-y divide-slate-700 text-xs sm:text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-left">Warehouses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {ordersAwaiting.slice((orderPage - 1) * pageSize, orderPage * pageSize).map((o) => {
                  const isSelected = selectedOrder && o.order === selectedOrder.order;
                  return (
                    <tr
                      key={o.order}
                      onClick={() => handleSelectOrder(o)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-sky-950/50 border-l-4 border-l-sky-400" : "hover:bg-slate-800/60"
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-sky-400">{o.order}</td>
                      <td className="px-5 py-3.5 font-semibold text-white">{o.customer}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                          o.status.includes("Backorder")
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : o.status.includes("Pending")
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-medium font-mono">{o.warehouses}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table 2 Pagination Bar */}
          <div className="flex justify-between items-center px-4 py-2 bg-slate-950/40 rounded-lg border border-slate-800 text-xs text-slate-400">
            <span>Showing {(orderPage - 1) * pageSize + 1}–{Math.min(orderPage * pageSize, ordersAwaiting.length)} of {ordersAwaiting.length} fulfillment orders</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={orderPage === 1}
                onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
              >
                ← Prev
              </button>
              <span className="font-mono text-white px-2">Page {orderPage} of {Math.ceil(ordersAwaiting.length / pageSize)}</span>
              <button
                type="button"
                disabled={orderPage >= Math.ceil(ordersAwaiting.length / pageSize)}
                onClick={() => setOrderPage(p => Math.min(Math.ceil(ordersAwaiting.length / pageSize), p + 1))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Yellow Callout Box matching Excalidraw */}
          <div className="excalidraw-callout mt-2">
            Click an order row to open its warehouse split detail.
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SCREEN 8: Warehouse Split Detail Modal / Panel                           */}
      {/* ========================================================================= */}
      <div className="space-y-6 bg-slate-900/95 border-2 border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-400">Order Ref: {selectedOrder.order}</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-300">{selectedOrder.customer}</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">Multi-Warehouse Fulfillment Split Detail</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManual(!isManual)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                isManual 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50" 
                  : "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"
              }`}
            >
              {isManual ? "Manual Mode Active" : "Auto Split Mode"}
            </button>
            <button
              type="button"
              onClick={handleExportManifest}
              className="px-4 py-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all active:scale-95"
            >
              Export Dispatch Slip
            </button>
          </div>
        </div>

        {/* Demand & Allocation Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
            <span className="text-xs text-slate-400 font-medium">Customer Demand</span>
            <div className="text-2xl font-black text-white font-mono mt-1">{selectedOrder.requestedQty} units</div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
            <span className="text-xs text-slate-400 font-medium">Main Warehouse Share</span>
            <div className="text-2xl font-black text-sky-400 font-mono mt-1">{mainAllocation} units</div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
            <span className="text-xs text-slate-400 font-medium">East Depot Share</span>
            <div className="text-2xl font-black text-indigo-400 font-mono mt-1">{eastAllocation} units</div>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
            <span className="text-xs text-slate-400 font-medium">Backorder Deficit</span>
            <div className={`text-2xl font-black font-mono mt-1 ${currentShortage > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {currentShortage} units
            </div>
          </div>
        </div>

        {/* Partitioning Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-5 rounded-xl border border-slate-800">
          {/* Main Warehouse Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Main Warehouse (22 Available)</span>
              <span className="font-mono font-bold text-sky-400 text-sm">{mainAllocation} units</span>
            </div>
            <input
              type="range"
              min="0"
              max="22"
              value={mainAllocation}
              onChange={(e) => setMainAllocation(parseInt(e.target.value) || 0)}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Direct fulfillment zone: Transit 24-48h</p>
          </div>

          {/* East Depot Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">East Depot (4 Available)</span>
              <span className="font-mono font-bold text-indigo-400 text-sm">{eastAllocation} units</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              value={eastAllocation}
              onChange={(e) => setEastAllocation(parseInt(e.target.value) || 0)}
              className="w-full accent-indigo-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Secondary zone: Transit 48-72h</p>
          </div>
        </div>

        {/* Shortage warning if needed */}
        {currentShortage > 0 && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3">
            <span className="text-rose-400 font-black text-base">⚠️</span>
            <div className="text-xs text-rose-300">
              <strong className="font-bold text-white">Backorder Alert: </strong>
              Current network allocation leaves <strong>{currentShortage} units</strong> unfulfilled. 
              An automatic backorder purchase request will be triggered for East Depot replenishment.
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleConfirmSplit}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg transition-all"
          >
            Confirm & Reserve Warehouse Quotas
          </button>
        </div>

      </div>

    </div>
  );
}