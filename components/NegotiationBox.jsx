import { useState, useEffect } from "react";
import { confirmQuoteAndSendToBilling } from "../billingService.js";

export default function NegotiationBox({ quotationId = 1001, isCustomerView = false }) {
  const [counterDiscount, setCounterDiscount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [negotiationHistory, setNegotiationHistory] = useState([
    {
      id: 1,
      type: "internal",
      message: "Initial formal proposal generated with standard 10% commercial discount.",
      discount: 10,
      timestamp: "2026-09-04T10:30:00Z",
      user: "Alex Johnson (Account Executive)"
    },
    {
      id: 2,
      type: "customer",
      message: "Our Q3 departmental budget has a ceiling. Could you consider 16% if we execute the agreement before the 15th?",
      discount: 16,
      timestamp: "2026-09-04T14:45:00Z",
      user: isCustomerView ? "You (Customer)" : "Customer Procurement"
    }
  ]);

  const storageKey = `dealflow360_negotiations_${quotationId}`;

  // Load persisted negotiations if any
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNegotiationHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load negotiation history:", e);
    }
  }, [quotationId]);

  const saveHistory = (newHistory) => {
    setNegotiationHistory(newHistory);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
    } catch (e) {
      console.warn("Could not save negotiation history:", e);
    }
  };

  const handleSubmitCounter = (e) => {
    if (e) e.preventDefault();
    if (!counterDiscount || isSubmitting) return;

    const discountVal = parseFloat(counterDiscount);
    if (isNaN(discountVal) || discountVal < 0 || discountVal > 90) {
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Please enter a valid discount between 0% and 90%", "error");
      }
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      const exceedsThreshold = discountVal > 12;
      const newNegotiation = {
        id: Date.now(),
        type: isCustomerView ? "customer" : "internal",
        message: counterMessage.trim() || `Proposed revised discount of ${discountVal}%.`,
        discount: discountVal,
        exceedsThreshold,
        timestamp: new Date().toISOString(),
        user: isCustomerView ? "Customer Procurement" : "Sales Directorate"
      };
      
      let updated = [newNegotiation, ...negotiationHistory];

      // Rule #9: If terms change beyond thresholds (12%), the quote automatically re-enters approval flow
      if (exceedsThreshold) {
        const thresholdEvent = {
          id: Date.now() + 1,
          type: "system",
          message: `⚠️ Policy Threshold Trigger: Counter-offer of ${discountVal}% exceeds standard 12% discount ceiling. Quotation #${quotationId} has automatically re-entered the approval flow for Sales Manager sign-off.`,
          discount: discountVal,
          isWarning: true,
          timestamp: new Date(Date.now() + 100).toISOString(),
          user: "Governance Engine"
        };
        updated = [thresholdEvent, ...updated];

        try {
          const stored = JSON.parse(localStorage.getItem("dealflow360_custom_quotes") || "[]");
          const updatedQuotes = stored.map(q => {
            if (q.id === parseInt(quotationId)) {
              return { 
                ...q, 
                status: "Pending Approval", 
                reapproval_reason: `Counter-offer of ${discountVal}% exceeds 12% policy threshold` 
              };
            }
            return q;
          });
          localStorage.setItem("dealflow360_custom_quotes", JSON.stringify(updatedQuotes));
          window.dispatchEvent(new Event("storage"));
        } catch (err) {
          console.warn("Failed to update quote status upon threshold breach:", err);
        }
      }

      saveHistory(updated);
      setCounterDiscount("");
      setCounterMessage("");
      setIsSubmitting(false);

      if (typeof window !== "undefined" && window.showToast) {
        window.showToast(
          exceedsThreshold 
            ? `Threshold breach (>12%): Quote #${quotationId} re-routed for Sales Manager approval` 
            : isCustomerView 
              ? `Counter-offer of ${discountVal}% submitted to sales team` 
              : `Revised discount offer of ${discountVal}% published to customer portal`,
          exceedsThreshold ? "info" : "success"
        );
      }
    }, 400);
  };

  const handleAcceptOffer = (item) => {
    const orderId = `ORD-2026-${quotationId}`;
    const invoiceId = `INV-2026-${quotationId}`;

    const confirmMsg = {
      id: Date.now(),
      type: "system",
      message: `Agreement sealed! ${isCustomerView ? "Customer ratified" : "Sales Directorate approved"} the ${item.discount}% discount proposal. Order ${orderId} created, Invoice ${invoiceId} generated, and physical equipment dispatched to regional warehouse fulfillment queue.`,
      discount: item.discount,
      isSuccess: true,
      timestamp: new Date().toISOString(),
      user: "System Confirmation"
    };

    const updated = [confirmMsg, ...negotiationHistory];
    saveHistory(updated);

    // Generate invoice and subscription and persist to billing operations
    try {
      confirmQuoteAndSendToBilling(quotationId, { discount: item.discount });
    } catch (err) {
      console.warn("Failed to generate billing records:", err);
    }

    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(`Quotation Confirmed! Invoice #${invoiceId} and Subscription #SUB-2026-${quotationId} sent to billing operations.`, "success");
    }
  };

  const calculateCurrentDiscount = () => {
    if (negotiationHistory.length === 0) return 0;
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

  const getDiscountBadgeStyle = (discount) => {
    if (discount <= 10) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    if (discount <= 20) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    return "bg-rose-500/20 text-rose-300 border-rose-500/40";
  };

  const quickPresets = [8, 12, 15, 18, 22];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden text-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-base">Direct Negotiation Channel</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
              {isCustomerView ? "Customer Portal" : "Internal Sales Desk"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exchange counter-proposals and negotiate terms securely in real time
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Active Offer:</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getDiscountBadgeStyle(calculateCurrentDiscount())}`}>
            {calculateCurrentDiscount()}% Off
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Proposal Form */}
        <form onSubmit={handleSubmitCounter} className="p-5 bg-slate-800/70 rounded-xl border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {isCustomerView ? "Submit Counter Discount Offer" : "Issue Commercial Counter-Proposal"}
            </label>
            
            {/* Quick chips */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium mr-1">Quick:</span>
              {quickPresets.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCounterDiscount(preset.toString())}
                  className="px-2 py-0.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <div className="relative">
                <input
                  type="number"
                  value={counterDiscount}
                  onChange={(e) => setCounterDiscount(e.target.value)}
                  min="0"
                  max="90"
                  step="0.5"
                  placeholder="e.g. 15"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-700 rounded-xl bg-slate-800 text-white font-mono focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  disabled={isSubmitting}
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 font-mono">% off</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <input
                type="text"
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Rationale (e.g. Volume commitment, quarterly budget cap)..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-700 rounded-xl bg-slate-800 text-white font-medium focus:ring-2 focus:ring-sky-400 focus:outline-none placeholder:text-slate-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!counterDiscount || isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center shadow-lg transition-all cursor-pointer ${
                !counterDiscount || isSubmitting
                  ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                  : "bg-sky-400 hover:bg-sky-300 text-slate-950 active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 mr-1.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Transmit Counter Offer
                </>
              )}
            </button>
          </div>
        </form>

        {/* Timeline Log */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Negotiation Audit Stream ({negotiationHistory.length})
          </h4>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {negotiationHistory.map((item) => {
              const isCust = item.type === "customer";
              const isSys = item.type === "system";

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSys
                      ? item.isWarning
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-200 shadow-sm"
                        : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                      : isCust
                      ? "bg-slate-800/80 border-sky-500/30 text-slate-200"
                      : "bg-slate-800/60 border-slate-700 text-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.isWarning
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : isSys
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : isCust
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          : "bg-slate-700 text-slate-300 border border-slate-600"
                      }`}>
                        {item.isWarning ? "!" : isSys ? "✓" : isCust ? "C" : "S"}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{item.user}</span>
                        <span className="text-[11px] text-slate-400 font-mono ml-2">{formatDate(item.timestamp)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border font-mono ${getDiscountBadgeStyle(item.discount)}`}>
                        {item.discount}%
                      </span>

                      {!isSys && (
                        <button
                          type="button"
                          onClick={() => handleAcceptOffer(item)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors cursor-pointer"
                          title="Ratify and accept this discount level"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    {item.message}
                  </p>

                  {item.isSuccess && (
                    <div className="mt-3 pt-2.5 border-t border-emerald-500/30 flex items-center justify-between pl-8">
                      <span className="text-[11px] font-bold text-emerald-400">
                        Order #ORD-2026-{quotationId} &bull; Invoice Issued
                      </span>
                      <a
                        href="/quotation/new#tab-fulfillment"
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[11px] font-black shadow-sm transition-all"
                      >
                        Proceed to Fulfillment &rarr;
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}