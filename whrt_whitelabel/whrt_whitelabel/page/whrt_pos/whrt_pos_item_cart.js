import { getStorage, setStorage } from './whrt_pos_indexeddb.js';

export let cart = [];
export let totalQuantity = 0;

// ----------------------------
// Client-Side Tax Calculation
// ----------------------------
function calculateClientSideTaxes(cart, tax_rules) {
    let net_total = 0;
    cart.forEach(item => {
      net_total += item.quantity * item.valuation_rate;
    });
    let taxes = [];
    let total_taxes_and_charges = 0;
    tax_rules.forEach(rule => {
      let rate = rule.tax_rate || rule.rate || 0;
      let tax_amount = net_total * (rate / 100);
      taxes.push({
        description: rule.description || rule.account_head || "Tax",
        account_head: rule.account_head,
        type: rule.type,
        tax_amount: tax_amount
      });
      total_taxes_and_charges += tax_amount;
    });
    let grand_total = net_total + total_taxes_and_charges;
    return { net_total, total_taxes_and_charges, grand_total, taxes };
}
  
// ----------------------------
// Load Cart from Storage
// ----------------------------
export async function loadCartFromStorage() {
  const savedCart = await getStorage('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    await updateCart();
  }
}
  
// ----------------------------
// Add to Cart Functionality
// ----------------------------
export async function addToCart(product, selected_customer) {
  if (!selected_customer) {
    frappe.msgprint("Please select a customer before adding items to the cart.");
    return;
  }
  const existingItem = cart.find(item => item.name === product.name);
  if (existingItem) { 
    existingItem.quantity += 1; 
  } else { 
    product.quantity = 1; 
    cart.push(product); 
  }
  await updateCart();
}
  
// ----------------------------
// Update Cart Functionality
// ----------------------------
export async function updateCart() {
    const cartItems = $('.cart-items');
    cartItems.empty();
    totalQuantity = 0;
    let netTotal = 0;
    cart.forEach(item => {
      totalQuantity += item.quantity;
      netTotal += item.quantity * item.valuation_rate;
      const cartItem = createCartItem(item);
      cartItems.append(cartItem);
    });
    $('.cart-quantity').text(totalQuantity);
    $('.net-total').text(netTotal.toFixed(2));
    $('.tax-lines').empty();
    // Set a default numeric value for grand total so the payment modal can parse it.
    $('.grand-total').text(netTotal.toFixed(2));
    await setStorage('cart', JSON.stringify(cart));
  
    let company = await getStorage("selected_company");
    let pos_profile_taxation = await getStorage("pos_profile_taxation");
    let customer_for_taxes = window.selected_customer || "Walk-in Customer";
  
    if (navigator.onLine && company && pos_profile_taxation && cart.length > 0) {
      frappe.call({
        method: 'whrt_whitelabel.api.calculate_taxes_for_pos_invoice',
        args: {
          cart: JSON.stringify(cart),
          company: company,
          customer: customer_for_taxes,
          taxes_and_charges: pos_profile_taxation
        },
        callback: function(r) {
          if (r && r.message) {
            $('.net-total').text(r.message.net_total.toFixed(2));
            r.message.taxes.forEach(tax_line => {
              $('.tax-lines').append(`<div class="tax-line"><span>${tax_line.description}</span><span>₹${(tax_line.tax_amount || 0).toFixed(2)}</span></div>`);
            });
            $('.grand-total').text(r.message.grand_total.toFixed(2));
          }
        }
      });
    } else if (!navigator.onLine && pos_profile_taxation && cart.length > 0) {
      let taxData = {};
      try {
        taxData = JSON.parse(pos_profile_taxation);
      } catch (e) {
        taxData = { rules: [] };
      }
      let tax_rules = taxData.rules || [];
      let taxResult = calculateClientSideTaxes(cart, tax_rules);
      $('.net-total').text(taxResult.net_total.toFixed(2));
      taxResult.taxes.forEach(tax_line => {
        $('.tax-lines').append(`<div class="tax-line"><span>${tax_line.description}</span><span>₹${(tax_line.tax_amount || 0).toFixed(2)}</span></div>`);
      });
      $('.grand-total').text(taxResult.grand_total.toFixed(2));
    }
}
  
// ----------------------------
// Helper to Create a Cart Item Element
// ----------------------------
function createCartItem(item) {
  const cartItem = $(`
    <div class="cart-item d-flex align-items-center mb-2">
      <img src="${item.image}" alt="${item.name}" class="img-thumbnail mr-2" style="width:50px;">
      <div class="flex-grow-1">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-qty">
          <button class="btn btn-sm btn-outline-secondary decrease-quantity">–</button>
          <span>${item.quantity}</span>
          <button class="btn btn-sm btn-outline-secondary increase-quantity">+</button>
        </div>
      </div>
      <div class="cart-item-total ml-2">₹${(item.quantity * item.valuation_rate).toFixed(2)}</div>
      <button class="btn btn-sm btn-danger remove-item ml-2">×</button>
    </div>
  `);
  cartItem.find('.increase-quantity').on('click', async function () {
    item.quantity += 1;
    await updateCart();
  });
  cartItem.find('.decrease-quantity').on('click', async function () {
    if (item.quantity > 1) { 
      item.quantity -= 1; 
      await updateCart(); 
    }
  });
  cartItem.find('.remove-item').on('click', async function () {
    cart = cart.filter(cartItem => cartItem.name !== item.name);
    await updateCart();
  });
  return cartItem;
}
