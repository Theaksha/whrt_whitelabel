frappe.pages['whrt-pos'].on_page_load = function (wrapper) {
    $('.body-sidebar-container').hide();

    if (!frappe.session.user || frappe.session.user === 'Guest') {
        window.location.href = '/login?redirect-to=whrt-pos';
        return;
    }
	
    function show_pos_selection_dialog() {
    // Check if session settings are already saved in localStorage.
    let saved_company = localStorage.getItem("selected_company");
    let saved_pos_profile = localStorage.getItem("selected_pos_profile");
    let saved_opening_balance = localStorage.getItem("opening_balance");

    if (saved_company && saved_pos_profile) {
        frappe.msgprint(`Loaded saved session: ${saved_company} - ${saved_pos_profile}`);
        // You can set these globally or use them as needed:
        company_selected = saved_company;
        pos_profile_selected = saved_pos_profile;
        // If you need the opening balance details:
        if (saved_opening_balance) {
            opening_balance_details = JSON.parse(saved_opening_balance);
        }
        return; // Session loaded; no need to show the dialog.
    }

    // Create the dialog pop-up.
    let dialog = new frappe.ui.Dialog({
        title: "Select POS Session Details",
        fields: [
            {
                label: "Company",
                fieldname: "company",
                fieldtype: "Select",
                options: "",  // will be filled dynamically
                reqd: 1
            },
            {
                label: "POS Profile",
                fieldname: "pos_profile",
                fieldtype: "Link",
                options: "POS Profile",
                reqd: 1
            },
            {
                label: "Opening Balance Details",
                fieldname: "opening_balance",
                fieldtype: "Table",
                fields: [
                    {
                        label: "Mode of Payment",
                        fieldname: "mode_of_payment",
                        fieldtype: "Link",
                        options: "Mode of Payment",
                        in_list_view: 1,
                        reqd: 1
                    },
                    {
                        label: "Opening Amount",
                        fieldname: "opening_amount",
                        fieldtype: "Currency",
                        in_list_view: 1
                    }
                ],
                reqd: 1
            }
        ],
        primary_action_label: "Submit",
        primary_action(values) {
            if (!values.company || !values.pos_profile) {
                frappe.msgprint("Please select both Company and POS Profile.");
                return;
            }
            // Save the selections in localStorage so the settings persist during the session.
            localStorage.setItem("selected_company", values.company);
            localStorage.setItem("selected_pos_profile", values.pos_profile);
            localStorage.setItem("opening_balance", JSON.stringify(values.opening_balance));
            company_selected = values.company;
            pos_profile_selected = values.pos_profile;
            frappe.msgprint(`Selected: ${values.company} - ${values.pos_profile}`);
            dialog.hide();
        }
    });

    // Populate the Company field options.
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Company",
            fields: ["name"]
        },
        callback: function(response) {
            let companies = response.message;
            if (companies && companies.length) {
                let company_options = companies.map(company => company.name).join("\n");
                dialog.set_df_property("company", "options", company_options);
            } else {
                frappe.msgprint("No companies found!");
            }
        }
    });

    // When the Company field is changed, fetch POS Profiles for that company.
    dialog.fields_dict.company.df.onchange = function() {
        let selected_company = dialog.get_value("company");
        if (selected_company) {
            frappe.call({
                method: "whrt_whitelabel.api.get_pos_profiles",
                args: { company: selected_company },
                callback: function(response) {
                    let profiles = response.message;
                    // Ensure profiles is an array
                    if (profiles && !Array.isArray(profiles)) {
                        profiles = [profiles];
                    }
                    let options = "";
                    if (profiles && profiles.length) {
                        profiles.forEach(function(profile) {
                            options += profile.name + "\n";
                        });
                    } else {
                        // Fallback value to ensure the link field has valid options.
                        options = "POS Profile";
                    }
                    dialog.set_df_property("pos_profile", "options", options);
                }
            });
        }
    };

    // When the POS Profile field is changed, fetch its default payment modes
    // and populate the opening_balance table.
    dialog.fields_dict.pos_profile.df.onchange = function() {
        let selected_profile = dialog.get_value("pos_profile");
        console.log("Selected profile:", selected_profile);
        // Check if the selected profile is valid (not empty or the literal "undefined")
        if (!selected_profile || selected_profile === "undefined") {
            return;
        }
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "POS Profile",
                name: selected_profile
            },
            callback: function(r) {
                if (r.message) {
                    let payments = r.message.payments;
                    // Ensure payments is an array
                    if (!Array.isArray(payments)) {
                        payments = [];
                    }
                    let rows = [];
                    payments.forEach(function(payment) {
                        rows.push({
                            mode_of_payment: payment.mode_of_payment,
                            opening_amount: 0
                        });
                    });
                    dialog.set_value("opening_balance", rows);
                    dialog.refresh();
                }
            }
        });
    };

    dialog.show();
}


        
   

    show_pos_selection_dialog();



    // Create the page layout
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        single_column: true // Allows content to be displayed without the default sidebar
    });
	
    // Create Sidebar container for categories (on the left side)
    var category_sidebar = $('<div class="category-sidebar"></div>').appendTo(page.wrapper);
    category_sidebar.css({
        'width': '178px',
        'background-color': '#f4f4f4',
        'height': 'calc(100vh - 50px)',
        'position': 'fixed',
        'top': '50px',
        'left': '0',
        'padding': '10px 15px',
        'border-radius': '5px',
        'box-shadow': '2px 0px 5px rgba(0,0,0,0.1)',
        'overflow-y': 'auto',
        'z-index': '1000'
    });
	
	

    // Add sidebar header for categories
    category_sidebar.append('<h3 class="sidebar-header">Categories</h3>');
    category_sidebar.find('.sidebar-header').css({
        'font-size': '18px',
        'font-weight': 'bold',
        'color': '#ff6347',
        'margin-bottom': '15px',
        'cursor': 'pointer'
    });

    // Create content area (main page area) for displaying products
    var content_area = $('<div class="content-area"></div>').appendTo(page.wrapper);
    content_area.css({
        'padding': '20px',
        'display': 'flex',
        'flex-direction': 'column',
        'background-color': 'black',
        'align-items': 'center',
        'margin-left': '200px',
        'margin-right': '240px',
        'overflow-x': 'hidden'
    });

    // Title for the content area
    content_area.append('<h2>Whrt POS</h2>');
    content_area.append('<p>Select a category to view products</p>');

    // Search Bar
