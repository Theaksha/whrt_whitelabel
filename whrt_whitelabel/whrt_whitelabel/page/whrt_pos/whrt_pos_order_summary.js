// whrt_pos_order_summary.js

// Global variables to be updated with the current order details.
let invoice_id;
let selected_customer;

export function showOrderSummary(invoiceId, customer, cartItems, totalAmount, payments) {
  // Update global invoice_id for print/email actions
  invoice_id = invoiceId;
  selected_customer = customer || "Walk-in Customer";

  // Save order summary in localStorage for offline access
  const orderSummary = {
    invoiceId,
    customer: selected_customer,
    cartItems,
    totalAmount,
    payments
  };
  localStorage.setItem('last_order_summary', JSON.stringify(orderSummary));

  // Populate modal with order summary details
  $('#orderCompletionModal .customer-name').text(selected_customer);
  $('#orderCompletionModal .invoice-id').html(`<strong>Invoice ID:</strong> ${invoiceId}`);

  let itemsHtml = `<table class="table table-striped">
    <thead>
      <tr>
        <th>Item</th>
        <th>Image</th>
        <th>Qty</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>`;
  cartItems.forEach(item => {
    itemsHtml += `<tr>
      <td>${item.item_name}</td>
      <td><img src="${item.image}" alt="Item Image" width="50" height="50"></td>
      <td>${item.quantity}</td>
      <td>₹${item.valuation_rate}</td>
    </tr>`;
  });
  itemsHtml += `</tbody></table>`;
  $('#orderCompletionModal .items-section').html(itemsHtml);

  // Totals Section
  $('#orderCompletionModal .totals-section').html(`<h4>Total: ₹${parseFloat(totalAmount).toFixed(2)}</h4>`);

  // Payments Section
  let paymentsHtml = `<ul class="list-group">`;
  payments.forEach(payment => {
    paymentsHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">
      ${payment.mode_of_payment}
      <span>₹${parseFloat(payment.amount).toFixed(2)}</span>
    </li>`;
  });
  paymentsHtml += `</ul>`;
  $('#orderCompletionModal .payments-section').html(paymentsHtml);

  // Show the modal
  $('#orderCompletionModal').modal('show');
}

export function initializeOrderSummaryModal() {
  const orderCompletionModalHtml = `
    <div class="modal fade" tabindex="-1" role="dialog" id="orderCompletionModal">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Order Summary</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <h3 class="customer-name"></h3>
            <div class="invoice-id"></div>
            <hr>
            <div class="items-section"></div>
            <hr>
            <div class="totals-section"></div>
            <hr>
            <div class="payments-section"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary print-receipt-btn">Print Receipt</button>
            <button class="btn btn-info email-receipt-btn">Email Receipt</button>
            <button class="btn btn-secondary new-order-btn" data-dismiss="modal">New Order</button>
            <button class="btn btn-warning view-last-order-btn">View Last Order</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  $('body').append(orderCompletionModalHtml);

  // Print Receipt button click handler
  $('#orderCompletionModal').find('.print-receipt-btn').on('click', function () {
    if (!window.invoice_id) { 
      frappe.msgprint("No invoice found."); 
      return; 
    }
    printReceipt();
  });

  // Email Receipt button click handler
  $('#orderCompletionModal').find('.email-receipt-btn').on('click', function () {
    if (!window.invoice_id) { 
      frappe.msgprint("No invoice found."); 
      return; 
    }
    frappe.call({
      method: 'whrt_whitelabel.api.email_invoice',
      args: { invoice_id: invoice_id },
      callback: function (response) {
        if (response.message) { 
          frappe.msgprint("Invoice emailed successfully!"); 
        } else { 
          frappe.msgprint("Failed to email invoice. Please try again."); 
        }
      },
      error: function (err) { 
        frappe.msgprint("An error occurred while emailing the invoice."); 
      }
    });
  });

  // New Order button click handler
  $('#orderCompletionModal').find('.new-order-btn').on('click', function () {
    $('#orderCompletionModal').modal('hide');
    selected_customer = null;
    // Optionally, clear the cart and reset UI here.
  });

  // View Last Order button click handler (for offline viewing)
  $('#orderCompletionModal').find('.view-last-order-btn').on('click', function () {
    viewLastOrderSummary();
  });
}

function viewLastOrderSummary() {
  const lastOrderSummary = localStorage.getItem('last_order_summary');
  
  if (!lastOrderSummary) {
    frappe.msgprint("No previous order summary found.");
    return;
  }

  const { invoiceId, customer, cartItems, totalAmount, payments } = JSON.parse(lastOrderSummary);

  // Populate modal with order summary details
  $('#orderCompletionModal .customer-name').text(customer);
  $('#orderCompletionModal .invoice-id').html(`<strong>Invoice ID:</strong> ${invoiceId}`);

  let itemsHtml = `<table class="table table-striped">
    <thead>
      <tr>
        <th>Item</th>
        <th>Image</th>
        <th>Qty</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>`;
  
  cartItems.forEach(item => {
    itemsHtml += `<tr>
      <td>${item.item_name}</td>
      <td><img src="${item.image}" alt="Item Image" width="50" height="50"></td>
      <td>${item.quantity}</td>
      <td>₹${item.valuation_rate}</td>
    </tr>`;
  });
  itemsHtml += `</tbody></table>`;
  $('#orderCompletionModal .items-section').html(itemsHtml);

  // Totals Section
  $('#orderCompletionModal .totals-section').html(`<h4>Total: ₹${parseFloat(totalAmount).toFixed(2)}</h4>`);

  // Payments Section
  let paymentsHtml = `<ul class="list-group">`;
  payments.forEach(payment => {
    paymentsHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">
      ${payment.mode_of_payment}
      <span>₹${parseFloat(payment.amount).toFixed(2)}</span>
    </li>`;
  });
  paymentsHtml += `</ul>`;
  $('#orderCompletionModal .payments-section').html(paymentsHtml);

  // Show the modal
  $('#orderCompletionModal').modal('show');
}

function printReceipt() {
  // For online printing using frappe.utils.print
  const doctype = "POS Invoice";
  const print_format = "POS Invoice";
  const letter_head = "null";
  const language = frappe.boot.lang || "en";
  frappe.utils.print(doctype, window.invoice_id, print_format, letter_head, language);
  console.debug("Print function called for invoice:", window.invoice_id);
}

export { printReceipt };
