// paymentProcessing.js
(function () {
	let invoice_id = null;

	// Build the payment modal HTML and append to the document body
	const paymentModal = $(`
		<div class="payment-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0,0,0,0.2); z-index: 10000; width: 400px;">
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

	// Update the modal display of the grand total
	function updateGrandTotalInModal() {
		const grandTotal = parseFloat($('.cart-section').find('.grand-total').text());
		paymentModal.find('.grand-total-display').text(`₹${grandTotal.toFixed(2)}`);
	}

	// When the checkout button is clicked (assumes the checkout button exists inside .cart-section)
	$('.cart-section').find('.checkout-btn').on('click', function () {
		let grandTotal = parseFloat($('.cart-section').find('.grand-total').text());
		if (grandTotal <= 0) {
			frappe.msgprint("Your cart is empty. Please add items to proceed.");
			return;
		}
		// Create the invoice before proceeding to payment
		frappe.call({
			method: 'whrt_whitelabel.api.create_invoice',
			args: { cart: window.cartManager.getCart(), customer: window.selectedCustomer },
			callback: function (response) {
				if (response.message && response.message.invoice_id) {
					invoice_id = response.message.invoice_id;
					frappe.msgprint("Invoice Created: " + invoice_id);
					updateGrandTotalInModal();
					paymentModal.show();
				} else {
					frappe.msgprint("Invoice creation failed. Please try again.");
				}
			},
			error: function (err) {
				frappe.msgprint("An error occurred while creating the invoice. Please check your network connection.");
			}
		});
	});

	// Process the payment when the Process Payment button is clicked
	paymentModal.find('.process-payment-btn').on('click', function () {
		let grandTotal = parseFloat($('.cart-section').find('.grand-total').text());
		let totalPaid = 0;
		let paymentEntries = [];
		paymentModal.find('.split-payment-row').each(function () {
			let paymentMethod = $(this).find('.payment-method').val();
			let paymentAmount = parseFloat($(this).find('.split-amount').val());
			if (!isNaN(paymentAmount) && paymentAmount > 0) {
				totalPaid += paymentAmount;
				paymentEntries.push({ method: paymentMethod, amount: paymentAmount });
			}
		});
		if (totalPaid !== grandTotal) {
			frappe.msgprint(`Total paid amount (₹${totalPaid.toFixed(2)}) does not match the grand total (₹${grandTotal.toFixed(2)}).`);
			return;
		}
		frappe.call({
			method: 'whrt_whitelabel.api.create_payment_entry',
			args: { invoice_id, payment_entries: paymentEntries },
			callback: function (response) {
				if (response.message) {
					frappe.msgprint("Payment processed successfully!");
					paymentModal.hide();
					// Clear the cart after payment
					window.cartManager.getCart().length = 0;
					window.cartManager.updateCart();
					// Update invoice status to "Paid"
					frappe.call({
						method: 'whrt_whitelabel.api.update_invoice_status',
						args: { invoice_id, status: 'Paid' },
						callback: function (response) {
							if (response.message) {
								frappe.msgprint("Invoice status updated to Paid.");
							} else {
								frappe.msgprint("Failed to update invoice status. Please try again.");
							}
						},
						error: function (err) {
							frappe.msgprint("An error occurred while updating the invoice status. Please check your network connection.");
						}
					});
				} else {
					frappe.msgprint("Payment failed. Please try again.");
				}
			},
			error: function (err) {
				frappe.msgprint("An error occurred while processing the payment. Please check your network connection.");
			}
		});
	});

	// Close the payment modal when the Close button is clicked
	paymentModal.find('.close-payment-modal-btn').on('click', function () {
		paymentModal.hide();
	});

	// Expose the payment processor functions (if needed)
	window.paymentProcessor = {
		updateGrandTotal: updateGrandTotalInModal
	};
})();
