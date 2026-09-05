import { useState, useEffect } from "react";
import { products, upsells } from "../mockData.js";

export default function QuotationBuilder({ onQuoteCreated }) {
  const [cart, setCart] = useState([
    {
      id: 1,
      productId: 1,
      name: "Enterprise Server Rack",
      price: 12500,
      category: "Hardware",
      quantity: 1,
      discount: 10
    }
  ]);
  const [customerName, setCustomerName] = useState("Acme Corporation");
  const [quoteTitle, setQuoteTitle] = useState("Enterprise Infrastructure Expansion");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [availableUpsells, setAvailableUpsells] = useState([]);
  const [liveMargin, setLiveMargin] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [calculatedRisk, setCalculatedRisk] = useState(null);
  const [savedQuoteId, setSavedQuoteId] = useState(null);
  const [portalModalOpen, setPortalModalOpen] = useState(false);

  // Calculate live margin & total value whenever cart changes
  useEffect(() => {
    let margin = 0;
    let total = 0;
    
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId) || item;
      const cost = (product.price || 0) * 0.65; // Estimated 35% base margin
      const revenue = (item.price || product.price) * item.quantity * (1 - (item.discount || 0) / 100);
      margin += (revenue - cost * item.quantity);
      total += revenue;
    });
    
    setLiveMargin(margin);
    setTotalValue(total);
  }, [cart]);

  // Update available upsells when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      const productId = parseInt(selectedProduct);
      const upsellList = upsells.filter(u => u.base_product_id === productId);
      setAvailableUpsells(upsellList);
    } else {
      setAvailableUpsells(upsells.slice(0, 2));
    }
  }, [selectedProduct]);

  // Add initial upsells on mount
  useEffect(() => {
    setAvailableUpsells(upsells.slice(0, 2));
  }, []);

  const addToCart = () => {
    if (!selectedProduct) return;
    
    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;

    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: Math.max(1, parseInt(quantity) || 1),
      discount: Math.min(100, Math.max(0, parseFloat(discount) || 0))
    };

    setCart([...cart, newItem]);
    setSelectedProduct("");
    setQuantity(1);
    setDiscount(0);

    if (window.showToast) {
      window.showToast(`Added ${product.name} to quotation cart`, 'success');
    }
  };

  const removeFromCart = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    setCart(cart.filter(i => i.id !== itemId));
    if (window.showToast && item) {
      window.showToast(`Removed ${item.name}`, 'info');
    }
  };

  const updateCartItem = (itemId, field, value) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        let val = parseFloat(value) || 0;
        if (field === 'quantity') val = Math.max(1, parseInt(value) || 1);
        if (field === 'discount') val = Math.min(100, Math.max(0, val));
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const addUpsell = (upsellProductId) => {
    const product = products.find(p => p.id === upsellProductId);
    if (!product) return;

    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: 1,
      discount: 5
    };

    setCart([...cart, newItem]);
    if (window.showToast) {
      window.showToast(`Added recommended upsell: ${product.name} (5% bundle discount)`, 'success');
    }
  };

  const calculateLineTotal = (item) => {
    const unitPrice = item.price || 0;
    return unitPrice * item.quantity * (1 - (item.discount || 0) / 100);
  };

  // Run Real Risk Calculation
  const handleCalculateRisk = () => {
    if (cart.length === 0) {
      if (window.showToast) window.showToast("Add items to cart before calculating risk", "error");
      return;
    }

    let riskPoints = 0;
    const categoryExcess = [];

    cart.forEach(item => {
      const allowedDiscount = item.category === "Hardware" ? 10 : 15;
      if (item.discount > allowedDiscount) {
        const excess = item.discount - allowedDiscount;
        riskPoints += excess * (item.quantity > 2 ? 1.2 : 1);
        categoryExcess.push({
          item: item.name,
          category: item.category,
          applied: item.discount,
          allowed: allowedDiscount,
          excess: excess.toFixed(1)
        });
      }
    });

    const score = Math.min(100, Math.round(riskPoints));
    let level = "Low";
    let tierText = "Auto-Approval Eligible (Under standard discount threshold)";
    let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

    if (score > 25) {
      level = "Critical";
      tierText = "Executive Sales VP & Finance Approval Required";
      badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
    } else if (score > 12) {
      level = "Medium";
      tierText = "Sales Manager Sign-off Required";
      badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    }

    const result = {
      score,
      level,
      tierText,
      badgeColor,
      categoryExcess,
      timestamp: new Date().toLocaleTimeString()
    };

    setCalculatedRisk(result);
    if (window.showToast) {
      window.showToast(`Risk Score calculated: ${score}% (${level} Risk)`, score > 25 ? 'error' : 'info');
    }
  };

  // Save Quotation as Draft
  const handleSaveDraft = () => {
    if (!customerName.trim()) {
      if (window.showToast) window.showToast("Please enter a customer or account name", "error");
      return;
    }
    if (cart.length === 0) {
      if (window.showToast) window.showToast("Please add at least one product", "error");
      return;
    }

    const newId = 1000 + Math.floor(Math.random() * 9000);
    const quoteObject = {
      id: newId,
      customer_name: customerName.trim(),
      title: quoteTitle.trim() || `Quote #${newId}`,
      status: "Draft",
      total_price: Math.round(totalValue),
      created_at: new Date().toISOString(),
      lines: cart.map(c => ({
        id: c.id,
        product_id: c.productId,
        quantity: c.quantity,
        applied_discount: c.discount,
        product: {
          id: c.productId,
          name: c.name,
          category: c.category,
          price: c.price
        }
      })),
      blended_risk_score: calculatedRisk ? calculatedRisk.score : 0
    };

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem("dealflow360_custom_quotes") || "[]");
      localStorage.setItem("dealflow360_custom_quotes", JSON.stringify([quoteObject, ...existing]));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }

    setSavedQuoteId(newId);
    if (window.showToast) {
      window.showToast(`Quotation #${newId} saved as Draft!`, "success");
    }
    if (onQuoteCreated) onQuoteCreated(quoteObject);
  };

  // Send Quotation to Customer Portal
  const handleSendToCustomer = () => {
    if (!customerName.trim()) {
      if (window.showToast) window.showToast("Please enter a customer name", "error");
      return;
    }
    if (cart.length === 0) {
      if (window.showToast) window.showToast("Cart is empty", "error");
      return;
    }

    const newId = savedQuoteId || (1000 + Math.floor(Math.random() * 9000));
    const quoteObject = {
      id: newId,
      customer_name: customerName.trim(),
      title: quoteTitle.trim() || `Proposal for ${customerName}`,
      status: "Negotiation",
      total_price: Math.round(totalValue),
      created_at: new Date().toISOString(),
      lines: cart.map(c => ({
        id: c.id,
        product_id: c.productId,
        quantity: c.quantity,
        applied_discount: c.discount,
        product: {
          id: c.productId,
          name: c.name,
          category: c.category,
          price: c.price
        }
      })),
      blended_risk_score: calculatedRisk ? calculatedRisk.score : 15
    };

    // Save/update in localStorage
    try {
      const existing = JSON.parse(localStorage.getItem("dealflow360_custom_quotes") || "[]");
      const filtered = existing.filter(q => q.id !== newId);
      localStorage.setItem("dealflow360_custom_quotes", JSON.stringify([quoteObject, ...filtered]));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }

    setSavedQuoteId(newId);
    setPortalModalOpen(true);
    if (window.showToast) {
      window.showToast(`Quote #${newId} published to Customer Portal!`, "success");
    }
  };

  const copyPortalLink = () => {
    const portalUrl = `${window.location.origin}/portal/quote/${savedQuoteId || 1001}`;
    navigator.clipboard.writeText(portalUrl).then(() => {
      if (window.showToast) window.showToast("Customer Portal link copied to clipboard!", "success");
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Quotation Header Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quotation Workspace</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure account details, line items, and commercial pricing</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Contract Value</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                ${Math.round(totalValue).toLocaleString()}
              </div>
            </div>
            <div className="hidden sm:block pl-4 border-l border-slate-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Projected Margin</div>
              <div className={`text-xl font-bold font-mono ${liveMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${Math.round(liveMargin).toLocaleString()}
                <span className="text-xs font-medium ml-1 text-slate-500">
                  ({totalValue > 0 ? ((liveMargin / totalValue) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account & Reference Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Client / Account Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Acme Corporation, NextGen Labs"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Quotation Title / Project Ref
            </label>
            <input
              type="text"
              value={quoteTitle}
              onChange={(e) => setQuoteTitle(e.target.value)}
              placeholder="e.g. Q4 Data Center Refresh"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Add Product Section */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">Add Products to Line Items</h3>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              <option value="">Select a product from catalog...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price.toLocaleString()} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Qty"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            />
          </div>

          <div className="sm:col-span-2 relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="Disc %"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white pr-8"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={addToCart}
              disabled={!selectedProduct}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                selectedProduct 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98] shadow-indigo-200' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              + Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Cart Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-sm">Configured Line Items</h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
              {cart.length}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </div>
            <p className="text-sm font-medium text-slate-700">No line items in this quotation</p>
            <p className="text-xs text-slate-400 mt-1">Select products above or pick from recommendations below</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">List Price</th>
                  <th className="px-4 py-3 text-center">Quantity</th>
                  <th className="px-4 py-3 text-center">Discount %</th>
                  <th className="px-6 py-3 text-right">Line Total</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-slate-600">
                      ${item.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCartItem(item.id, 'quantity', e.target.value)}
                        className="w-16 text-center rounded-lg border border-slate-300 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={item.discount}
                          onChange={(e) => updateCartItem(item.id, 'discount', e.target.value)}
                          className="w-16 text-center rounded-lg border border-slate-300 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-400 ml-1">%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                      ${Math.round(calculateLineTotal(item)).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Risk Engine Results Card (when calculated) */}
      {calculatedRisk && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Commercial Risk Assessment</h3>
                <p className="text-xs text-slate-500">Evaluated against company discount limits at {calculatedRisk.timestamp}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${calculatedRisk.badgeColor}`}>
              Risk Score: {calculatedRisk.score}% • {calculatedRisk.level} Risk
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span><strong>Approval Workflow:</strong> {calculatedRisk.tierText}</span>
          </div>

          {calculatedRisk.categoryExcess.length > 0 && (
            <div className="text-xs space-y-1 text-slate-600">
              <span className="font-semibold text-slate-800">Threshold Breaches:</span>
              {calculatedRisk.categoryExcess.map((ex, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-none">
                  <span>{ex.item} ({ex.category})</span>
                  <span className="text-rose-600 font-medium font-mono">
                    Applied {ex.applied}% (Max standard {ex.allowed}%, excess +{ex.excess}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upsell Recommendations Section */}
      {availableUpsells.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Smart Margin Accelerators</h3>
              <p className="text-xs text-slate-500">Recommended complementary services and accessories</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              High Margin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableUpsells.map(up => (
              <div key={up.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 text-sm">{up.name}</h4>
                    <span className="font-bold text-slate-900 text-sm font-mono">${up.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{up.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-emerald-600">
                    +${up.margin_delta} margin delta
                  </span>
                  <button
                    onClick={() => addUpsell(up.product_id)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors active:scale-95"
                  >
                    + Bundle Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commercial Actions Footer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="text-xs text-slate-500 text-center sm:text-left">
          {savedQuoteId ? (
            <span className="text-emerald-700 font-medium">✓ Active Quotation Ref #{savedQuoteId}</span>
          ) : (
            <span>Ready to generate proposal for {customerName || 'client'}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleCalculateRisk}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            <span>Assess Risk</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleSendToCustomer}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            <span>Publish to Customer Portal</span>
          </button>
        </div>
      </div>

      {/* Customer Portal Published Modal */}
      {portalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Quotation Ready for Customer</h3>
              <p className="text-xs text-slate-500 mt-1">
                Proposal #{savedQuoteId} for <strong>{customerName}</strong> is published. Share the client portal link for review & negotiation:
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-indigo-700 truncate">
                {window.location.origin}/portal/quote/{savedQuoteId || 1001}
              </span>
              <button
                onClick={copyPortalLink}
                className="px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 flex-shrink-0"
              >
                Copy
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`/portal/quote/${savedQuoteId || 1001}`}
                className="flex-1 py-2.5 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Open Portal View →
              </a>
              <button
                onClick={() => setPortalModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}