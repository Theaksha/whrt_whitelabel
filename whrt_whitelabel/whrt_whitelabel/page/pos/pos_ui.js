export function getPOSLayout(posProfile, currency) {
    return `
    <div class="pos-container">
      <div class="pos-header-bar">
        <h2>Point of Sale <span class="profile">${posProfile}</span></h2>
        <div class="header-actions">
          <button class="logout-btn">
            <i class="fa fa-sign-out"></i> Logout
          </button>
          <button class="fullscreen-btn">
            <i class="fa fa-expand"></i> Full Screen
          </button>
        </div>
      </div>
      <div class="pos-main">
        <div class="pos-left">
          <div class="items-header">
            <div class="items-title">All Items</div>
            <div class="items-filters">
              <input type="text" class="item-search" placeholder="Search by code, serial…">
              <div class="group-dropdown">
                <input list="group-list" class="item-group-search" placeholder="Select group…">
                <datalist id="group-list"></datalist>
              </div>
            </div>
          </div>
          <div class="item-grid"></div>
          <div class="pagination-controls">
            <button class="page-prev"><i class="fa fa-chevron-left"></i> Previous</button>
            <span class="page-info">Showing 0-0 of 0</span>
            <button class="page-next">Next <i class="fa fa-chevron-right"></i></button>
          </div>
        </div>
        <div class="pos-right">
          <input type="text" class="customer-search" placeholder="Search customer…">
          <div class="cart-header">Item Cart</div>
          <div class="cart-body">No items in cart</div>
          <div class="discount-box">
            <input type="number" class="discount-input" placeholder="Add Discount">
          </div>
          <div class="cart-summary">
            <div>Total Quantity: <span class="total-qty">0</span></div>
            <div>Net Total: ${currency}<span class="net-total">0.00</span></div>
            <div><b>Grand Total: ${currency}<span class="grand-total">0.00</span></b></div>
          </div>
          <button class="checkout-btn">Checkout</button>
        </div>
        <div class="pos-payment" style="display:none; flex:1;">
          <div class="payment-header">Payment Method</div>
          <div class="payment-options">
            <div class="payment-option active" data-method="cash">Cash</div>
            <div class="payment-option" data-method="card">Card</div>
            <div class="payment-option" data-method="upi">UPI</div>
          </div>
          <div class="payment-display">
            <div class="payment-amount">${currency} 0.00</div>
          </div>
          <div class="numpad">
            <div class="numpad-row">
              <button class="numpad-btn">1</button>
              <button class="numpad-btn">2</button>
              <button class="numpad-btn">3</button>
            </div>
            <div class="numpad-row">
              <button class="numpad-btn">4</button>
              <button class="numpad-btn">5</button>
              <button class="numpad-btn">6</button>
            </div>
            <div class="numpad-row">
              <button class="numpad-btn">7</button>
              <button class="numpad-btn">8</button>
              <button class="numpad-btn">9</button>
            </div>
            <div class="numpad-row">
              <button class="numpad-btn">.</button>
              <button class="numpad-btn">0</button>
              <button class="numpad-btn delete-btn">Delete</button>
            </div>
          </div>
          <div class="payment-summary">
            <div class="summary-row">
              <span>Grand Total</span>
              <span class="grand-total">${currency} 0.00</span>
            </div>
            <div class="summary-row">
              <span>Paid Amount</span>
              <span class="paid-amount">${currency} 0.00</span>
            </div>
            <div class="summary-row">
              <span>Change Amount</span>
              <span class="change-amount">${currency} 0.00</span>
            </div>
          </div>
          <button class="complete-order-btn">Complete Order</button>
          <button class="cancel-payment-btn">Back to Cart</button>
        </div>
      </div>
    </div>`;
}

