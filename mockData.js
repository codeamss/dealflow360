// Mock Data for DealFlow360 Frontend
// Enterprise-grade dataset supporting 200+ records across all platform entities

// Seed Base Catalog (Preserving core items for backward compatibility)
const baseProducts = [
  { id: 1, sku: "HW-SRV-42U", name: "Enterprise Server Rack", category: "Hardware", price: 12500, cost: 8125, unit: "each", tax: 0.08, is_subscription: false, description: "High-density 42U server rack with liquid cooling conduits" },
  { id: 2, sku: "SVC-CLD-1TB", name: "Cloud Backup Solution", category: "Services", price: 450, cost: 180, unit: "monthly", tax: 0.08, is_subscription: true, description: "Automated immutable cloud backup with 1TB hot storage tier" },
  { id: 3, sku: "HW-SW-48P", name: "Network Switch Pro", category: "Hardware", price: 3200, cost: 1950, unit: "each", tax: 0.08, is_subscription: false, description: "48-port Layer 3 managed PoE+ network switch" },
  { id: 4, sku: "SVC-SEC-MON", name: "Security Monitoring", category: "Services", price: 1200, cost: 520, unit: "monthly", tax: 0.08, is_subscription: true, description: "24/7 autonomous SOC security monitoring and SIEM log ingestion" },
  { id: 5, sku: "HW-NB-PRO", name: "Workstation Laptop", category: "Hardware", price: 2800, cost: 1820, unit: "each", tax: 0.08, is_subscription: false, description: "Precision engineering mobile workstation 64GB RAM / RTX 4080" },
  { id: 6, sku: "SVC-SLA-GLD", name: "Support Plan Gold", category: "Services", price: 950, cost: 380, unit: "monthly", tax: 0.08, is_subscription: true, description: "Mission-critical 24/7 support with 15-minute SLA guarantee" }
];

// Product name parts for realistic generator
const hwPrefixes = ["NextGen", "ProLine", "Titan", "Quantum", "Apex", "Edge", "Hyper", "Spectra", "Optima", "Vanguard", "Omni", "Core"];
const hwNouns = ["Blade Server", "SAN Storage Array", "Fiber Firewall", "Router Gateway", "100G Switch", "UPS Power Array", "IoT Sensor Hub", "Access Point Array", "KVM Matrix", "Backup Appliance", "AI Accelerator Card", "Cooling Distribution Unit"];
const svcPrefixes = ["Managed", "Autonomous", "Enterprise", "Dedicated", "Zero-Trust", "Continuous", "Elastic", "Cloud-Native", "Strategic", "Sentinel", "Compliance"];
const svcNouns = ["Threat Defense", "DevOps Pipeline Automation", "Database Tuning Retainer", "Identity & Access Governance", "Disaster Recovery Standby", "Multi-Cloud Mesh", "API Gateway Management", "ERP Integration Bridge", "Container Orchestration", "SOC Incident Response"];

// Generate 220+ Products
export const products = [...baseProducts];
let prodId = 7;

for (let i = 0; i < 110; i++) {
  const prefix = hwPrefixes[i % hwPrefixes.length];
  const noun = hwNouns[Math.floor(i / hwPrefixes.length) % hwNouns.length];
  const model = 1000 + (i * 35);
  const price = 1200 + ((i * 370) % 24000);
  products.push({
    id: prodId++,
    sku: `HW-${prefix.substring(0, 3).toUpperCase()}-${model}`,
    name: `${prefix} ${noun} ${model}`,
    category: "Hardware",
    price: price,
    cost: Math.round(price * 0.62),
    unit: "each",
    tax: 0.08,
    is_subscription: false,
    description: `Enterprise-grade ${noun.toLowerCase()} built for high-availability enterprise clusters.`
  });
}

