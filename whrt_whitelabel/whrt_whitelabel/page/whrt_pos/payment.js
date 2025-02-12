var Payment = (function() {
    var invoice_id = null;
    var payment_modal;

    function init() {
        // Build the payment modal and append it to the body
        payment_modal = $(`
            <div class="payment-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2); z-index: 10000; width: 400px;">
                <h3 style="margin-bottom: 20px;">Payment</h3>
                <div style="margin-bottom: 20px;">
                    <label>Grand Total:</label>
                    <span class="grand-total-display" style="font-weight: bold; color: #007bff;">₹0.00</span>
                </div>
                <div class="split-payment-container">
                    <div class="split-payment-row" style="margin-bottom: 10px;">
                        <select class="payment-method" style="width: 40%; padding: 5px;">
                            <option value="Cash">Cash</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Online Payment">Online Payment</option>
                        </select>
                        <input type="number" class="split-amount" placeholder="Amount" style="width: 55%; padding: 5px;">
                    </div>
                </div>
                <button class="add-split-payment-btn" style="width: 100%; padding: 10px; margin-top: 10px; background-color: #28a745; color: #fff; border: none; border-radius: 5px;">Add Payment Method</button>
                <div class="numpad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px;">
                    <button class="numpad-btn">1</button>
                    <button class="numpad-btn">2</button>
                    <button class="numpad-btn">3</button>
                    <button class="numpad-btn">4</button>
                    <button class="numpad-btn">5</button>
                    <button class="numpad-btn">6</button>
                    <button class="numpad-btn">7</button>
                    <button class="numpad-btn">8</button>
                    <button class="numpad-btn">9</button>
                    <button class="numpad-btn">0</button>
                    <button class="numpad-btn">.</button>
                    <button class="numpad-btn">C</button>
                </div>
                <button class="process-payment-btn" style="width: 100%; padding: 10px; margin-top: 20px; background-color: #007bff; color: #fff; border: none; border-radius: 5px;">Process Payment</button>
                <button class="close-payment-modal-btn" style="width: 100%; padding: 10px; margin-top: 10px; background-color: #dc3545; color: #fff; border: none; border-radius: 5px;">Close</button>
            </div>
        `).appendTo('body');

        // When the checkout button is clicked (in the Cart module), create an invoice
        $('.checkout-btn').on('click', function() {
            var grandTotal = parseFloat($('.grand-total').text());
            if (grandTotal <= 0) {
                frappe.msgprint("Your cart is empty. Please add items to proceed.");
                return;
            }
            frappe.call({
                method: 'whrt_whitelabel.api.create_invoice',
                args: { 
                    cart: Cart.getCart(), 
                    customer: CustomerManagement.getSelectedCustomer() 
                },
                callback: function(response) {
                    if (response.message && response.message.invoice_id) {
                        invoice_id = response.message.invoice_id;
                        frappe.msgprint("Invoice Created: " + invoice_id);
                        updateGrandTotalInModal();
                        payment_modal.show();
                    } else {
                        frappe.msgprint("Invoice creation failed. Please try again.");
                    }
                },
                error: function(err) {
                    frappe.msgprint("An error occurred while creating the invoice. Please check your network connection.");
                }
            });
        });

        // Process payment button handler
        payment_modal.find('.process-payment-btn').on('click', function() {
            var grandTotal = parseFloat($('.grand-total').text());
            var totalPaid = 0;
            var paymentEntries = [];

            payment_modal.find('.split-payment-row').each(function() {
                var paymentMethod = $(this).find('.payment-method').val();
                var paymentAmount = parseFloat($(this).find('.split-amount').val());
                if (!isNaN(paymentAmount) && paymentAmount > 0) {
                    totalPaid += paymentAmount;
                    paymentEntries.push({
                        method: paymentMethod,
                        amount: paymentAmount
                    });
                }
            });

            if (totalPaid !== grandTotal) {
                frappe.msgprint(`Total paid amount (₹${totalPaid.toFixed(2)}) does not match the grand total (₹${grandTotal.toFixed(2)}).`);
                return;
            }

            frappe.call({
                method: 'whrt_whitelabel.api.create_payment_entry',
                args: {
                    invoice_id: invoice_id,
                    payment_entries: paymentEntries
                },
                callback: function(response) {
                    if (response.message) {
                        frappe.msgprint("Payment processed successfully!");
                        payment_modal.hide();
                        Cart.updateCart();
                        // Optionally update the invoice status to “Paid”
                        frappe.call({
                            method: 'whrt_whitelabel.api.update_invoice_status',
                            args: { invoice_id: invoice_id, status: 'Paid' },
                            callback: function(response) {
                                if (response.message) {
                                    frappe.msgprint("Invoice status updated to Paid.");
                                } else {
                                    frappe.msgprint("Failed to update invoice status. Please try again.");
                                }
                            },
                            error: function(err) {
                                frappe.msgprint("An error occurred while updating the invoice status.");
                            }
                        });
                    } else {
                        frappe.msgprint("Payment failed. Please try again.");
                    }
                },
                error: function(err) {
                    frappe.msgprint("An error occurred while processing the payment.");
                }
            });
        });

        // Close payment modal button
        payment_modal.find('.close-payment-modal-btn').on('click', function() {
            payment_modal.hide();
        });
    }

    function updateGrandTotalInModal() {
        var grandTotal = parseFloat($('.grand-total').text());
        payment_modal.find('.grand-total-display').text(`₹${grandTotal.toFixed(2)}`);
    }

    return {
        init: init
    };
})();
