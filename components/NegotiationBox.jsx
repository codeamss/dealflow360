import { useState, useEffect } from "react";

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
      const newNegotiation = {
        id: Date.now(),
        type: isCustomerView ? "customer" : "internal",
        message: counterMessage.trim() || `Proposed revised discount of ${discountVal}%.`,
        discount: discountVal,
        timestamp: new Date().toISOString(),
        user: isCustomerView ? "You (Customer Procurement)" : "Sales Directorate"
      };
      
      const updated = [newNegotiation, ...negotiationHistory];
      saveHistory(updated);
      setCounterDiscount("");
      setCounterMessage("");
      setIsSubmitting(false);

      if (typeof window !== "undefined" && window.showToast) {
        window.showToast(
          isCustomerView 
            ? `Counter-offer of ${discountVal}% submitted to sales team` 
            : `Revised discount offer of ${discountVal}% published to customer portal`,
          "success"
        );
      }
    }, 400);
  };

  const handleAcceptOffer = (item) => {
    const confirmMsg = {
      id: Date.now(),
      type: "system",
      message: `Agreement confirmed! ${isCustomerView ? "Customer accepted" : "Sales Directorate ratified"} the ${item.discount}% discount proposal. Order is progressing to fulfillment.`,
      discount: item.discount,
      timestamp: new Date().toISOString(),
      user: "System Confirmation"
    };

    const updated = [confirmMsg, ...negotiationHistory];
    saveHistory(updated);

    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(`Offer of ${item.discount}% discount accepted! Status: Confirmed`, "success");
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
    if (discount <= 10) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (discount <= 20) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  const quickPresets = [8, 12, 15, 18, 22];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Direct Negotiation Channel</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {isCustomerView ? "Customer Portal" : "Internal Sales Desk"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exchange counter-proposals and negotiate terms securely in real time
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Active Offer:</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getDiscountBadgeStyle(calculateCurrentDiscount())}`}>
            {calculateCurrentDiscount()}% Off
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Proposal Form */}
        <form onSubmit={handleSubmitCounter} className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                  className="px-2 py-0.5 text-xs font-medium bg-white hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-colors"
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  disabled={isSubmitting}
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">% off</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <input
                type="text"
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Rationale (e.g. Volume commitment, quarterly budget cap)..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!counterDiscount || isSubmitting}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center shadow-sm transition-all ${
                !counterDiscount || isSubmitting
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
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
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : isCust
                      ? "bg-indigo-50/50 border-indigo-100"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSys
                          ? "bg-emerald-200 text-emerald-800"
                          : isCust
                          ? "bg-indigo-200 text-indigo-800"
                          : "bg-slate-200 text-slate-800"
                      }`}>
                        {isSys ? "✓" : isCust ? "C" : "S"}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">{item.user}</span>
                        <span className="text-[11px] text-slate-500 ml-2">{formatDate(item.timestamp)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getDiscountBadgeStyle(item.discount)}`}>
                        {item.discount}%
                      </span>

                      {!isSys && (
                        <button
                          type="button"
                          onClick={() => handleAcceptOffer(item)}
                          className="px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-colors"
                          title="Ratify and accept this discount level"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pl-8">
                    {item.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}