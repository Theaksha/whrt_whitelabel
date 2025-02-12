var ProductManagement = (function() {
    var content_area, category_sidebar, product_grid;
    var currentPage = 1;
    const itemsPerPage = 24;
    var formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    });

    function init(page) {
        createLayout(page);
        fetchItemGroups();
        setupSearchBar();
    }

    function createLayout(page) {
        // Create the left sidebar for categories
        category_sidebar = $('<div class="category-sidebar"></div>').appendTo(page.wrapper);
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
        category_sidebar.append('<h3 class="sidebar-header">Categories</h3>');
        category_sidebar.find('.sidebar-header').css({
            'font-size': '18px',
            'font-weight': 'bold',
            'color': '#ff6347',
            'margin-bottom': '15px',
            'cursor': 'pointer'
        });

        // Create the content area for products
        content_area = $('<div class="content-area"></div>').appendTo(page.wrapper);
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
        content_area.append('<h2>Whrt POS</h2>');
        content_area.append('<p>Select a category to view products</p>');

        // Create a search bar for products
        var search_bar = $('<input type="text" placeholder="Search products..." class="search-bar">').css({
            'width': '100%',
            'padding': '10px',
            'margin-bottom': '20px',
            'border': '1px solid #ddd',
            'border-radius': '5px'
        });
        content_area.append(search_bar);

        // Create a grid area for displaying products
        product_grid = $('<div class="product-grid"></div>').appendTo(content_area);
        product_grid.css({
            'display': 'grid',
            'grid-template-columns': 'repeat(auto-fill, minmax(150px, 1fr))',
            'gap': '10px',
            'width': '100%',
            'margin-top': '20px'
        });

        // Set up the search bar event listener
        search_bar.on('input', function() {
            const search_term = $(this).val();
            if (search_term.length > 2) {
                frappe.call({
                    method: 'whrt_whitelabel.api.search_products',
                    args: { search_term: search_term },
                    callback: function(response) {
                        if (response.message) {
                            populateProductGrid(response.message);
                        }
                    }
                });
            }
        });
    }

    function setupSearchBar() {
        // (Additional search bar configuration can go here if needed.)
    }

    function fetchItemGroups() {
        frappe.call({
            method: 'whrt_whitelabel.api.get_item_groups',
            callback: function(response) {
                if (response.message) {
                    populateCategorySidebar(response.message);
                } else {
                    frappe.msgprint("Failed to fetch categories. Please try again.");
                }
            },
            error: function(err) {
                frappe.msgprint("An error occurred while fetching categories. Please check your network connection.");
            }
        });
    }

    function populateCategorySidebar(item_groups) {
        var menu = $('<ul></ul>').appendTo(category_sidebar);
        menu.css({
            'list-style-type': 'none',
            'padding': '0',
            'margin': '0'
        });

        item_groups.forEach(function(group) {
            var list_item = $('<li><a href="#" class="item-group">' + group.item_group_name + '</a></li>');
            menu.append(list_item);
            list_item.on('click', function(e) {
                e.preventDefault();
                currentPage = 1;
                loadProductsByCategory(group.item_group_name);
            });
        });

        menu.find('li').css({
            'margin-bottom': '10px',
            'padding': '5px 0',
            'font-size': '14px'
        });
    }

    function loadProductsByCategory(category_name) {
        product_grid.empty();
        frappe.call({
            method: 'whrt_whitelabel.api.get_products',
            args: { category_name: category_name, page: currentPage, limit: itemsPerPage },
            callback: function(response) {
                if (response.message) {
                    const { products, total_count } = response.message;
                    populateProductGrid(products);
                    addPaginationControls(total_count, category_name);
                } else {
                    frappe.msgprint("Failed to fetch products. Please try again.");
                }
            },
            error: function(err) {
                frappe.msgprint("An error occurred while fetching products. Please check your network connection.");
            }
        });
    }

    function populateProductGrid(products) {
        product_grid.empty();
        products.forEach(function(product) {
            const product_item = createProductItem(product);
            product_grid.append(product_item);
        });
    }

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

        // Hover effect for a little scaling
        product_item.hover(function () {
            $(this).css('transform', 'scale(1.05)');
        }, function () {
            $(this).css('transform', 'scale(1)');
        });

        // Add product image
        const product_image = $('<img src="' + product.image + '" alt="' + product.item_name + '" />');
        product_image.css({
            'width': '100%',
            'max-height': '200px',
            'object-fit': 'cover',
            'border-radius': '8px',
            'margin-bottom': '15px'
        });
        product_item.append(product_image);

        // Add product name and price
        const product_info = $('<div class="product-info"></div>').css({
            'display': 'flex',
            'flex-direction': 'column',
            'justify-content': 'space-between',
            'text-align': 'center'
        });
        const product_name = $('<div class="product-name"></div>').text(product.item_name).css({
            'font-weight': 'bold',
            'font-size': '16px',
            'margin-bottom': '10px'
        });
        const product_price = $('<div class="product-price"></div>').text(formatter.format(product.valuation_rate)).css({
            'color': '#f60',
            'font-size': '14px'
        });
        product_info.append(product_name, product_price);
        product_item.append(product_info);

        // When clicked, add the product to the cart
        product_item.on('click', function() {
            Cart.addToCart(product);
        });

        return product_item;
    }

    function addPaginationControls(total_count, category_name) {
        const totalPages = Math.ceil(total_count / itemsPerPage);
        const pagination = $('<div class="pagination-controls"></div>');
        pagination.css({ 'display': 'flex', 'justify-content': 'center', 'margin-top': '20px' });

        const prev_button = $('<button>Previous</button>').css({ 'margin-right': '10px' }).prop('disabled', currentPage === 1);
        const next_button = $('<button>Next</button>').prop('disabled', currentPage === totalPages);

        prev_button.on('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadProductsByCategory(category_name);
            }
        });

        next_button.on('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                loadProductsByCategory(category_name);
            }
        });

        pagination.append(prev_button, next_button);
        // Remove any previous pagination controls and append the new one
        $('.pagination-controls').remove();
        content_area.append(pagination);
    }

    return {
        init: init,
        loadProductsByCategory: loadProductsByCategory,
        populateProductGrid: populateProductGrid,
        createProductItem: createProductItem
    };
})();
