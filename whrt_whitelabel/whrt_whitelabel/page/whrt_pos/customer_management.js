var CustomerManagement = (function() {
    var selected_customer = null;
    var customer_search_bar;

    function init() {
        // Add customer search bar at the top of the right section (cart area)
        var right_section = $('.right-section');
        customer_search_bar = $(`
            <div class="customer-search-bar" style="margin-bottom: 20px;">
                <input type="text" class="customer-search-input" placeholder="Search or add customer" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                <button class="add-customer-btn" style="width: 100%; padding: 10px; margin-top: 10px; background-color: #28a745; color: #fff; border: none; border-radius: 5px;">Add New Customer</button>
            </div>
        `);
        right_section.prepend(customer_search_bar);

        // Search for customers when text is entered
        customer_search_bar.find('.customer-search-input').on('input', function() {
            var search_term = $(this).val();
            if (search_term.length > 1) {
                frappe.call({
                    method: 'whrt_whitelabel.api.search_customers',
                    args: { search_term: search_term },
                    callback: function(response) {
                        if (response.message) {
                            var customers = response.message;
                            var customer_dropdown = $('<div class="customer-dropdown"></div>').css({
                                'position': 'absolute',
                                'background': '#fff',
                                'border': '1px solid #ddd',
                                'width': '100%',
                                'max-height': '200px',
                                'overflow-y': 'auto',
                                'z-index': '1000',
                                'margin-top': '5px',
                                'box-shadow': '0px 4px 10px rgba(0, 0, 0, 0.1)'
                            });
                            $('.customer-dropdown').remove();
                            customers.forEach(function(customer) {
                                var customer_option = $(`
                                    <div class="customer-option" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #ddd;">
                                        ${customer.customer_name} (${customer.mobile_no || 'No mobile number'})
                                    </div>
                                `).on('click', function() {
                                    selected_customer = customer.name;
                                    customer_search_bar.find('.customer-search-input').val(customer.customer_name);
                                    customer_dropdown.remove();
                                });
                                customer_dropdown.append(customer_option);
                            });
                            customer_search_bar.append(customer_dropdown);
                        }
                    },
                    error: function(err) {
                        frappe.msgprint("An error occurred while searching for customers.");
                    }
                });
            } else {
                $('.customer-dropdown').remove();
            }
        });

        // “Add New Customer” button functionality
        customer_search_bar.find('.add-customer-btn').on('click', function() {
            var customer_name = customer_search_bar.find('.customer-search-input').val();
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
            ], function(values) {
                frappe.call({
                    method: 'whrt_whitelabel.api.set_customer_info',
                    args: {
                        doc: {
                            doctype: 'Customer',
                            customer_name: customer_name,
                            mobile_no: values.mobile_no,
                            customer_type: 'Individual',
                            customer_group: 'Commercial',
                            territory: 'All Territories'
                        }
                    },
                    callback: function(response) {
                        if (response.message) {
                            frappe.msgprint("Customer added successfully!");
                            selected_customer = response.message.name;
                            customer_search_bar.find('.customer-search-input').val(response.message.customer_name);
                        } else {
                            frappe.msgprint("Failed to add customer. Please try again.");
                        }
                    },
                    error: function(err) {
                        frappe.msgprint("An error occurred while adding the customer.");
                    }
                });
            }, 'Add New Customer', 'Add');
        });
    }

    function getSelectedCustomer() {
        return selected_customer;
    }

    return {
        init: init,
        getSelectedCustomer: getSelectedCustomer
    };
})();