for (let i = 0; i < 110; i++) {
  const prefix = svcPrefixes[i % svcPrefixes.length];
  const noun = svcNouns[Math.floor(i / svcPrefixes.length) % svcNouns.length];
  const tier = (i % 3 === 0) ? "Tier 1" : (i % 3 === 1) ? "Premium" : "Enterprise";
  const price = 250 + ((i * 125) % 4500);
  products.push({
    id: prodId++,
    sku: `SVC-${prefix.substring(0, 3).toUpperCase()}-${100 + i}`,
    name: `${prefix} ${noun} (${tier})`,
    category: "Services",
    price: price,
    cost: Math.round(price * 0.45),
    unit: "monthly",
    tax: 0.08,
    is_subscription: true,
    description: `Managed recurring ${noun.toLowerCase()} service with continuous monitoring and regular updates.`
  });
}

// Customers Pool
const corporateClients = [
  "Acme Corporation", "Beta Industries", "Global Tech Inc", "Innovate Solutions", "Data Systems Ltd", 
  "NextGen Labs", "Nova Retail", "Zenith Co", "Orion Ltd", "Delta LLC", 
  "Apex Logistics", "Vanguard Health", "Cyberdyne Systems", "Stark Industries", "Wayne Enterprises", 
  "Initech Corp", "Hooli Cloud", "Pied Piper", "Massive Dynamic", "Globex Corporation", 
  "Weyland-Yutani", "Tyrell Corporation", "Wonka Industries", "Oceanic Global", "Soylent Logistics",
  "Nakamura Trading", "Strata Energy", "Omni Consumer Tech", "Aperture Science", "Umbrella BioTech",
  "Sterling Cooper", "Dunder Mifflin Tech", "Veridian Dynamics", "Prestige Financial", "Kramerica Industries"
];

const salesReps = [
  { id: 201, name: "Sarah Jenkins" },
  { id: 202, name: "Alex Johnson" },
  { id: 203, name: "Marcus Vance" },
  { id: 204, name: "Elena Rostova" },
  { id: 205, name: "David Kim" }
];

const quoteStatuses = ["Draft", "Pending Approval", "Approved", "Negotiation", "Confirmed"];

// Generate 215+ Quotations
export const quotations = [
  {
    id: 1001,
    customer_name: "Acme Corporation",
    status: "Draft",
    total_price: 18700,
    created_at: "2026-09-01T10:30:00Z",
    lines: [
      { id: 1, product_id: 1, quantity: 1, applied_discount: 10, product: products[0] },
      { id: 2, product_id: 3, quantity: 2, applied_discount: 5, product: products[2] }
    ],
    blended_risk_score: 12,
    customer_id: 101,
    rep_id: 201
  },
  {
    id: 1002,
    customer_name: "Beta Industries",
    status: "Pending Approval",
    total_price: 28000,
    created_at: "2026-09-02T14:15:00Z",
    lines: [
      { id: 3, product_id: 1, quantity: 2, applied_discount: 18, product: products[0] },
      { id: 4, product_id: 4, quantity: 2, applied_discount: 12, product: products[3] }
    ],
    blended_risk_score: 38,
    customer_id: 102,
    rep_id: 202
  },
  {
    id: 1003,
    customer_name: "Nova Retail",
    status: "Approved",
    total_price: 9750,
    created_at: "2026-09-03T09:45:00Z",
    lines: [
      { id: 5, product_id: 5, quantity: 3, applied_discount: 8, product: products[4] },
      { id: 6, product_id: 6, quantity: 1, applied_discount: 5, product: products[5] }
    ],
    blended_risk_score: 14,
    customer_id: 103,
    rep_id: 201
  },
  {
    id: 1004,
    customer_name: "Zenith Co",
    status: "Negotiation",
    total_price: 15300,
    created_at: "2026-09-04T16:20:00Z",
    lines: [
      { id: 7, product_id: 1, quantity: 1, applied_discount: 14, product: products[0] },
      { id: 8, product_id: 2, quantity: 3, applied_discount: 10, product: products[1] }
    ],
    blended_risk_score: 24,
    customer_id: 104,
    rep_id: 202
  },
  {
    id: 1005,
    customer_name: "Orion Ltd",
    status: "Confirmed",
    total_price: 41000,
    created_at: "2026-09-05T11:10:00Z",
    lines: [
      { id: 9, product_id: 1, quantity: 3, applied_discount: 6, product: products[0] },
      { id: 10, product_id: 3, quantity: 2, applied_discount: 4, product: products[2] }
    ],
    blended_risk_score: 8,
    customer_id: 105,
    rep_id: 201
  }
];

