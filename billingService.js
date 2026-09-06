// ----------------------------------------------------------------------
// billingService.js – DealFlow360 Enterprise Billing & Invoicing Service
// Manages invoice and subscription generation upon quotation confirmation
// ----------------------------------------------------------------------

import { quotations } from './mockData.js';

export function getCustomInvoices() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('dealflow360_custom_invoices') || '[]');
  } catch (e) {
    return [];
  }
}

export function getCustomSubscriptions() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('dealflow360_custom_subscriptions') || '[]');
  } catch (e) {
    return [];
  }
}

export function getConfirmedQuote(quoteId) {
  if (typeof window === 'undefined') return null;
  try {
    const quotes = JSON.parse(localStorage.getItem('dealflow360_custom_quotes') || '[]');
    return quotes.find(q => q.id === parseInt(quoteId)) || null;
  } catch (e) {
    return null;
  }
}

export function confirmQuoteAndSendToBilling(quoteId, options = {}) {
  const qId = parseInt(quoteId);

  // 1. Find quote in localStorage or mockData
  let storedQuotes = [];
  if (typeof window !== 'undefined') {
    try {
      storedQuotes = JSON.parse(localStorage.getItem('dealflow360_custom_quotes') || '[]');
    } catch (e) {}
  }

  let targetQuote = storedQuotes.find(q => q.id === qId) ||
                    quotations.find(q => q.id === qId);

  if (!targetQuote) {
    targetQuote = {
      id: qId,
      customer_name: options.customer_name || "Acme Corporation",
      total_price: 18700,
      lines: [
        { product_id: 1, quantity: 1, applied_discount: 10 },
        { product_id: 3, quantity: 2, applied_discount: 5 }
      ]
    };
  }

  const discount = Number(options.discount) || 0;
  const rawPrice = Number(targetQuote.total_price) || 18700;
  const finalPrice = discount > 0 ? Math.round(rawPrice * (1 - discount / 100)) : rawPrice;

  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const orderNumber = `ORD-2026-${qId}`;
  const invoiceNumber = `INV-2026-${qId}`;
  const contractNumber = `SUB-2026-${qId}`;

  // 2. Build Invoice Record
  const newInvoice = {
    id: 9000 + qId,
    invoice_number: invoiceNumber,
    order_number: orderNumber,
    customer: targetQuote.customer_name || "Acme Corporation",
    amount: finalPrice,
    status: "Payment Due",
    issue_date: today,
    due_date: dueDate,
    reconciled: false,
    line_count: targetQuote.lines ? targetQuote.lines.length : 2,
    quotation_id: qId,
    created_at: new Date().toISOString()
  };

  // 3. Build Subscription Record (Monthly SaaS contract)
  const mrr = Math.max(350, Math.round(finalPrice * 0.12));
  const newSub = {
    id: 7000 + qId,
    contract_number: contractNumber,
    customer: targetQuote.customer_name || "Acme Corporation",
    plan_name: "Enterprise Hybrid SaaS & Infrastructure Support",
    cadence: "Monthly",
    mrr_value: mrr,
    arr_value: mrr * 12,
    next_bill_date: dueDate,
    status: "Active",
    start_date: today,
    term_months: 12,
    quotation_id: qId,
    created_at: new Date().toISOString()
  };

  // 4. Update Quotation Status
  const confirmedQuote = {
    ...targetQuote,
    status: "Confirmed",
    order_id: orderNumber,
    invoice_id: invoiceNumber,
    contract_id: contractNumber,
    total_price: finalPrice,
    confirmed_discount: discount,
    confirmed_at: new Date().toISOString()
  };

  // 5. Persist to localStorage if running on client
  if (typeof window !== 'undefined') {
    try {
      // Invoices
      let invoices = JSON.parse(localStorage.getItem('dealflow360_custom_invoices') || '[]');
      invoices = invoices.filter(i => i.quotation_id !== qId && i.invoice_number !== invoiceNumber);
      invoices.unshift(newInvoice);
      localStorage.setItem('dealflow360_custom_invoices', JSON.stringify(invoices));

      // Subscriptions
      let subs = JSON.parse(localStorage.getItem('dealflow360_custom_subscriptions') || '[]');
      subs = subs.filter(s => s.quotation_id !== qId && s.contract_number !== contractNumber);
      subs.unshift(newSub);
      localStorage.setItem('dealflow360_custom_subscriptions', JSON.stringify(subs));

      // Quotes
      const qIdx = storedQuotes.findIndex(q => q.id === qId);
      if (qIdx >= 0) {
        storedQuotes[qIdx] = confirmedQuote;
      } else {
        storedQuotes.unshift(confirmedQuote);
      }
      localStorage.setItem('dealflow360_custom_quotes', JSON.stringify(storedQuotes));

      // Dispatch global storage and custom events for live reactive UI updates
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('dealflow360_billing_updated', {
        detail: { quote: confirmedQuote, invoice: newInvoice, subscription: newSub }
      }));
    } catch (e) {
      console.error("Failed to persist confirmed billing entities:", e);
    }
  }

  return { quote: confirmedQuote, invoice: newInvoice, subscription: newSub };
}

// Attach to window for easy direct script accessibility in .astro templates
if (typeof window !== 'undefined') {
  window.DealFlowBilling = {
    getCustomInvoices,
    getCustomSubscriptions,
    getConfirmedQuote,
    confirmQuoteAndSendToBilling
  };
}