export function injectPOSStyles() {
    // Inject Animate.css if not already present
    if (!$("link[href*='animate.min.css']").length) {
        $("head").append(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">`);
    }

    if (!$('#pos-theme').length) {
        $('head').append(`<style id="pos-theme">${getCSS()}</style>`);
    }
}

function getCSS() {
    return `body {
            background: #d8f3dc;
            margin: 0;
            font-family: 'Open Sans', sans-serif;
        }
        .pos-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .pos-header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 24px;
            background: #d8f3dc;
            box-shadow: none;
        }

        
.header-actions {
  display: flex;
  gap: 10px;
}
        .pos-header-bar h2 {
            margin: 0;
            font-size: 22px;
            color: #333;
        }
        .pos-header-bar .profile {
            font-size: 14px;
            background: #fff;
            color: #333;
            padding: 2px 8px;
            border-radius: 12px;
            margin-left: 10px;
        }
        .pos-header-bar button {
            background: #e03636;
            border: none;
            padding: 6px 18px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
        }
        .logout-btn, .fullscreen-btn {
  background: #5e6c84;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}

.logout-btn:hover, .fullscreen-btn:hover {
  background: #6d7b95;
}

.logout-btn i, .fullscreen-btn i {
  font-size: 14px;
}
        .pos-main {
            display: flex;
            flex: 1;
            overflow: hidden;
            padding: 16px;
            gap: 16px;
        }

        /* LEFT PANEL */
        .pos-left {
            flex: 2;
            background: #fff;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .items-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #e0e0e0;
        }
        .items-title {
            font-size: 18px;
            font-weight: 600;
        }
        .items-filters {
            display: flex;
            gap: 12px;
        }
        .items-filters input,
        .items-filters select {
            padding: 8px 12px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            outline: none;
        }
        .item-grid {
            padding: 12px;
            flex: 1;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 150px));
            gap: 5px;
            overflow-y: auto;
        }

        .item-card {
            display: flex;
            flex-direction: column;
            width: 150px;
            height: 220px;
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #fff;
            position: relative;
            cursor: pointer;
            transition: transform .2s, box-shadow .2s;
        }
 .pagination-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-top: 1px solid #e0e0e0;
      background: #f5f5f5;
    }
    
    .pagination-controls button {
      padding: 6px 12px;
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .pagination-controls button:hover:not(.disabled) {
      background: #f0f0f0;
    }
    
    .pagination-controls button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .page-info {
      font-size: 14px;
      color: #666;
    }
        .item-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .item-card img {
            width: 100%;
            height: 100px;
            object-fit: contain;
            display: block;
            margin: 0 auto 8px;
            border-radius: 4px;
        }

        .item-initials {
            width: 100%;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            color: #333;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 8px;
            border-radius: 4px;
        }

        .item-name {
            flex: 1 1 auto;
            font-size: 14px;
            text-align: center;
            margin: 4px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .item-price {
            flex: 0 0 auto;
            font-size: 13px;
            color: #2e7d32;
            font-weight: 600;
            text-align: center;
            margin-top: 4px;
        }

        .stock-info {
            position: absolute;
            bottom: 5px;
            left: 5px;
            right: 5px;
            background: rgba(0, 100, 0, 0.8);
            color: white;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 11px;
            text-align: center;
        }
        
        .stock-info.out-of-stock {
            background: rgba(200, 0, 0, 0.8);
        }
        
        .stock-info.non-stock {
            background: rgba(100, 100, 100, 0.8);
        }
        
        .item-card.out-of-stock {
            opacity: 0.7;
            position: relative;
        }
        
        .item-card.out-of-stock::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
                45deg,
                rgba(255, 0, 0, 0.1),
                rgba(255, 0, 0, 0.1) 10px,
                rgba(255, 255, 255, 0.1) 10px,
                rgba(255, 255, 255, 0.1) 20px
            );
            pointer-events: none;
        }
        
        .item-badge {
            position: absolute;
            top: 5px;
            right: 5px;
            background-color: #007bff;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 1;
        }
        .pos-right {
            flex: 1;
            background: #fff;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            padding: 16px;
            min-width: 320px;
        }
        .customer-search {
            padding: 8px 12px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            outline: none;
            margin-bottom: 16px;
        }

        .image-wrapper {
            width: 100%;
            height: 160px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin-bottom: 8px;
            border-radius: 4px;
            position: relative;
        }

        .image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        }
        .image-wrapper.placeholder {
            color: #444;
            font-size: 48px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .cart-header {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 8px;
        }
        .cart-body {
            flex: 1;
            overflow-y: auto;
            color: #777;
        }

        .cart-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            gap: 10px;
            padding: 8px;
            border-radius: 4px;
        }

        .cart-item:hover {
            background: #f5f5f5;
        }

        .cart-item img {
            width: 50px;
            height: 50px;
            object-fit: contain;
            border-radius: 4px;
            flex-shrink: 0;
        }

        .cart-item-initials {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            color: #333;
            font-size: 24px;
            font-weight: bold;
            border-radius: 4px;
            flex-shrink: 0;
        }

        .cart-item-name {
            flex: 1;
            font-size: 14px;
        }

        .cart-item-qty {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .cart-item-qty button {
            padding: 2px 8px;
            border: 1px solid #e0e0e0;
            background: #f5f5f5;
            border-radius: 4px;
            cursor: pointer;
        }

        .cart-item-amount {
            width: 80px;
            text-align: right;
            font-weight: 500;
        }

        .discount-box {
            margin: 15px 0;
        }

        .discount-input {
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            width: 100%;
            outline: none;
        }

        .cart-summary {
            padding: 15px 0;
            border-top: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            margin: 15px 0;
        }

        .cart-summary div {
            margin-bottom: 8px;
        }

        .checkout-btn {
            background: #2e7d32;
            color: #fff;
            padding: 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            font-weight: 600;
            font-size: 15px;
        }

       /* Payment Panel Styles */
.pos-payment {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.payment-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
}

.payment-options {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.payment-option {
  flex: 1;
  text-align: center;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.payment-option.active {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #1976d2;
}

.payment-display {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: right;
  font-size: 24px;
  font-weight: 600;
}

.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.numpad-btn {
  padding: 15px;
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 4px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s;
}

.numpad-btn:hover {
  background: #f5f5f5;
}

.delete-btn {
  background: #ffebee;
  color: #f44336;
}

.payment-summary {
  border-top: 1px solid #e0e0e0;
  padding-top: 15px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 16px;
}

.summary-row span:last-child {
  font-weight: 600;
}

.complete-order-btn {
  background: #4caf50;
  color: #fff;
  padding: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 10px;
}

.cancel-payment-btn {
  background: #f5f5f5;
  color: #333;
  padding: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 16px;
}

.order-success {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    text-align: center;
    z-index: 1000;
}

.order-success h3 {
    margin-top: 0;
    color: #2e7d32;
}

.order-success .btn {
    margin: 10px 5px;
    padding: 8px 16px;
}`;
}