for (let i = 1006; i <= 1220; i++) {
  const custIndex = (i * 7) % corporateClients.length;
  const statusIndex = (i % 5);
  const status = quoteStatuses[statusIndex];
  const rep = salesReps[i % salesReps.length];
  const numLines = 1 + (i % 3);
  const quoteLines = [];
  let sum = 0;

  for (let l = 0; l < numLines; l++) {
    const prod = products[(i * 3 + l * 11) % products.length];
    const qty = 1 + ((i + l) % 4);
    const disc = (status === "Pending Approval" || (i % 3 === 0)) ? (12 + (i % 15)) : (i % 10);
    const lineTotal = prod.price * qty * (1 - disc / 100);
    sum += lineTotal;
    quoteLines.push({
      id: i * 10 + l,
      product_id: prod.id,
      quantity: qty,
      applied_discount: disc,
      product: prod
    });
  }

  const risk = (status === "Pending Approval") ? Math.min(58, 25 + (i % 30)) : (i % 22);

  // Generate date in past 30 days
  const dayOffset = (i % 28) + 1;
  const hour = 9 + (i % 9);
  const minute = (i * 17) % 60;
  const dateStr = `2026-08-${String(dayOffset).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;

  quotations.push({
    id: i,
    customer_name: corporateClients[custIndex],
    status: status,
    total_price: Math.round(sum),
    created_at: dateStr,
    lines: quoteLines,
    blended_risk_score: risk,
    customer_id: 100 + custIndex,
    rep_id: rep.id,
    rep_name: rep.name
  });
}

// Generate 210+ Approvals Queue
export const approvals = [];
let approvalId = 3001;

quotations.forEach((q, idx) => {
  if (idx < 212) {
    const isPending = q.status === "Pending Approval" || (idx % 3 === 0 && q.blended_risk_score >= 15);
    const isReturned = (idx % 11 === 0 && !isPending);
    const isApproved = !isPending && !isReturned;

    const riskLevel = q.blended_risk_score >= 28 ? "HIGH" : (q.blended_risk_score >= 15 ? "MEDIUM" : "LOW");
    const stage = q.blended_risk_score >= 28 ? "Finance Review" : "Sales Manager";
    const assigned = q.blended_risk_score >= 28 ? "Rachel Iyer (VP Finance)" : "Sarah Chen (Sales Mgr)";

    const worstDiscount = Math.max(...q.lines.map(l => l.applied_discount || 0), 12);
    const allowedLimit = (q.lines[0]?.product?.category === "Services") ? 10 : 15;
    const overBy = Math.max(0, worstDiscount - allowedLimit);

    approvals.push({
      id: approvalId++,
      quotation_id: q.id,
      customer: q.customer_name,
      amount: q.total_price,
      blended_risk: q.blended_risk_score,
      risk_level: riskLevel,
      stage: stage,
      assigned_to: assigned,
      status: isPending ? "Pending" : (isReturned ? "Returned" : "Approved"),
      submitted_date: q.created_at.split("T")[0],
      breach_line: q.lines[0]?.product?.name || "Managed Cloud Service",
      breach_discount: worstDiscount,
      allowed_limit: allowedLimit,
      over_by: overBy,
      notes: overBy > 0 ? `${overBy} pt breach over ${allowedLimit}% policy ceiling` : "Within standard operational bounds",
      audit_history: [
        { user: q.rep_name || "Sarah Jenkins", action: "Submitted for discount review", date: q.created_at.split("T")[0], note: "Competitive deal matching requested" },
        ...(isApproved ? [{ user: assigned.split(" ")[0], action: "Approved discount request", date: "2026-09-02", note: "Approved with strategic margin sign-off" }] : []),
        ...(isReturned ? [{ user: assigned.split(" ")[0], action: "Returned for revision", date: "2026-09-03", note: "Please cap maximum discount at 12%" }] : [])
      ]
    });
  }
});

// Generate 4 Regional Warehouses with 225+ Inventory rows
export const warehouses = [
  { id: 1, code: "WH-MAIN", name: "Main Central Hub", location: "Dallas, TX", capacity: "120,000 sq ft", inventory: [] },
  { id: 2, code: "WH-EAST", name: "East Coast Depot", location: "Newark, NJ", capacity: "85,000 sq ft", inventory: [] },
  { id: 3, code: "WH-WEST", name: "West Coast Depot", location: "Oakland, CA", capacity: "95,000 sq ft", inventory: [] },
  { id: 4, code: "WH-CENTRAL", name: "Midwest Logistics Facility", location: "Chicago, IL", capacity: "65,000 sq ft", inventory: [] }
];

export const warehouse_inventory = [];
let invId = 5001;

// Distribute products across warehouses (225+ inventory items)
products.slice(0, 60).forEach((prod) => {
  warehouses.forEach((wh, whIdx) => {
    const inStock = 15 + ((prod.id * 7 + whIdx * 19) % 180);
    const reserved = Math.min(inStock, ((prod.id * 3 + whIdx) % 15));
    const available = inStock - reserved;

    const invItem = {
      id: invId++,
      warehouse_id: wh.id,
      warehouse_name: wh.name,
      warehouse_code: wh.code,
      product_id: prod.id,
      product_sku: prod.sku || `SKU-${prod.id}`,
      product_name: prod.name,
      category: prod.category,
      in_stock: inStock,
      reserved: reserved,
      available: available,
      unit_price: prod.price,
      total_asset_value: inStock * prod.price
    };

    wh.inventory.push(invItem);
    warehouse_inventory.push(invItem);
  });
});

// Generate 210+ Orders Awaiting Fulfillment
export const orders_awaiting_fulfillment = [];
let ordId = 8001;
const fulfillmentStatuses = ["Ready for Split", "Partially Dispatched", "Backorder Pending", "Ready for Split", "Dispatch Scheduled"];

for (let i = 0; i < 215; i++) {
  const cust = corporateClients[i % corporateClients.length];
  const prod1 = products[i % products.length];
  const prod2 = products[(i + 7) % products.length];
  const whNames = (i % 2 === 0) ? ["Main Central Hub", "East Coast Depot"] : ["West Coast Depot", "Midwest Logistics Facility"];

  orders_awaiting_fulfillment.push({
    id: ordId++,
    order_number: `ORD-${202600 + i}`,
    quotation_id: 1001 + (i % 200),
    customer: cust,
    amount: 3500 + ((i * 470) % 48000),
    status: fulfillmentStatuses[i % fulfillmentStatuses.length],
    assigned_warehouses: whNames,
    items: [
      { product_name: prod1.name, quantity: 2 + (i % 5), unit_price: prod1.price },
      { product_name: prod2.name, quantity: 1 + (i % 3), unit_price: prod2.price }
    ],
    created_date: `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
    estimated_dispatch: `2026-09-${String((i % 15) + 8).padStart(2, '0')}`
  });
}