const search_bar = $('<input type="text" placeholder="Search products..." class="search-bar">').css({
    'width': '100%',
    'padding': '10px',
    'margin-bottom': '20px',
    'border': '1px solid #ddd',
    'border-radius': '5px'
}).appendTo(content_area);

search_bar.on('input', function () {
    const search_term = $(this).val();
    console.log("Search Term:", search_term); // Debugging: Log the search term
    if (search_term.length > 2) {
        frappe.call({
            method: 'whrt_whitelabel.api.search_products',
            args: {
                search_term: search_term
            },
            callback: function (response) {
                console.log("API Response:", response); // Debugging: Log the API response
                if (response.message) {
                    populateProductGrid(response.message);
                }
            }
        });
    }
});

    // Create product grid area
    var product_grid = $('<div class="product-grid"></div>').appendTo(content_area);
    product_grid.css({
        'display': 'grid',
        'grid-template-columns': 'repeat(auto-fill, minmax(150px, 1fr))',
        'gap': '10px',
        'width': '100%',
        'margin-top': '20px'
    });

    // Pagination variables
    let currentPage = 1;
    const itemsPerPage = 24;

    // Currency formatter for INR
    var formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    });
	

    // Fetch Item Groups via the Frappe API to populate the category sidebar
    fetchItemGroups();

    // Function to fetch item groups
    function fetchItemGroups() {
        frappe.call({
            method: 'whrt_whitelabel.api.get_item_groups',
            callback: function (response) {
                if (response.message) {
                    var item_groups = response.message;
                    populateCategorySidebar(item_groups);
                } else {
                    frappe.msgprint("Failed to fetch categories. Please try again.");
                }
            },
            error: function (err) {
                frappe.msgprint("An error occurred while fetching categories. Please check your network connection.");
            }
        });
    }

    // Function to populate the category sidebar
    function populateCategorySidebar(item_groups) {
        var menu = $('<ul></ul>').appendTo(category_sidebar);
        menu.css({
            'list-style-type': 'none',
            'padding': '0',
            'margin': '0'
        });

        item_groups.forEach(function (group) {
            var list_item = $('<li><a href="#" class="item-group">' + group.item_group_name + '</a></li>');
            menu.append(list_item);

            list_item.on('click', function (e) {
                e.preventDefault();
                currentPage = 1; // Reset to the first page when selecting a new category
                load_products_by_category(group.item_group_name);
            });
        });

        menu.find('li').css({
            'margin-bottom': '10px',
            'padding': '5px 0',
            'font-size': '14px'
        });
    }

    // Load products based on selected category
    function load_products_by_category(category_name) {
        product_grid.empty();

        frappe.call({
            method: 'whrt_whitelabel.api.get_products',
            args: { category_name: category_name, page: currentPage, limit: itemsPerPage },
            callback: function (response) {
                if (response.message) {
                    const { products, total_count } = response.message;
                    populateProductGrid(products);
                    add_pagination_controls(total_count, category_name);
                } else {
                    frappe.msgprint("Failed to fetch products. Please try again.");
                }
            },
            error: function (err) {
                frappe.msgprint("An error occurred while fetching products. Please check your network connection.");
            }
        });
    }

    // Function to populate the product grid
    function populateProductGrid(products) {
		
        products.forEach(function (product) {
            const product_item = createProductItem(product);
            product_grid.append(product_item);
        });
    }

    // Function to create a product item
    function createProductItem(product) {
        const product_item = $('<div class="product-item"></div>');
        product_item.css({
            'border': '1px solid #ddd',
            'border-radius': '10px',
            'padding': '15px',
            'box-shadow': '0px 4px 8px rgba(0, 0, 0, 0.1)',
            'background-color': '#fff',
            'text-align': 'center',
            'cursor': 'pointer',
            'transition': 'transform 0.3s ease',
            'display': 'flex',
            'flex-direction': 'column',
            'justify-content': 'space-between',
            'height': '350px'
        });

        // Hover effect for scaling
        product_item.hover(function () {
            $(this).css('transform', 'scale(1.05)');
        }, function () {
            $(this).css('transform', 'scale(1)');
        });

        // Product Image
        const product_image = $('<img src="' + product.image + '" alt="' + product.item_name + '" />');
        product_image.css({
            'width': '100%',
            'max-height': '200px',
            'object-fit': 'cover',
            'border-radius': '8px',
            'margin-bottom': '15px'
        });
        product_item.append(product_image);

        // Product Info (Name & Price)
        const product_info = $('<div class="product-info"></div>').css({
            'display': 'flex',
            'flex-direction': 'column',
            'justify-content': 'space-between',
            'text-align': 'center'
        });

        // Product Name
        const product_name = $('<div class="product-name"></div>').text(product.item_name).css({
            'font-weight': 'bold',
            'font-size': '16px',
            'margin-bottom': '10px',
        });
        product_info.append(product_name);

        // Product Price
        const product_price = $('<div class="product-price"></div>').text(formatter.format(product.valuation_rate)).css({
            'color': '#f60',
            'font-size': '14px',
        });
        product_info.append(product_price);

        // Add the product info to the item
        product_item.append(product_info);

        // When the product item is clicked, add to the cart
        product_item.on('click', function () {
            add_to_cart(product);
        });

        return product_item;
    }

    // Add pagination controls
    function add_pagination_controls(total_count, category_name) {
        const totalPages = Math.ceil(total_count / itemsPerPage);

        const pagination = $('<div class="pagination-controls"></div>');
        pagination.css({ 'display': 'flex', 'justify-content': 'center', 'margin-top': '20px' });

        const prev_button = $('<button>Previous</button>').css({ 'margin-right': '10px' }).prop('disabled', currentPage === 1);
        const next_button = $('<button>Next</button>').prop('disabled', currentPage === totalPages);

        prev_button.on('click', function () {
            if (currentPage > 1) {
                currentPage--;
                load_products_by_category(category_name);
            }
        });

        next_button.on('click', function () {
            if (currentPage < totalPages) {
                currentPage++;
                load_products_by_category(category_name);
            }
        });

        pagination.append(prev_button, next_button);

        $('.pagination-controls').remove();
        content_area.append(pagination);
    }

    // Create the right-side section for Item Cart
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
        'z-index': '1000',
    });

    // Add customer search bar above the cart section
    const customer_search_bar = $(`
        <div class="customer-search-bar" style="margin-bottom: 20px;">
            <input type="text" class="customer-search-input" placeholder="Search or add customer" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <button class="add-customer-btn" style="width: 100%; padding: 10px; margin-top: 10px; background-color: #28a745; color: #fff; border: none; border-radius: 5px;">Add New Customer</button>
        </div>
    `).appendTo(right_section);

    // Item Cart Section
    var cart_section = $(`
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

    // Cart Functionality
    let cart = [];
    let totalQuantity = 0;
    let invoice_id = null;
    let selected_customer = null;

    // Function to add a product to the cart
    function add_to_cart(product) {
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
        update_cart();
    }

    // Function to update the cart
    function update_cart() {
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

        // Save cart to local storage
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Function to create a cart item
    function createCartItem(item) {
        const cartItem = $(`
            <div style="display: flex; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; margin-right: 10px; object-fit: cover; border-radius: 5px;">
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${item.name}</div>
                    <div style="font-size: 12px; color: #555;">
                        Quantity: 
                        <button class="decrease-quantity">-</button>
                        ${item.quantity}
                        <button class="increase-quantity">+</button>
                    </div>
                </div>
                <div style="font-weight: bold; color: #333;">₹${(item.quantity * item.valuation_rate).toFixed(2)}</div>
                <button class="remove-item" style="margin-left: 10px; color: red;">×</button>
            </div>
        `);

        // Add event listeners for quantity adjustment and removal
        cartItem.find('.increase-quantity').on('click', function () {
            item.quantity += 1;
            update_cart();
        });

        cartItem.find('.decrease-quantity').on('click', function () {
            if (item.quantity > 1) {
                item.quantity -= 1;
                update_cart();
            }
        });

        cartItem.find('.remove-item').on('click', function () {
            cart = cart.filter(cartItem => cartItem.name !== item.name);
            update_cart();
        });

        return cartItem;
    }

    // Load cart from local storage on page load
    function loadCartFromLocalStorage() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            update_cart();
        }
    }

    // Call the function to load cart from local storage
    loadCartFromLocalStorage();

    // Payment Modal
    const payment_modal = $(`
        <div class="payment-modal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2); z-index: 10000; width: 400px;">
            <h3 style="margin-bottom: 20px;">Payment</h3>
            <div style="margin-bottommargin-bottom: 20px;">
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

    // Function to update the grand total in the payment modal
    function updateGrandTotalInModal() {
        const grandTotal = parseFloat(cart_section.find('.grand-total').text());
        payment_modal.find('.grand-total-display').text(`₹${grandTotal.toFixed(2)}`);
    }

    // Show payment modal when checkout button is clicked
    cart_section.find('.checkout-btn').on('click', function () {
    const grandTotal = parseFloat(cart_section.find('.grand-total').text());
    if (grandTotal <= 0) {
        frappe.msgprint("Your cart is empty. Please add items to proceed.");
        return;
    }

    let selected_company = localStorage.getItem("selected_company");
    let selected_pos_profile = localStorage.getItem("selected_pos_profile");

    if (!selected_company || !selected_pos_profile) {
        frappe.msgprint("Please select a Company and POS Profile before checkout.");
        return;
    }

    // ✅ Instead of creating an invoice here, just show the payment modal
    updateGrandTotalInModal();
    payment_modal.show();
});





    // Process payment
    payment_modal.find('.process-payment-btn').on('click', function () {
    const grandTotal = parseFloat(cart_section.find('.grand-total').text());
    let totalPaid = 0;
    const paymentEntries = [];

    payment_modal.find('.split-payment-row').each(function () {
        const paymentMethod = $(this).find('.payment-method').val();
        const paymentAmount = parseFloat($(this).find('.split-amount').val());

        if (!isNaN(paymentAmount) && paymentAmount > 0 && paymentMethod) {
            totalPaid += paymentAmount;
            paymentEntries.push({
                mode_of_payment: paymentMethod, // ✅ Ensure Mode of Payment is Included
                amount: paymentAmount
            });
        }
    });

    if (paymentEntries.length === 0) {
        frappe.msgprint("At least one mode of payment is required.");
        return;
    }

    if (totalPaid !== grandTotal) {
        frappe.msgprint(`Total paid amount (₹${totalPaid.toFixed(2)}) does not match the grand total (₹${grandTotal.toFixed(2)}).`);
        return;
    }

    let selected_company = localStorage.getItem("selected_company");
    let selected_pos_profile = localStorage.getItem("selected_pos_profile");

    if (!selected_company || !selected_pos_profile) {
        frappe.msgprint("Please select a Company and POS Profile before processing payment.");
        return;
    }

    //  Create Invoice After Payment
    frappe.call({
        method: 'whrt_whitelabel.api.create_invoice',
        args: { 
            cart: JSON.stringify(cart),  
            customer: selected_customer, 
            pos_profile: selected_pos_profile,
            payments: JSON.stringify(paymentEntries) //  Send Payments
        },
        callback: function (invoice_response) {
            console.log("Create Invoice API Response:", invoice_response);

            if (invoice_response.message && invoice_response.message.invoice_id) {
                let invoice_id = invoice_response.message.invoice_id;
                console.log("Invoice Created Successfully. ID:", invoice_id);
                frappe.msgprint("Invoice Created: " + invoice_id);

                payment_modal.hide();
                cart = []; // Clear the cart after payment
                update_cart();
            } else {
                frappe.msgprint("Invoice creation failed. Please check logs.");
            }
        }
    });
});


    // Close payment modal
    payment_modal.find('.close-payment-modal-btn').on('click', function () {
        payment_modal.hide();
    });

    // Email invoice
    cart_section.find('.email-invoice-btn').on('click', function () {
        if (!invoice_id) {
            frappe.msgprint("No invoice created yet.");
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
                frappe.msgprint("An error occurred while emailing the invoice. Please check your network connection.");
            }
        });
    });

    // Customer search functionality
    customer_search_bar.find('.customer-search-input').on('input', function () {
        const search_term = $(this).val();
        console.log("Search term:", search_term); // Debugging: Log the search term

        if (search_term.length > 1) {
            frappe.call({
                method: 'whrt_whitelabel.api.search_customers',
                args: {
                    search_term: search_term // Pass the search_term directly
                },
                callback: function (response) {
                    console.log("API Response:", response); // Debugging: Log the entire response

                    if (response.message) {
                        const customers = response.message;

                        // Ensure customers is an array
                        if (!Array.isArray(customers)) {
                            console.error("API response is not an array:", customers);
                            frappe.msgprint("Invalid response from the server. Please try again.");
                            return;
                        }

                        const customer_dropdown = $('<div class="customer-dropdown"></div>').css({
                            'position': 'absolute',
                            'background': '#fff',
                            'border': '1px solid #ddd',
                            'width': '100%',
                            'max-height': '200px',
                            'overflow-y': 'auto',
                            'z-index': '1000',
                            'margin-top': '5px', // Add margin to separate from the input
                            'box-shadow': '0px 4px 10px rgba(0, 0, 0, 0.1)' // Add shadow for better visibility
                        });

                        // Clear previous dropdown
                        $('.customer-dropdown').remove();

                        customers.forEach(customer => {
                            const customer_option = $(`
                                <div class="customer-option" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #ddd;">
                                    ${customer.customer_name} (${customer.mobile_no || 'No mobile number'})
                                </div>
                            `).on('click', function () {
                                selected_customer = customer.name;
                                customer_search_bar.find('.customer-search-input').val(customer.customer_name);
                                customer_dropdown.remove();
                            });

                            customer_dropdown.append(customer_option);
                        });

                        // Append dropdown below the search bar
                        customer_search_bar.append(customer_dropdown);
                    }
                },
                error: function (err) {
                    console.error("API Error:", err); // Debugging: Log API errors
                    frappe.msgprint("An error occurred while searching for customers. Please check your network connection.");
                }
            });
        } else {
            // Clear dropdown if search term is too short
            $('.customer-dropdown').remove();
        }
    });

    // Add new customer functionality
    customer_search_bar.find('.add-customer-btn').on('click', function () {
        const customer_name = customer_search_bar.find('.customer-search-input').val();
        if (!customer_name) {
            frappe.msgprint("Please enter a customer name.");
            return;
        }

        // Prompt for mobile number
        frappe.prompt([
            {
                fieldname: 'mobile_no',
                label: __('Mobile No'),
                fieldtype: 'Data',
                reqd: 1, // Make mobile number mandatory
                description: 'Enter the customer\'s mobile number.'
            }
        ], function (values) {
            const mobile_no = values.mobile_no;

            frappe.call({
                method: 'whrt_whitelabel.api.set_customer_info',
                args: {
                    doc: {
                        doctype: 'Customer',
                        customer_name: customer_name,
                        mobile_no: mobile_no, // Include mobile number
                        customer_type: 'Individual',
                        customer_group: 'Commercial',
                        territory: 'All Territories'
                    }
                },
                callback: function (response) {
                    if (response.message) {
                        frappe.msgprint("Customer added successfully!");
                        selected_customer = response.message.name; // Set the new customer as selected
                        customer_search_bar.find('.customer-search-input').val(response.message.customer_name);
                    } else {
                        frappe.msgprint("Failed to add customer. Please try again.");
                    }
                },
                error: function (err) {
                    frappe.msgprint("An error occurred while adding the customer. Please check your network connection.");
                }
            });
        }, __('Add New Customer'), __('Add'));
    });
};