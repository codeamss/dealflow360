import { useState, useEffect } from "react";
import { products, upsells } from "../mockData.js";

export default function QuotationBuilder() {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [availableUpsells, setAvailableUpsells] = useState([]);
  const [liveMargin, setLiveMargin] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // Calculate live margin whenever cart changes
  useEffect(() => {
    let margin = 0;
    let total = 0;
    
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const cost = product.price * 0.7; // Assuming 30% margin
        const revenue = product.price * item.quantity * (1 - item.discount / 100);
        margin += (revenue - cost * item.quantity);
        total += revenue;
      }
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
      setAvailableUpsells([]);
    }
  }, [selectedProduct]);

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
      quantity: parseInt(quantity) || 1,
      discount: parseFloat(discount) || 0
    };

    setCart([...cart, newItem]);
    setSelectedProduct("");
    setQuantity(1);
    setDiscount(0);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartItem = (itemId, field, value) => {
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, [field]: parseFloat(value) || 0 } : item
    ));
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
      discount: 5 // Default 5% discount for upsells
    };

    setCart([...cart, newItem]);
  };

  const calculateLineTotal = (item) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return 0;
    return product.price * item.quantity * (1 - item.discount / 100);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotation Builder</h1>
            <p className="text-gray-600">Create new quotes with real-time margin calculation</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className={`text-sm font-medium ${liveMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Live Margin: ${liveMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price} ({product.category})
                </option>
              ))}
            </select>
            
            <div className="relative">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Qty"
              />
            </div>
            
            <div className="relative">
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
                max="100"
                step="0.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Discount %"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={addToCart}
              disabled={!selectedProduct}
              className={`px-6 py-2 rounded-lg font-medium ${
                selectedProduct 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* Cart Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Cart ({cart.length} items)</h3>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-4 text-gray-500">Cart is empty. Add products to build your quotation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            ${calculateLineTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${item.price} × {item.quantity}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(item.id, 'quantity', e.target.value)}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateCartItem(item.id, 'discount', e.target.value)}
                              min="0"
                              max="100"
                              step="0.5"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <span className="text-gray-500">%</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Line Total</label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                            ${calculateLineTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-lg font-semibold text-gray-900">Order Summary</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="font-medium text-gray-600">Items</div>
                    <div className="text-xl font-bold text-gray-900">{cart.length}</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="font-medium text-gray-600">Margin</div>
                    <div className={`text-xl font-bold ${liveMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${liveMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <div className="font-medium text-gray-600">Margin %</div>
                    <div className={`text-xl font-bold ${liveMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalValue > 0 ? ((liveMargin / totalValue) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upsell Suggestions */}
      {availableUpsells.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Upsell Suggestions</h3>
          <p className="text-gray-600 mb-6">Increase your margin by adding these complementary products:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableUpsells.map(upsell => (
              <div key={upsell.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">{upsell.name}</div>
                    <div className="text-sm text-gray-600">{upsell.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${upsell.price}</div>
                    <div className="text-sm text-green-600 font-medium">
                      +${upsell.margin_delta} margin
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => addUpsell(upsell.product_id)}
                  className="w-full px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-medium"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Save as Draft
          </button>
          <button className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium">
            Calculate Risk Score
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Send to Customer
          </button>
        </div>
      </div>
    </div>
  );
}