// Generate 220+ Recurring Subscriptions
export const subscriptions = [];
let subId = 2001;
const planNames = [
  "Enterprise Cloud Backup (5TB)", "Dedicated 24/7 SLA Support Tier 1", "SaaS Fleet Monitoring (50 nodes)",
  "Multi-Site VPN Security Mesh", "AI Threat Intelligence Continuous Feed", "Zero-Trust Identity Sentinel",
  "Elastic Data Lake Pipeline", "Automated DevOps CI/CD Retainer", "Autonomous Database High-Availability",
  "Multi-Tenant Container Mesh", "Continuous Compliance Shield", "Disaster Recovery Standby Cluster"
];
const cadences = ["Monthly", "Quarterly", "Annual"];
const subStatuses = ["Active", "Active", "Active", "In Review", "Expiring Soon"];

for (let i = 0; i < 222; i++) {
  const cust = corporateClients[i % corporateClients.length];
  const plan = planNames[i % planNames.length];
  const cadence = cadences[i % cadences.length];
  const mrr = 280 + ((i * 65) % 3200);
  const status = subStatuses[i % subStatuses.length];

  const month = (i % 12) + 1;
  const day = (i % 28) + 1;
  const nextDate = `2026-${String(month > 8 ? month : month + 4).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  subscriptions.push({
    id: subId++,
    contract_number: `SUB-${2000 + i + 1}`,
    customer: cust,
    plan_name: plan,
    cadence: cadence,
    mrr_value: mrr,
    arr_value: mrr * 12,
    next_bill_date: nextDate,
    status: status,
    start_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-01`,
    term_months: (cadence === "Annual") ? 24 : 12
  });
}

