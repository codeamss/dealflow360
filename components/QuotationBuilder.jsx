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
      discount: 10,
      is_subscription: false,
      unit: "each"
    },
    {
      id: 2,
      productId: 2,
      name: "Cloud Backup Solution",
      price: 450,
      category: "Services",
      quantity: 1,
      discount: 5,
      is_subscription: true,
      unit: "monthly"
    }
  ]);
  const [customerName, setCustomerName] = useState("Acme Corporation");
  const [quoteTitle, setQuoteTitle] = useState("Enterprise Infrastructure & Managed Services Proposal");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [contractMonths, setContractMonths] = useState(12);
  const [availableUpsells, setAvailableUpsells] = useState([]);
  const [liveMargin, setLiveMargin] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [oneTimeTotal, setOneTimeTotal] = useState(0);
  const [recurringMonthlyTotal, setRecurringMonthlyTotal] = useState(0);
  const [calculatedRisk, setCalculatedRisk] = useState(null);
  const [savedQuoteId, setSavedQuoteId] = useState(null);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [allCatalogProducts, setAllCatalogProducts] = useState(products);

  // Synchronize with custom products uploaded via /products
  const syncCustomProducts = () => {
    try {
      const custom = localStorage.getItem('dealflow360_custom_products');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllCatalogProducts([...parsed, ...products]);
          return;
        }
      }
      setAllCatalogProducts(products);
    } catch (e) {}
  };

  useEffect(() => {
    syncCustomProducts();
    window.addEventListener('storage', syncCustomProducts);
    window.addEventListener('dealflow360_product_added', syncCustomProducts);
    window.addEventListener('focus', syncCustomProducts);
    return () => {
      window.removeEventListener('storage', syncCustomProducts);
      window.removeEventListener('dealflow360_product_added', syncCustomProducts);
      window.removeEventListener('focus', syncCustomProducts);
    };
  }, []);

  // Calculate live margin, total value, and dual billing breakdown whenever cart or terms change
  useEffect(() => {
    let margin = 0;
    let total = 0;
    let oneTime = 0;
    let recurring = 0;
    
    cart.forEach(item => {
      const product = allCatalogProducts.find(p => p.id === item.productId) || item;
      const cost = (product.price || 0) * 0.65; // Estimated 35% base margin
      const revenue = (item.price || product.price) * item.quantity * (1 - (item.discount || 0) / 100);
      margin += (revenue - cost * item.quantity);
      total += revenue;
      
      if (item.is_subscription) {
        recurring += revenue;
      } else {
        oneTime += revenue;
      }
    });
    
    setLiveMargin(margin);
    setTotalValue(total);
    setOneTimeTotal(oneTime);
    setRecurringMonthlyTotal(recurring);
  }, [cart, contractMonths, allCatalogProducts]);

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
    
    const product = allCatalogProducts.find(p => String(p.id) === String(selectedProduct) || p.id === parseInt(selectedProduct));
    if (!product) return;

    const isSub = Boolean(product.is_subscription || product.unit === "monthly" || product.category === "Services");

    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: Math.max(1, parseInt(quantity) || 1),
      discount: Math.min(100, Math.max(0, parseFloat(discount) || 0)),
      is_subscription: isSub,
      unit: product.unit || (isSub ? "monthly" : "each")
    };

    setCart([...cart, newItem]);
    setSelectedProduct("");
    setQuantity(1);
    setDiscount(0);

    if (window.showToast) {
      window.showToast(`Added ${product.name} (${isSub ? 'Subscription' : 'Hardware'} line) to cart`, 'success');
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

    const isSub = Boolean(product.is_subscription || product.unit === "monthly" || product.category === "Services");

    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      quantity: 1,
      discount: 5,
      is_subscription: isSub,
      unit: product.unit || (isSub ? "monthly" : "each")
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

  // Run Real Risk Calculation & Automated Policy Routing
  const handleCalculateRisk = () => {
    if (cart.length === 0) {
      if (window.showToast) window.showToast("Add items to cart before calculating risk", "error");
      return;
    }

    let riskPoints = 0;
    let maxDiscount = 0;
    const categoryExcess = [];

    cart.forEach(item => {
      if (item.discount > maxDiscount) maxDiscount = item.discount;
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
    let tierText = "Auto-Approved / Compliant: Ready for Immediate Fulfillment";
    let badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    let requiresApproval = false;
    let approvalRole = "None (Auto-Approved)";

    if (score > 25 || maxDiscount > 20) {
      level = "Critical";
      tierText = "VP of Sales & Finance Sign-off Required (Max Discount > 20% or Risk > 25%)";
      badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/40";
      requiresApproval = true;
      approvalRole = "Executive Sales VP & Finance";
    } else if (score > 12 || maxDiscount > 12) {
      level = "Medium";
      tierText = "Sales Manager Sign-off Required (Discount > 12%)";
      badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/40";
      requiresApproval = true;
      approvalRole = "Sales Manager";
    }

    const result = {
      score,
      level,
      maxDiscount,
      tierText,
      badgeColor,
      requiresApproval,
      approvalRole,
      categoryExcess,
      timestamp: new Date().toLocaleTimeString()
    };

    setCalculatedRisk(result);
    if (window.showToast) {
      window.showToast(
        requiresApproval 
          ? `Approval Triggered: ${approvalRole} review required (${score}% Risk, Max ${maxDiscount}% Disc)`
          : `Auto-Approved! Compliant with commercial discount policy.`,
        requiresApproval ? 'info' : 'success'
      );
    }
  };

  // Switch to Tab 2 (Approvals)
  const goToApprovals = () => {
    const tab = document.querySelector('[data-target="tab-approvals"]');
    if (tab) {
      tab.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Switch to Tab 3 (Fulfillment Split)
  const goToFulfillment = () => {
    const tab = document.querySelector('[data-target="tab-fulfillment"]');
    if (tab) {
      tab.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.href = "/quotation/new#tab-fulfillment";
    }
  };

  // Save Quotation as Draft / Pending Approval
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
    const hasRisk = calculatedRisk && calculatedRisk.requiresApproval;
    const initialStatus = hasRisk ? "Pending Approval" : "Draft";

    const quoteObject = {
      id: newId,
      customer_name: customerName.trim(),
      title: quoteTitle.trim() || `Quote #${newId}`,
      status: initialStatus,
      total_price: Math.round(totalValue),
      created_at: new Date().toISOString(),
      billing_schedule: {
        one_time_total: Math.round(oneTimeTotal),
        recurring_monthly: Math.round(recurringMonthlyTotal),
        recurring_annual: Math.round(recurringMonthlyTotal * 12),
        contract_months: contractMonths,
        tcv: Math.round(oneTimeTotal + (recurringMonthlyTotal * contractMonths)),
        terms: "Net 30 for equipment, monthly auto-invoice for SaaS lines"
      },
      lines: cart.map(c => ({
        id: c.id,
        product_id: c.productId,
        quantity: c.quantity,
        applied_discount: c.discount,
        is_subscription: c.is_subscription,
        unit: c.unit,
        product: {
          id: c.productId,
          name: c.name,
          category: c.category,
          price: c.price,
          is_subscription: c.is_subscription,
          unit: c.unit
        }
      })),
      blended_risk_score: calculatedRisk ? calculatedRisk.score : 0,
      approval_chain: calculatedRisk ? calculatedRisk.approvalRole : "Direct Auto-Approval"
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
      window.showToast(`Quotation #${newId} saved as ${initialStatus}!`, "success");
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
      billing_schedule: {
        one_time_total: Math.round(oneTimeTotal),
        recurring_monthly: Math.round(recurringMonthlyTotal),
        recurring_annual: Math.round(recurringMonthlyTotal * 12),
        contract_months: contractMonths,
        tcv: Math.round(oneTimeTotal + (recurringMonthlyTotal * contractMonths)),
        terms: "Net 30 for equipment, monthly recurring invoice for service lines"
      },
      lines: cart.map(c => ({
        id: c.id,
        product_id: c.productId,
        quantity: c.quantity,
        applied_discount: c.discount,
        is_subscription: c.is_subscription,
        unit: c.unit,
        product: {
          id: c.productId,
          name: c.name,
          category: c.category,
          price: c.price,
          is_subscription: c.is_subscription,
          unit: c.unit
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
    <div className="space-y-6 text-slate-100">
      
      {/* Quotation Header Configuration Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Quotation Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">Configure account details, line items, and commercial pricing</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Contract Value</div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                ${Math.round(totalValue).toLocaleString()}
              </div>
            </div>
            <div className="hidden sm:block pl-4 border-l border-slate-700">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Projected Margin</div>
              <div className={`text-xl font-bold font-mono ${liveMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${Math.round(liveMargin).toLocaleString()}
                <span className="text-xs font-medium ml-1 text-slate-400">
                  ({totalValue > 0 ? ((liveMargin / totalValue) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account & Reference Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Client / Account Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Acme Corporation, NextGen Labs"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-500 font-medium transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Quotation Title / Project Ref
            </label>
            <input
              type="text"
              value={quoteTitle}
              onChange={(e) => setQuoteTitle(e.target.value)}
              placeholder="e.g. Q4 Data Center Refresh"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-500 font-medium transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Subscription Term Length
            </label>
            <select
              value={contractMonths}
              onChange={(e) => setContractMonths(parseInt(e.target.value) || 12)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium transition-all"
            >
              <option className="bg-slate-900 text-white" value="12">12 Months (1 Year Commitment)</option>
              <option className="bg-slate-900 text-white" value="24">24 Months (2 Year Commitment)</option>
              <option className="bg-slate-900 text-white" value="36">36 Months (3 Year Enterprise)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Product Section */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-1.5">
          <span>+</span>
          <span>Add Products to Line Items</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
            >
              <option className="bg-slate-900 text-slate-400" value="">Select a product from catalog...</option>
              {allCatalogProducts.map(p => (
                <option className="bg-slate-900 text-white" key={p.id} value={p.id}>
                  {p.name} — ${Number(p.price).toLocaleString()} ({p.category})
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
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-400"
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
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-400 pr-8"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">%</span>
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={addToCart}
              disabled={!selectedProduct}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-black transition-all shadow-md ${
                selectedProduct 
                  ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 active:scale-[0.98] cursor-pointer' 
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              + Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Cart Items Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/60">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm">Configured Line Items</h3>
            <span className="text-xs bg-sky-400/20 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-400/30">
              {cart.length}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </div>
            <p className="text-sm font-medium text-slate-300">No line items in this quotation</p>
            <p className="text-xs text-slate-500 mt-1">Select products above or pick from recommendations below</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-800/80 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Product & Model</th>
                  <th className="px-4 py-3 text-center">Billing Type</th>
                  <th className="px-4 py-3 text-right">List Price</th>
                  <th className="px-4 py-3 text-center">Quantity</th>
                  <th className="px-4 py-3 text-center">Discount %</th>
                  <th className="px-6 py-3 text-right">Line Total</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {cart.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{item.name}</div>
                      <span className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-semibold inline-block mt-0.5">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        item.is_subscription
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}>
                        {item.is_subscription ? '● Recurring SaaS' : 'One-Time HW'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-white font-semibold">
                      ${item.price.toLocaleString()}
                      <span className="text-[11px] text-slate-400 ml-0.5">{item.is_subscription ? '/mo' : ''}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCartItem(item.id, 'quantity', e.target.value)}
                        className="w-16 text-center rounded-lg border border-slate-700 bg-slate-800 py-1 text-xs font-bold text-white font-mono focus:ring-1 focus:ring-sky-400"
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
                          className="w-16 text-center rounded-lg border border-slate-700 bg-slate-800 py-1 text-xs font-bold text-white font-mono focus:ring-1 focus:ring-sky-400"
                        />
                        <span className="text-xs text-slate-400 ml-1 font-mono">%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-white font-mono">
                      ${Math.round(calculateLineTotal(item)).toLocaleString()}
                      {item.is_subscription && <span className="text-[11px] font-normal text-slate-400 ml-1">/mo</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dual Billing Schedule & Contract Breakdown Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-6 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="font-bold text-base text-white">Dual Billing Schedule Breakdown</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Automated invoice separation: Physical deployment vs Cloud subscriptions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-sky-400/20 text-sky-300 border border-sky-400/30 px-3 py-1 rounded-full font-bold">
              Contract: {contractMonths} Months
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Box 1: One-Time Hardware */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider mb-2">
              <span>One-Time Capital Outlay</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">Net 30</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ${Math.round(oneTimeTotal).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Invoiced upon initial hardware deployment & staging</p>
          </div>

          {/* Box 2: Recurring Subscriptions */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider mb-2">
              <span>Recurring Services (MRR)</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">Monthly Auto</span>
            </div>
            <div className="text-2xl font-black text-purple-300 font-mono">
              ${Math.round(recurringMonthlyTotal).toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Annualized ARR: ${(Math.round(recurringMonthlyTotal * 12)).toLocaleString()} / yr
            </p>
          </div>

          {/* Box 3: Total Contract Value */}
          <div className="bg-sky-950/40 rounded-xl p-4 border border-sky-500/40">
            <div className="flex items-center justify-between text-xs text-sky-300 font-bold uppercase tracking-wider mb-2">
              <span>Total Contract Value (TCV)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Committed</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${Math.round(oneTimeTotal + (recurringMonthlyTotal * contractMonths)).toLocaleString()}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Capital Outlay + ({contractMonths}mo &times; ${(Math.round(recurringMonthlyTotal)).toLocaleString()})
            </p>
          </div>
        </div>
      </div>

      {/* Risk Engine Results Card (when calculated) */}
      {calculatedRisk && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold border border-sky-500/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Commercial Risk & Approval Chain</h3>
                <p className="text-xs text-slate-400">Evaluated against company discount limits at {calculatedRisk.timestamp}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${calculatedRisk.badgeColor}`}>
              Risk Score: {calculatedRisk.score}% • {calculatedRisk.level} Risk (Max Disc: {calculatedRisk.maxDiscount}%)
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="text-xs text-slate-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span><strong>Approval Workflow:</strong> {calculatedRisk.tierText}</span>
            </div>

            {calculatedRisk.requiresApproval ? (
              <button
                type="button"
                onClick={goToApprovals}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>View Approval Chain</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={goToFulfillment}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>Suggest Warehouse Split</span>
                <span>→</span>
              </button>
            )}
          </div>

          {calculatedRisk.categoryExcess.length > 0 && (
            <div className="text-xs space-y-1.5 text-slate-300">
              <span className="font-bold text-rose-400">Threshold Breaches:</span>
              {calculatedRisk.categoryExcess.map((ex, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 px-3 bg-rose-950/30 rounded-lg border border-rose-500/30">
                  <span className="text-white font-medium">{ex.item} ({ex.category})</span>
                  <span className="text-rose-400 font-bold font-mono">
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
        <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">Smart Margin Accelerators</h3>
              <p className="text-xs text-slate-400">Recommended complementary services and accessories</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
              High Margin
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableUpsells.map(up => (
              <div key={up.id} className="p-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:border-sky-400/60 hover:bg-slate-800 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-bold text-white text-sm">{up.name}</h4>
                    <span className="font-bold text-white text-sm font-mono">${up.price}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{up.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/80">
                  <span className="text-xs font-bold text-emerald-400">
                    +${up.margin_delta} margin delta
                  </span>
                  <button
                    onClick={() => addUpsell(up.product_id)}
                    className="px-3 py-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold rounded-lg transition-colors active:scale-95 cursor-pointer"
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
      <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-white">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          {savedQuoteId ? (
            <span className="text-emerald-400 font-bold">✓ Active Quotation Ref #{savedQuoteId}</span>
          ) : (
            <span>Ready to generate proposal for <strong className="text-white">{customerName || 'client'}</strong></span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleCalculateRisk}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            <span>Assess Risk</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleSendToCustomer}
            className="w-full sm:w-auto px-5 py-2.5 bg-sky-400 hover:bg-sky-300 active:scale-[0.98] text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            <span>Publish to Customer Portal</span>
          </button>
        </div>
      </div>

      {/* Customer Portal Published Modal */}
      {portalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full p-6 space-y-4 text-white">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Quotation Ready for Customer</h3>
              <p className="text-xs text-slate-400 mt-1">
                Proposal #{savedQuoteId} for <strong className="text-white">{customerName}</strong> is published. Share the client portal link for review & negotiation:
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-sky-400 truncate">
                {typeof window !== 'undefined' ? window.location.origin : ''}/portal/quote/{savedQuoteId || 1001}
              </span>
              <button
                onClick={copyPortalLink}
                className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-700 flex-shrink-0 cursor-pointer"
              >
                Copy
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`/portal/quote/${savedQuoteId || 1001}`}
                className="flex-1 py-2.5 text-center bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Open Portal View →
              </a>
              <button
                onClick={() => setPortalModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 rounded-xl text-xs transition-all cursor-pointer"
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