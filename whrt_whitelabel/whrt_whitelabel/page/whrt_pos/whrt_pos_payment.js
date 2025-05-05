// whrt_pos_payment.js
import { setStorage, getStorage } from './whrt_pos_indexeddb.js';
import { updateCart, cart } from './whrt_pos_item_cart.js';
import { initializeOrderSummaryModal, showOrderSummary } from './whrt_pos_order_summary.js';
import { storeOfflineInvoice, offlineReduceStock } from './whrt_pos_data.js';

export function initializePaymentModal() {
  // Build the Payment Modal HTML inspired by ERPNext's structure
  const paymentModalHtml = `
    <div class="modal fade" id="paymentModal" tabindex="-1" role="dialog" aria-labelledby="paymentModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="paymentModalLabel">Payment</h5>
            <button type="button" class="close close-payment-modal-btn" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="row">
              <!-- Left side: Payment Methods -->
              <div class="col-md-6">
                <h4>Payment Method</h4>
                ${renderPaymentMethods()}
              </div>
              <!-- Right side: Payment Summary & Numpad -->
              <div class="col-md-6">
                <div class="payment-summary mb-3">
                  <div class="d-flex justify-content-between">
                    <span>Grand Total:</span>
                    <span class="grand-total-display">₹0.00</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Paid Amount:</span>
                    <span class="paid-amount-display">₹0.00</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>To Be Paid:</span>
                    <span class="to-be-paid-display">₹0.00</span>
                  </div>
                </div>
                <div class="numpad d-flex flex-wrap">
                  ${renderNumpadButtons()}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary process-payment-btn">Pay</button>
            <button type="button" class="btn btn-secondary close-payment-modal-btn" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  $('body').append(paymentModalHtml);
  
  // Set currentInput reference (default to Cash input)
  let currentInput = null;
  
  // Focus handlers for payment fields
  $('#paymentModal').find('.payment-method-input').on('focus', function () {
    currentInput = $(this);
  });
  
  // Input events recalc totals when manual input changes
  $('#paymentModal').find('.payment-method-input').on('input', function () {
    recalcPaymentTotals();
  });
  
  // Numpad events: when a numpad button is clicked update the current input
  $('#paymentModal').find('.numpad-btn').on('click', function () {
    const val = $(this).data('value');
    if (!currentInput || currentInput.length === 0) {
      // Default to cash if none focused
      currentInput = $('#paymentModal').find('.cash-amount');
    }
    if (val === 'C') {
      currentInput.val('');
    } else {
      currentInput.val(currentInput.val() + val);
    }
    recalcPaymentTotals();
  });
  
  // Process payment button click
  $('#paymentModal').find('.process-payment-btn').on('click', function () {
    processPayment();
  });
  
  // Close modal on close button click
  $('#paymentModal').find('.close-payment-modal-btn').on('click', function () {
    $('#paymentModal').modal('hide');
  });
}

function renderPaymentMethods() {
  // Return three fixed payment method inputs
  return `
    <div class="payment-method-row d-flex align-items-center mb-2">
      <label style="width: 120px;">Cash</label>
      <input type="number" class="form-control payment-method-input cash-amount" placeholder="0.00" />
    </div>
    <div class="payment-method-row d-flex align-items-center mb-2">
      <label style="width: 120px;">Credit Card</label>
      <input type="number" class="form-control payment-method-input credit-card-amount" placeholder="0.00" />
    </div>
    <div class="payment-method-row d-flex align-items-center mb-2">
      <label style="width: 120px;">Mobile Payment</label>
      <input type="number" class="form-control payment-method-input mobile-amount" placeholder="0.00" />
    </div>
  `;
}

function renderNumpadButtons() {
  // Create a simple numpad
  const buttons = [1,2,3,4,5,6,7,8,9,0,'.','C'];
  return buttons.map(btn => `<button class="btn btn-secondary numpad-btn m-1" data-value="${btn}">${btn}</button>`).join("");
}

function recalcPaymentTotals() {
  // Update totals in the payment modal dynamically
  const grandTotal = parseFloat($('.grand-total').text().replace("₹", "")) || 0;
  const cashAmt = parseFloat($('#paymentModal').find('.cash-amount').val()) || 0;
  const ccAmt = parseFloat($('#paymentModal').find('.credit-card-amount').val()) || 0;
  const mobileAmt = parseFloat($('#paymentModal').find('.mobile-amount').val()) || 0;
  const paidAmount = cashAmt + ccAmt + mobileAmt;
  const toBePaid = grandTotal - paidAmount;
  $('#paymentModal').find('.paid-amount-display').text("₹" + paidAmount.toFixed(2));
  $('#paymentModal').find('.to-be-paid-display').text("₹" + (toBePaid < 0 ? 0 : toBePaid).toFixed(2));
}

async function processPayment() {
  const grandTotal = parseFloat($('.grand-total').text().replace("₹", "")) || 0;
  const cashAmt = parseFloat($('#paymentModal').find('.cash-amount').val()) || 0;
  const ccAmt = parseFloat($('#paymentModal').find('.credit-card-amount').val()) || 0;
  const mobileAmt = parseFloat($('#paymentModal').find('.mobile-amount').val()) || 0;
  const totalPaid = cashAmt + ccAmt + mobileAmt;
  
  if (totalPaid < grandTotal) {
    frappe.msgprint("Paid amount is less than Grand Total!");
    return;
  }
  
  let paymentEntries = [];
  if (cashAmt > 0) paymentEntries.push({ mode_of_payment: "Cash", amount: cashAmt });
  if (ccAmt > 0) paymentEntries.push({ mode_of_payment: "Credit Card", amount: ccAmt });
  if (mobileAmt > 0) paymentEntries.push({ mode_of_payment: "Mobile Payment", amount: mobileAmt });
  
  let selected_company = await getStorage("selected_company");
  let selected_pos_profile = await getStorage("selected_pos_profile");
  if (!selected_company || !selected_pos_profile) {
    frappe.msgprint("Please select a Company and POS Profile before processing payment.");
    return;
  }
  
  let taxation = await getStorage("pos_profile_taxation") || "{}";
  let invoicePayload = {
    cart: JSON.stringify(cart),
    customer: window.selected_customer || "Walk-in Customer",
    pos_profile: selected_pos_profile,
    payments: JSON.stringify(paymentEntries),
    taxes_and_charges: taxation
  };
  
  // If offline, store invoice and reduce stock locally, then clear cart and update UI
  if (!navigator.onLine) {
    frappe.msgprint("No internet connection. Invoice stored offline and stock updated locally.");
    await storeOfflineInvoice(invoicePayload);
    await offlineReduceStock(cart);
     // Save a temporary invoice id for offline order summary (if needed)
    const offlineInvoiceId = "OFF-" + new Date().getTime();
    invoicePayload.temp_id = offlineInvoiceId;
    
    // Call showOrderSummary with offline data
    showOrderSummary(offlineInvoiceId, invoicePayload.customer, JSON.parse(invoicePayload.cart), grandTotal, paymentEntries);
    cart.length = 0;
    updateCart();
    $('#paymentModal').modal('hide');
    return;
  }
  
  // Online invoice creation and stock reduction
  frappe.call({
    method: 'whrt_whitelabel.api.create_invoice',
    args: invoicePayload,
    callback: function (invoice_response) {
      if (invoice_response.message && invoice_response.message.invoice_id) {
        const invoice_data = invoice_response.message;
        window.invoice_id = invoice_data.invoice_id;
        // Reduce stock for each invoiced item
        cart.forEach(function(item){
          if (item.name && item.quantity) {
            frappe.call({
              method: 'whrt_whitelabel.api.reduce_stock',
              args: { item_code: item.name, quantity: item.quantity },
              callback: function(res) {
                console.log("Reduced stock for", item.name);
              }
            });
          }
        });
        // Backup invoiced items for order summary before clearing
        let invoicedItems = JSON.parse(invoicePayload.cart);
        cart.length = 0;
        updateCart();
        frappe.msgprint("Invoice created successfully! Invoice ID: " + window.invoice_id);
        // Trigger payment completion to show Order Summary
        showOrderSummary(window.invoice_id, invoicePayload.customer, invoicedItems, grandTotal, paymentEntries);
      } else {
        frappe.msgprint("Invoice creation failed. Please check logs.");
      }
      $('#paymentModal').modal('hide');
    },
    error: async function (err) {
      frappe.msgprint("Server error. Attempting offline invoice storage.");
      await storeOfflineInvoice(invoicePayload);
      await offlineReduceStock(cart);
      cart.length = 0;
      updateCart();
      $('#paymentModal').modal('hide');
    }
  });
}

function onPaymentSuccess(invoiceId, customer, invoicedItems, totalAmount, payments) {
    console.log("Payment successful for Invoice:", invoiceId);
    window.invoice_id = invoiceId;
    window.selected_customer = customer;
    // Populate and show the Order Summary Modal using the imported function
    showOrderSummary(invoiceId, customer, invoicedItems, totalAmount, payments);
}

export { recalcPaymentTotals, processPayment };
export { onPaymentSuccess };
