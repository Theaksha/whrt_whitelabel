// customerManagement.js
(function () {
	// Customer search functionality – listens to input changes on the customer search field
	$('.customer-search-input').on('input', function () {
		let search_term = $(this).val();
		if (search_term.length > 1) {
			frappe.call({
				method: 'whrt_whitelabel.api.search_customers',
				args: { search_term },
				callback: function (response) {
					if (response.message) {
						let customers = response.message;
						if (!Array.isArray(customers)) {
							frappe.msgprint("Invalid response from the server. Please try again.");
							return;
						}
						let customer_dropdown = $('<div class="customer-dropdown"></div>').css({
							position: 'absolute',
							background: '#fff',
							border: '1px solid #ddd',
							width: '100%',
							'max-height': '200px',
							overflowY: 'auto',
							zIndex: '1000',
							'margin-top': '5px',
							'box-shadow': '0px 4px 10px rgba(0, 0, 0, 0.1)'
						});
						// Remove any previous dropdown
						$('.customer-dropdown').remove();
						customers.forEach(customer => {
							let customer_option = $(`
								<div class="customer-option" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #ddd;">
									${customer.customer_name} (${customer.mobile_no || 'No mobile number'})
								</div>
							`).on('click', function () {
								// Set the selected customer globally
								window.selectedCustomer = customer.name;
								$('.customer-search-input').val(customer.customer_name);
								customer_dropdown.remove();
							});
							customer_dropdown.append(customer_option);
						});
						$('.customer-search-bar').append(customer_dropdown);
					}
				},
				error: function (err) {
					frappe.msgprint("An error occurred while searching for customers. Please check your network connection.");
				}
			});
		} else {
			$('.customer-dropdown').remove();
		}
	});

	// "Add New Customer" functionality – uses a Frappe prompt to collect additional info
	$('.add-customer-btn').on('click', function () {
		let customer_name = $('.customer-search-input').val();
		if (!customer_name) {
			frappe.msgprint("Please enter a customer name.");
			return;
		}
		frappe.prompt([
			{
				fieldname: 'mobile_no',
				label: 'Mobile No',
				fieldtype: 'Data',
				reqd: 1,
				description: "Enter the customer's mobile number."
			}
		],
		function (values) {
			let mobile_no = values.mobile_no;
			frappe.call({
				method: 'whrt_whitelabel.api.set_customer_info',
				args: {
					doc: {
						doctype: 'Customer',
						customer_name: customer_name,
						mobile_no: mobile_no,
						customer_type: 'Individual',
						customer_group: 'Commercial',
						territory: 'All Territories'
					}
				},
				callback: function (response) {
					if (response.message) {
						frappe.msgprint("Customer added successfully!");
						// Set the new customer as the selected customer
						window.selectedCustomer = response.message.name;
						$('.customer-search-input').val(response.message.customer_name);
					} else {
						frappe.msgprint("Failed to add customer. Please try again.");
					}
				},
				error: function (err) {
					frappe.msgprint("An error occurred while adding the customer. Please check your network connection.");
				}
			});
		}, 'Add New Customer', 'Add');
	});
})();
