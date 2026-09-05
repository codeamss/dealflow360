import { useState, useEffect } from "react";

export default function QuotationBuilder({ quotationId }) {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [products, setProducts] = useState([]);
  const [upsells, setUpsells] = useState([]);
  const [totalMargin, setTotalMargin] = useState(0);

  // Load products on mount
  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Error loading products:", err));
  }, []);

  // Calculate total margin whenever cart changes
  useEffect(() => {
    const margin = cart.reduce((sum, item) => {
      const productPrice = products.find(p => p.id === item.productId)?.price || 0;
      const cost = productPrice * 0.7; // Assuming 30% margin
      const revenue = productPrice * item.quantity * (1 - item.discount / 100);
      return sum + (revenue - cost * item.quantity);
    }, 0);
    setTotalMargin(margin);
  }, [cart, products]);

  // Load upsells for selected product
  useEffect(() => {
    if (selectedProduct) {
      fetch(`/api/products/${selectedProduct}/upsells`)
        .then(res => res.json())
        .then(data => setUpsells(data))
        .catch(err => console.error("Error loading upsells:", err));
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
      quantity: parseInt(quantity),
      discount: parseFloat(discount)
    };

    setCart([...cart, newItem]);
    setSelectedProduct("");
    setQuantity(1);
    setDiscount(0);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateDiscount = (itemId, newDiscount) => {
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, discount: parseFloat(newDiscount) } : item
    ));
  };

  const addUpsell = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: product.name,
      price: product.price,
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

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  return (
    <div className="quotation-builder">
      <div className="builder-main">
        <h2>Quotation Builder {quotationId ? `#${quotationId}` : ''}</h2>
        
        <div className="product-selector">
          <select 
            value={selectedProduct} 
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Select a product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} - ${product.price}
              </option>
            ))}
          </select>
          
          <input 
            type="number" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            placeholder="Quantity"
          />
          
          <input 
            type="number" 
            value={discount} 
            onChange={(e) => setDiscount(e.target.value)}
            min="0"
            max="100"
            step="0.5"
            placeholder="Discount %"
          />
          
          <button onClick={addToCart} className="btn-primary">
            Add to Cart
          </button>
        </div>

        <div className="cart-section">
          <h3>Cart ({cart.length} items)</h3>
          <div className="margin-indicator">
            <strong>Live Margin:</strong> ${totalMargin.toFixed(2)}
          </div>
          
          {cart.length === 0 ? (
            <p>Cart is empty. Add products to build your quotation.</p>
          ) : (
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <strong>{item.name}</strong>
                    <div>Quantity: {item.quantity}</div>
                    <div>Price: ${item.price}</div>
                    <div>
                      Discount: 
                      <input 
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateDiscount(item.id, e.target.value)}
                        min="0"
                        max="100"
                        step="0.5"
                        style={{ width: '60px', marginLeft: '5px' }}
                      />%
                    </div>
                    <div>Line Total: ${calculateLineTotal(item).toFixed(2)}</div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="btn-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <div className="cart-summary">
                <strong>Total: ${calculateTotal().toFixed(2)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="upsell-panel">
        <h3>Upsell Suggestions</h3>
        {selectedProduct ? (
          upsells.length > 0 ? (
            <div className="upsell-list">
              {upsells.map(upsell => (
                <div key={upsell.id} className="upsell-item">
                  <strong>{upsell.name}</strong>
                  <div>Price: ${upsell.price}</div>
                  <div>Margin Delta: ${upsell.margin_delta}</div>
                  <button 
                    onClick={() => addUpsell(upsell.id)}
                    className="btn-secondary"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No upsell suggestions available for this product.</p>
          )
        ) : (
          <p>Select a product to see upsell suggestions.</p>
        )}
      </div>

      <style jsx>{`
        .quotation-builder {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .product-selector {
          display: grid;
          grid-template-columns: 1fr 100px 100px auto;
          gap: 1rem;
          margin-bottom: 2rem;
          align-items: end;
        }
        
        .cart-section {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 1rem;
        }
        
        .margin-indicator {
          background: ${totalMargin >= 0 ? '#e8f5e9' : '#ffebee'};
          border: 1px solid ${totalMargin >= 0 ? '#c8e6c9' : '#ffcdd2'};
          padding: 0.5rem 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          color: ${totalMargin >= 0 ? '#2e7d32' : '#c62828'};
        }
        
        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }
        
        .cart-item:last-child {
          border-bottom: none;
        }
        
        .item-details {
          flex: 1;
        }
        
        .upsell-panel {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
          height: fit-content;
        }
        
        .upsell-item {
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
          margin-bottom: 1rem;
        }
        
        .upsell-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .btn-primary {
          background: #2c3e50;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-secondary {
          background: #3498db;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        
        .btn-danger {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        select, input[type="number"] {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}