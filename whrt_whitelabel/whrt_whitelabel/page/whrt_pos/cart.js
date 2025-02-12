var Cart = (function() {
    var cart = [];
    var cart_section;
    var totalQuantity = 0;
    var formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    function init(page) {
        // Create the right-side cart section
        var right_section = $('<div class="right-section"></div>').appendTo(page.wrapper);
        right_section.css({
            'width': '230px',
            'margin-right': '10px',
            'background-color': '#f9f9f9',
            'height': 'calc(100vh - 50px)',
            'position': 'fixed',
            'top': '50px',
            'right': '0',
            'padding': '20px',
            'box-shadow': '2px 0px 5px rgba(0, 0, 0, 0.1)',
            'overflow-y': 'auto',
            'z-index': '1000'
        });

        // Build the cart section HTML
        cart_section = $(`
            <div class="cart-section" style="margin-top: 20px; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <h3 style="margin-bottom: 20px; font-size: 18px; font-weight: bold;">Item Cart</h3>
                <div class="cart-items" style="margin-bottom: 20px; max-height: 320px; overflow-y: auto;"></div>
                <hr>
                <div class="cart-summary" style="margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Total Quantity:</span>
                        <span class="cart-quantity">0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Net Total:</span>
                        <span>₹<span class="net-total">0.00</span></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>GST@18%:</span>
                        <span>₹<span class="gst">0.00</span></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 16px; font-weight: bold; color: #007bff;">
                        <span>Grand Total:</span>
                        <span>₹<span class="grand-total">0.00</span></span>
                    </div>
                </div>
                <button class="checkout-btn" style="margin-top: 20px; width: 100%; padding: 10px; background-color: #007bff; color: #fff; border: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Checkout</button>
                <button class="email-invoice-btn" style="margin-top: 10px; width: 100%; padding: 10px; background-color: #28a745; color: #fff; border: none; border-radius: 5px;">Email Invoice</button>
            </div>
        `);
        right_section.append(cart_section);

        // Try loading any saved cart data
        loadCartFromLocalStorage();
    }

    function addToCart(product) {
        // Check that a customer is selected (via CustomerManagement)
        if (!CustomerManagement.getSelectedCustomer()) {
            frappe.msgprint("Please select a customer before adding items to the cart.");
            return;
        }
        let existingItem = cart.find(item => item.name === product.name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            product.quantity = 1;
            cart.push(product);
        }
        updateCart();
    }

    function updateCart() {
        const cartItems = cart_section.find('.cart-items');
        cartItems.empty();
        totalQuantity = 0;
        let netTotal = 0;

        cart.forEach(item => {
            totalQuantity += item.quantity;
            netTotal += item.quantity * item.valuation_rate;
            const cartItem = createCartItem(item);
            cartItems.append(cartItem);
        });

        const gst = netTotal * 0.18;
        const grandTotal = netTotal + gst;

        cart_section.find('.cart-quantity').text(totalQuantity);
        cart_section.find('.net-total').text(netTotal.toFixed(2));
        cart_section.find('.gst').text(gst.toFixed(2));
        cart_section.find('.grand-total').text(grandTotal.toFixed(2));

        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function createCartItem(item) {
        const cartItem = $(`
            <div style="display: flex; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; margin-right: 10px; object-fit: cover; border-radius: 5px;">
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${item.name}</div>
                    <div style="font-size: 12px; color: #555;">
                        Quantity: 
                        <button class="decrease-quantity">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="increase-quantity">+</button>
                    </div>
                </div>
                <div style="font-weight: bold; color: #333;">₹${(item.quantity * item.valuation_rate).toFixed(2)}</div>
                <button class="remove-item" style="margin-left: 10px; color: red;">×</button>
            </div>
        `);

        // Increase quantity
        cartItem.find('.increase-quantity').on('click', function() {
            item.quantity += 1;
            updateCart();
        });
        // Decrease quantity
        cartItem.find('.decrease-quantity').on('click', function() {
            if (item.quantity > 1) {
                item.quantity -= 1;
                updateCart();
            }
        });
        // Remove the item
        cartItem.find('.remove-item').on('click', function() {
            cart = cart.filter(cartItem => cartItem.name !== item.name);
            updateCart();
        });

        return cartItem;
    }

    function loadCartFromLocalStorage() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            updateCart();
        }
    }

    function getCart() {
        return cart;
    }

    return {
        init: init,
        addToCart: addToCart,
        getCart: getCart,
        updateCart: updateCart
    };
})();