// Generate 230+ Invoices
export const invoices = [];
let invNum = 1001;
const invStatuses = ["Paid", "Paid", "Paid", "Paid", "Unpaid", "Overdue"];

for (let i = 0; i < 232; i++) {
  const cust = corporateClients[i % corporateClients.length];
  const amount = 45 + ((i * 280) % 38000);
  const status = invStatuses[i % invStatuses.length];
  const dueDay = (i % 28) + 1;
  const month = ((i % 3) + 7); // July, Aug, Sept

  invoices.push({
    id: invNum++,
    invoice_number: `INV-${1000 + i + 1}`,
    order_number: `ORD-${202600 + (i % 200)}`,
    customer: cust,
    amount: amount,
    status: status,
    issue_date: `2026-0${month}-${String(Math.max(1, dueDay - 14)).padStart(2, '0')}`,
    due_date: `2026-0${month}-${String(dueDay).padStart(2, '0')}`,
    reconciled: status === "Paid",
    line_count: 1 + (i % 4)
  });
}

// Generate 215+ Deal Health Tracked Opportunities
export const deal_health = [];
quotations.forEach((q, idx) => {
  if (idx < 218) {
    const daysStalled = (idx % 4 === 0) ? (3 + (idx % 8)) : (idx % 3);
    const isStalled = daysStalled >= 2;
    const isHighRisk = q.blended_risk_score >= 25;
    const margin = Math.max(12, 42 - Math.round(q.blended_risk_score * 0.6));

    let category = "Healthy";
    if (isHighRisk && isStalled) category = "Critical Anomaly";
    else if (isHighRisk) category = "High Commercial Risk";
    else if (isStalled) category = "Stalled Opportunity (>48h)";

    deal_health.push({
      id: q.id,
      customer: q.customer_name,
      amount: q.total_price,
      stage: q.status,
      rep: q.rep_name || "Sarah Jenkins",
      days_stalled: daysStalled,
      blended_risk: q.blended_risk_score,
      gross_margin_pct: margin,
      health_category: category,
      flagged: isStalled || isHighRisk,
      action_recommended: isHighRisk ? "Escalate to VP Finance" : (isStalled ? "Nudge Sales Rep" : "Maintain Pace")
    });
  }
});

// Available Upsells
export const upsells = [
  { id: 1, base_product_id: 1, upsell_product_id: 4, name: "Add Security Monitoring", description: "Protect server racks with 24/7 autonomous monitoring", discount: 15, margin_delta: 350 },
  { id: 2, base_product_id: 1, upsell_product_id: 2, name: "Add Cloud Backup", description: "Automated snapshot backup directly from hardware racks", discount: 10, margin_delta: 120 },
  { id: 3, base_product_id: 3, upsell_product_id: 6, name: "Add Gold Support SLA", description: "15-minute response SLA on all switch infrastructure", discount: 12, margin_delta: 280 },
  { id: 4, base_product_id: 5, upsell_product_id: 4, name: "Add Endpoint Defense", description: "Comprehensive EDR protection for enterprise laptops", discount: 20, margin_delta: 190 }
];

// Helper to get products merged with user custom additions from localStorage
export function getAllProducts() {
  if (typeof window === "undefined") return products;
  try {
    const custom = localStorage.getItem("dealflow360_custom_products");
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...parsed, ...products];
      }
    }
  } catch (e) {}
  return products;
}