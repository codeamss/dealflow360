// Mock Data for DealFlow360 Frontend
// This provides realistic sample data for testing UI components

export const products = [
  {
    id: 1,
    name: "Enterprise Server Rack",
    category: "Hardware",
    price: 12500,
    unit: "each",
    tax: 0.08,
    is_subscription: false,
    description: "High-density 42U server rack with cooling"
  },
  {
    id: 2,
    name: "Cloud Backup Solution",
    category: "Services",
    price: 450,
    unit: "monthly",
    tax: 0.08,
    is_subscription: true,
    description: "Secure cloud backup with 1TB storage"
  },
  {
    id: 3,
    name: "Network Switch Pro",
    category: "Hardware",
    price: 3200,
    unit: "each",
    tax: 0.08,
    is_subscription: false,
    description: "48-port managed network switch"
  },
  {
    id: 4,
    name: "Security Monitoring",
    category: "Services",
    price: 1200,
    unit: "monthly",
    tax: 0.08,
    is_subscription: true,
    description: "24/7 security monitoring and alerting"
  },
  {
    id: 5,
    name: "Workstation Laptop",
    category: "Hardware",
    price: 2800,
    unit: "each",
    tax: 0.08,
    is_subscription: false,
    description: "High-performance engineering laptop"
  },
  {
    id: 6,
    name: "Support Plan Gold",
    category: "Services",
    price: 950,
    unit: "monthly",
    tax: 0.08,
    is_subscription: true,
    description: "Premium 24/7 support with 4-hour response"
  }
];

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
    blended_risk_score: 0,
    customer_id: 101,
    rep_id: 201
  },
  {
    id: 1002,
    customer_name: "Global Tech Inc",
    status: "Pending Approval",
    total_price: 25600,
    created_at: "2026-09-02T14:15:00Z",
    lines: [
      { id: 3, product_id: 1, quantity: 2, applied_discount: 15, product: products[0] },
      { id: 4, product_id: 4, quantity: 1, applied_discount: 0, product: products[3] }
    ],
    blended_risk_score: 35,
    customer_id: 102,
    rep_id: 202
  },
  {
    id: 1003,
    customer_name: "Innovate Solutions",
    status: "Negotiation",
    total_price: 8900,
    created_at: "2026-09-03T09:45:00Z",
    lines: [
      { id: 5, product_id: 5, quantity: 3, applied_discount: 12, product: products[4] },
      { id: 6, product_id: 6, quantity: 1, applied_discount: 8, product: products[5] }
    ],
    blended_risk_score: 22,
    customer_id: 103,
    rep_id: 201
  },
  {
    id: 1004,
    customer_name: "Data Systems Ltd",
    status: "Confirmed",
    total_price: 43200,
    created_at: "2026-09-04T16:20:00Z",
    lines: [
      { id: 7, product_id: 1, quantity: 3, applied_discount: 8, product: products[0] },
      { id: 8, product_id: 2, quantity: 2, applied_discount: 10, product: products[1] },
      { id: 9, product_id: 3, quantity: 1, applied_discount: 5, product: products[2] }
    ],
    blended_risk_score: 18,
    customer_id: 104,
    rep_id: 202
  },
  {
    id: 1005,
    customer_name: "NextGen Labs",
    status: "Draft",
    total_price: 5600,
    created_at: "2026-09-05T11:10:00Z",
    lines: [
      { id: 10, product_id: 5, quantity: 2, applied_discount: 0, product: products[4] }
    ],
    blended_risk_score: 0,
    customer_id: 105,
    rep_id: 201
  }
];

export const warehouses = [
  {
    id: 1,
    name: "East Coast Warehouse",
    location: "New York, NY",
    inventory: [
      { product_id: 1, quantity: 15 },
      { product_id: 3, quantity: 28 },
      { product_id: 5, quantity: 42 }
    ]
  },
  {
    id: 2,
    name: "West Coast Warehouse",
    location: "San Francisco, CA",
    inventory: [
      { product_id: 1, quantity: 8 },
      { product_id: 3, quantity: 15 },
      { product_id: 5, quantity: 23 }
    ]
  },
  {
    id: 3,
    name: "Central Distribution",
    location: "Chicago, IL",
    inventory: [
      { product_id: 1, quantity: 12 },
      { product_id: 3, quantity: 20 },
      { product_id: 5, quantity: 35 }
    ]
  }
];

export const upsells = [
  {
    id: 1,
    product_id: 2,
    name: "Cloud Backup Solution",
    base_product_id: 1,
    description: "Add cloud backup for your server rack",
    margin_delta: 320,
    price: 450
  },
  {
    id: 2,
    product_id: 4,
    name: "Security Monitoring",
    base_product_id: 3,
    description: "Add security monitoring to your network switch",
    margin_delta: 280,
    price: 1200
  },
  {
    id: 3,
    product_id: 6,
    name: "Support Plan Gold",
    base_product_id: 5,
    description: "Add premium support for workstations",
    margin_delta: 190,
    price: 950
  },
  {
    id: 4,
    product_id: 3,
    name: "Network Switch Pro",
    base_product_id: 1,
    description: "Add network switch for server connectivity",
    margin_delta: 420,
    price: 3200
  }
];

// Utility function to get upsells for a specific product
export const getUpsellsForProduct = (productId) => {
  return upsells.filter(upsell => upsell.base_product_id === productId);
};

// Utility function to get warehouse inventory for a product
export const getWarehouseInventory = (productId) => {
  const inventory = [];
  warehouses.forEach(warehouse => {
    const item = warehouse.inventory.find(inv => inv.product_id === productId);
    if (item) {
      inventory.push({
        warehouse_id: warehouse.id,
        warehouse_name: warehouse.name,
        quantity: item.quantity
      });
    }
  });
  return inventory;
};