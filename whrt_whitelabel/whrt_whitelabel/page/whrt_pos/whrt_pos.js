frappe.pages['whrt-pos'].on_page_load = async function (wrapper) {

  // ----------------------------
  // IndexedDB Helper Functions
  // ----------------------------
  let db;
  async function initIDB() {
    return new Promise((resolve, reject) => {
      let request = indexedDB.open("whrt_pos_db", 1);
      request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("storage")) {
          db.createObjectStore("storage", { keyPath: "key" });
        }
      };
      request.onsuccess = function(event) {
        db = event.target.result;
        resolve();
      };
      request.onerror = function(event) {
        console.error("IndexedDB error:", event.target.errorCode);
        reject(event.target.errorCode);
      };
    });
  }
  await initIDB();

  async function getStorage(key) {
    return new Promise((resolve, reject) => {
      let transaction = db.transaction(["storage"], "readonly");
      let store = transaction.objectStore("storage");
      let request = store.get(key);
      request.onsuccess = function() {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  async function setStorage(key, value) {
    return new Promise((resolve, reject) => {
      let transaction = db.transaction(["storage"], "readwrite");
      let store = transaction.objectStore("storage");
      let request = store.put({ key: key, value: value });
      request.onsuccess = function() {
        resolve();
      };
      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  async function removeStorage(key) {
    return new Promise((resolve, reject) => {
      let transaction = db.transaction(["storage"], "readwrite");
      let store = transaction.objectStore("storage");
      let request = store.delete(key);
      request.onsuccess = function() {
        resolve();
      };
      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  async function clearStorage() {
    return new Promise((resolve, reject) => {
      let transaction = db.transaction(["storage"], "readwrite");
      let store = transaction.objectStore("storage");
      let request = store.clear();
      request.onsuccess = function() {
        resolve();
      };
      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  // ----------------------------
  // Utility: Show simple message
  // ----------------------------
  function showLoadingMessage(msg) {
    frappe.msgprint(msg);
    console.log(msg);
  }

  // ----------------------------
  // Offline Invoice Storage Function
  // ----------------------------
  async function storeOfflineInvoice(invoicePayload) {
    let offlineInvoices = await getStorage("offline_invoices");
    if (offlineInvoices) {
      try {
        offlineInvoices = JSON.parse(offlineInvoices);
      } catch (e) {
        offlineInvoices = [];
      }
    } else {
      offlineInvoices = [];
    }
    offlineInvoices.push(invoicePayload);
    await setStorage("offline_invoices", JSON.stringify(offlineInvoices));
  }

  async function offlineReduceStock(cart) {
    let stockData = await getStorage("stock_mapping");
    if (stockData) {
      try {
        stockData = JSON.parse(stockData);
      } catch (e) {
        stockData = {};
      }
    } else {
      stockData = {};
    }
    cart.forEach(item => {
      if (stockData[item.name] !== undefined) {
        stockData[item.name] -= item.quantity;
        if (stockData[item.name] < 0) {
          stockData[item.name] = 0;
        }
      }
    });
    await setStorage("stock_mapping", JSON.stringify(stockData));
    update_cart();
    renderPage();
  }

  // ----------------------------
  // Offline Invoice Sync Routine
  // ----------------------------
  async function syncOfflineInvoices() {
    if (!navigator.onLine) return;
    let offlineInvoices = await getStorage("offline_invoices");
    if (!offlineInvoices) return;
    try {
      offlineInvoices = JSON.parse(offlineInvoices);
    } catch (e) {
      console.error("Error parsing offline invoices", e);
      return;
    }
    for (let i = 0; i < offlineInvoices.length; i++) {
      let invoicePayload = offlineInvoices[i];
      if (invoicePayload.taxes_and_charges) {
        try {
          let taxData = JSON.parse(invoicePayload.taxes_and_charges);
          if (taxData && taxData.taxes_and_charges) {
            invoicePayload.taxes_and_charges = taxData.taxes_and_charges;
          }
        } catch (e) {
          // leave value as is
        }
      }
      await frappe.call({
        method: 'whrt_whitelabel.api.create_invoice',
        args: invoicePayload,
        callback: function (invoice_response) {
          if (invoice_response.message && invoice_response.message.invoice_id) {
            frappe.msgprint("Offline invoice synced: " + invoice_response.message.invoice_id);
            offlineInvoices.splice(i, 1);
            i--;
          } else {
            frappe.msgprint("Failed to sync an offline invoice: " + (invoice_response.error || ""));
          }
        },
        error: function (err) {
          frappe.msgprint("Server error while syncing offline invoice.");
          console.error("Sync error", err);
        }
      });
    }
    await setStorage("offline_invoices", JSON.stringify(offlineInvoices));
  }
  
  window.addEventListener('online', function() {
    frappe.msgprint("Connection restored. Syncing offline invoices...");
    syncOfflineInvoices();
  });
  
  setInterval(() => {
    if (navigator.onLine) {
      syncOfflineInvoices();
    }
  }, 30000);

  // ----------------------------
  // Fetch All Items in Batches
  // ----------------------------
  async function fetchAllItems() {
    const limit = 1000;
    let allItems = [];
    let start = 0;
    while (true) {
      let response = await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Item",
          fields: ["name", "item_name", "item_group", "image", "valuation_rate"],
          limit_page_length: limit,
          limit_start: start
        }
      });
      if (response.message && response.message.length > 0) {
        allItems = allItems.concat(response.message);
        showLoadingMessage(`Fetched ${allItems.length} items so far...`);
        if (response.message.length < limit) break;
        start += limit;
      } else {
        break;
      }
    }
    return allItems;
  }

  // ----------------------------
  // Fetch & Store Doctype Data
  // ----------------------------
  async function fetchAndStoreDoctypeData() {
    try {
      showLoadingMessage("Fetching all Items. Please wait...");
      const items = await fetchAllItems();
      showLoadingMessage(`Total items fetched: ${items.length}`);
      await setStorage("items", JSON.stringify(items));
      showLoadingMessage("All items stored in IndexedDB.");
    } catch (error) {
      console.error("Error fetching items:", error);
    }
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Item Group",
        fields: ["name", "item_group_name"],
        limit_page_length: 1000
      },
      callback: async function(response) {
        if (response.message) {
          await setStorage("item_groups", JSON.stringify(response.message));
          showLoadingMessage(`Item Groups stored: ${response.message.length}`);
        }
      }
    });
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Customer",
        fields: ["name", "customer_name", "mobile_no"],
        limit_page_length: 1000
      },
      callback: async function(response) {
        if (response.message) {
          await setStorage("customers", JSON.stringify(response.message));
          showLoadingMessage(`Customers stored: ${response.message.length}`);
        }
      }
    });
    fetchStockData();
  }

  // ----------------------------
  // Fetch Stock Data from Server
  // ----------------------------
  async function fetchStockData() {
    let warehouse = await getStorage("pos_profile_warehouse");
    if (!warehouse) {
      warehouse = "Main Warehouse";
    }
    frappe.call({
      method: "whrt_whitelabel.api.get_accurate_stock",
      args: { warehouse: warehouse },
      callback: async function(response) {
        if (response.message) {
          let stock_mapping = response.message;
          await setStorage("stock_mapping", JSON.stringify(stock_mapping));
          frappe.msgprint("Accurate stock data stored in IndexedDB!");
          update_cart();
        }
      }
    });
  }

  // ----------------------------
  // Debug: Check Items in Storage
  // ----------------------------
  async function debugItemsStorage() {
    let data = await getStorage("items");
    if (data) {
      let items = JSON.parse(data);
      console.log("Total items stored in IndexedDB:", items.length);
      alert("Total items stored in IndexedDB: " + items.length);
    } else {
      console.log("No items stored in IndexedDB.");
      alert("No items stored in IndexedDB.");
    }
  }

  $('.body-sidebar-container').hide();
  $('header.navbar').hide();
  
  if (!frappe.session.user || frappe.session.user === 'Guest') {
    window.location.href = '/login?redirect-to=whrt-pos';
    return;
  }

  // ----------------------------
  // Helper: Add POS Opening Entry to Array
  // ----------------------------
  async function addPosOpeningEntry(newEntryId) {
    let entriesStr = await getStorage("pos_opening_entries");
    let entries = [];
    if (entriesStr) {
      entries = JSON.parse(entriesStr);
    }
    entries.push(newEntryId);
    await setStorage("pos_opening_entries", JSON.stringify(entries));
  }

  // ----------------------------
  // Custom functions to update session data
  // ----------------------------
  async function updatePosTransactions(transactions) {
    await setStorage("pos_transactions", JSON.stringify(transactions));
  }

  async function updatePaymentReconciliation(payments) {
    await setStorage("payment_reconciliation", JSON.stringify(payments));
  }

  async function updateTaxes(taxesData) {
    await setStorage("taxes", JSON.stringify(taxesData));
  }

  async function updateTotals(grand_total, net_total, total_quantity) {
    let totals = { grand_total, net_total, total_quantity };
    await setStorage("totals", JSON.stringify(totals));
  }

 // ----------------------------
// Logout & POS Closing Entry Creation
// ----------------------------
async function finalizePosSession() {
  console.debug("Finalizing POS session...");
  let savedCart = await getStorage('cart');
  if (savedCart && JSON.parse(savedCart).length > 0) {
    console.debug("There are pending cart items. Finalizing transactions...");
    // Optionally process pending transactions
  }
  let entriesStr = await getStorage("pos_opening_entries");
  let openingEntries = entriesStr ? JSON.parse(entriesStr) : [];
  if (openingEntries.length === 0) {
    frappe.msgprint("No POS Opening Entry found. Cannot create POS Closing Entry.");
    finalizeSessionCleanup();
    return;
  }
  let periodEnd = frappe.datetime.get_today() + " 23:59:59";
  let posting_date = frappe.datetime.get_today();
  let nowDate = new Date();
  let posting_time = nowDate.toTimeString().split(" ")[0];

  console.debug("Creating POS Closing Entry with periodEnd:", periodEnd, "posting_date:", posting_date, "posting_time:", posting_time);

  openingEntries.forEach(function(pos_opening_entry) {
    frappe.call({
      method: 'whrt_whitelabel.api.create_pos_closing_entry',
      args: {
        pos_opening_entry: pos_opening_entry,
        period_end_date: periodEnd,
        posting_date: posting_date,
        posting_time: posting_time,
        pos_transactions: "[]",
        payment_reconciliation: "[]",
        taxes: "[]",
        grand_total: "0",
        net_total: "0",
        total_quantity: "0"
      },
      callback: function(res) {
        if (res.message && res.message.closing_entry) {
          frappe.msgprint("POS Closing Entry created for " + pos_opening_entry + ": " + res.message.closing_entry);
          console.debug("POS Closing Entry created:", res.message.closing_entry);
        } else {
          frappe.msgprint("Failed to create POS Closing Entry for " + pos_opening_entry + ": " + (res.error || ""));
          console.error("Failed to create POS Closing Entry for", pos_opening_entry, "Error:", res.error);
        }
      }
    });
  });
  finalizeSessionCleanup();
}


  function finalizeSessionCleanup() {
    Promise.all([
      removeStorage("selected_company"),
      removeStorage("selected_pos_profile"),
      removeStorage("opening_balance"),
      removeStorage("pos_opening_entries"),
      clearStorage()
    ]).then(() => {
      frappe.msgprint("POS session closed. All data cleared.");
    });
  }

  async function setupCustomNavbar() {
    var posProfile = (await getStorage("selected_pos_profile")) || "POS Profile";
    var isLoggedIn = frappe.session.user && frappe.session.user !== 'Guest';
    var navbar = $('<div class="custom-navbar"></div>');
    var userDisplay = $('<span class="user-display">POS: ' + posProfile + '</span>');
    var homeBtn = $('<button class="home-btn">Home</button>');
    var loginBtn = $('<button class="login-btn">Login</button>');
    var logoutBtn = $('<button class="logout-btn">Logout</button>');
    var debugBtn = $('<button class="debug-btn">Debug Items</button>');
    navbar.append(userDisplay, homeBtn, debugBtn, (isLoggedIn ? logoutBtn : loginBtn));
    $('body').prepend(navbar);
    homeBtn.on('click', function () { window.location.href = '/desk'; });
    loginBtn.on('click', function () { window.location.href = '/login?redirect-to=whrt-pos'; });
    debugBtn.on('click', debugItemsStorage);
    logoutBtn.on('click', async function () {
      await finalizePosSession();
    });
  }
  await setupCustomNavbar();

  // ----------------------------
  // POS Session Dialog
  // ----------------------------
  let company_selected = null;
  let pos_profile_selected = null;
  let opening_balance_details = null;
  async function show_pos_selection_dialog() {
    let saved_company = await getStorage("selected_company");
    let saved_pos_profile = await getStorage("selected_pos_profile");
    let saved_opening_balance = await getStorage("opening_balance");
    if (saved_company && saved_pos_profile) {
      frappe.msgprint(`Loaded saved session: ${saved_company} - ${saved_pos_profile}`);
      company_selected = saved_company;
      pos_profile_selected = saved_pos_profile;
      if (saved_opening_balance) opening_balance_details = JSON.parse(saved_opening_balance);
      return;
    }
    let dialog = new frappe.ui.Dialog({
      title: "Select POS Session Details",
      fields: [
        { label: "Company", fieldname: "company", fieldtype: "Select", options: "", reqd: 1 },
        { label: "POS Profile", fieldname: "pos_profile", fieldtype: "Link", options: "POS Profile", reqd: 1 },
        {
          label: "Opening Balance Details", fieldname: "opening_balance", fieldtype: "Table", reqd: 1,
          fields: [
            { label: "Mode of Payment", fieldname: "mode_of_payment", fieldtype: "Link", options: "Mode of Payment", in_list_view: 1, reqd: 1 },
            { label: "Opening Amount", fieldname: "opening_amount", fieldtype: "Currency", in_list_view: 1 }
          ]
        }
      ],
      primary_action_label: "Submit",
      primary_action: async function(values) {
        if (!values.company || !values.pos_profile) {
          frappe.msgprint("Please select both Company and POS Profile.");
          return;
        }
        await setStorage("selected_company", values.company);
        await setStorage("selected_pos_profile", values.pos_profile);
        await setStorage("opening_balance", JSON.stringify(values.opening_balance));
        company_selected = values.company;
        pos_profile_selected = values.pos_profile;
        frappe.msgprint(`Selected: ${values.company} - ${values.pos_profile}`);
        let periodStart = frappe.datetime.get_today() + " 00:00:00";
        let periodEnd = frappe.datetime.add_days(frappe.datetime.get_today(), 1) + " 00:00:00";
        frappe.call({
          method: 'whrt_whitelabel.api.create_pos_opening_entry',
          args: {
            company: values.company,
            pos_profile: values.pos_profile,
            period_start_date: periodStart,
            period_end_date: periodEnd,
            opening_balance_details: JSON.stringify(values.opening_balance)
          },
          callback: function(res) {
            if (res.message && res.message.opening_entry) {
              frappe.msgprint("POS Opening Entry created: " + res.message.opening_entry);
              addPosOpeningEntry(res.message.opening_entry);
            } else {
              frappe.msgprint("Failed to create POS Opening Entry: " + (res.error || ""));
            }
          }
        });
        await fetchAndStoreDoctypeData();
        dialog.hide();
      }
    });
    frappe.call({
      method: "frappe.client.get_list",
      args: { doctype: "Company", fields: ["name"] },
      callback: function (response) {
        let companies = response.message;
        if (companies && companies.length) {
          let company_options = companies.map(company => company.name).join("\n");
          dialog.set_df_property("company", "options", company_options);
        } else {
          frappe.msgprint("No companies found!");
        }
      }
    });
    dialog.fields_dict.company.df.onchange = function () {
      let selected_company = dialog.get_value("company");
      if (selected_company) {
        frappe.call({
          method: "whrt_whitelabel.api.get_pos_profiles",
          args: { company: selected_company },
          callback: function (response) {
            let profiles = response.message;
            let options = "";
            if (profiles && profiles.length) {
              profiles.forEach(function (profile) { options += profile.name + "\n"; });
            } else { options = "POS Profile"; }
            dialog.set_df_property("pos_profile", "options", options);
          }
        });
      }
    };
    dialog.fields_dict.pos_profile.df.onchange = function () {
      let selected_profile = dialog.get_value("pos_profile");
      if (!selected_profile || selected_profile === "undefined") return;
      frappe.call({
        method: "frappe.client.get",
        args: { doctype: "POS Profile", name: selected_profile },
        callback: function (r) {
          if (!r.message) return;
          let pos_profile = r.message;
          let template_name = pos_profile.taxes_and_charges; 
          let tax_category = pos_profile.tax_category;
          frappe.call({
            method: "whrt_whitelabel.api.get_sales_taxes_and_charges_details",
            args: { template_name: template_name },
            callback: function(taxRes) {
              let tax_rules = taxRes.message || [];
              let taxData = {
                taxes_and_charges: template_name,
                tax_category: tax_category,
                rules: tax_rules
              };
              setStorage("pos_profile_taxation", JSON.stringify(taxData));
              let warehouse = pos_profile.warehouse;
              setStorage("pos_profile_warehouse", warehouse);
              let payments = pos_profile.payments || [];
              let rows = [];
              payments.forEach(function (payment) {
                rows.push({ mode_of_payment: payment.mode_of_payment, opening_amount: 0 });
              });
              if (rows.length === 0) rows.push({ mode_of_payment: "", opening_amount: 0 });
              dialog.set_value("opening_balance", rows);
              dialog.refresh();
            }
          });
        }
      });
    };
    dialog.show();
  }
  await show_pos_selection_dialog();

  // ----------------------------
  // Client-Side Tax Calculation Routine
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
    return {
      net_total: net_total,
      total_taxes_and_charges: total_taxes_and_charges,
      grand_total: grand_total,
      taxes: taxes
    };
  }

  // ----------------------------
  // (Taxation) Update Cart Function
  // ----------------------------
  async function update_cart() {
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
    $('.grand-total').text("TBD");
    await setStorage('cart', JSON.stringify(cart));

    let company = await getStorage("selected_company");
    let pos_profile_taxation = await getStorage("pos_profile_taxation");
    let customer_for_taxes = selected_customer || "Walk-in Customer";

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
              $('.tax-lines').append(`
                <div class="tax-line">
                  <span>${tax_line.description}</span>
                  <span>₹${(tax_line.tax_amount || 0).toFixed(2)}</span>
                </div>
              `);
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
        $('.tax-lines').append(`
          <div class="tax-line">
            <span>${tax_line.description}</span>
            <span>₹${(tax_line.tax_amount || 0).toFixed(2)}</span>
          </div>
        `);
      });
      $('.grand-total').text(taxResult.grand_total.toFixed(2));
    }
  }

  var page = frappe.ui.make_app_page({ parent: wrapper, single_column: true });
  var category_sidebar = $('<div class="category-sidebar"></div>').appendTo(page.wrapper);
  category_sidebar.append('<h3 class="sidebar-header">Categories</h3>');
  buildCategorySidebarFromLocal();

  async function buildCategorySidebarFromLocal() {
    let data = await getStorage("item_groups");
    if (!data) {
      frappe.msgprint("No offline item_groups found. Please fetch data first.");
      return;
    }
    let item_groups = JSON.parse(data);
    var menu = $('<ul></ul>').appendTo(category_sidebar);
    item_groups.forEach(function (group) {
      var list_item = $('<li><a href="#" class="item-group">' + group.item_group_name + '</a></li>');
      menu.append(list_item);
      list_item.on('click', function (e) {
        e.preventDefault();
        currentPage = 1;
        currentCategory = group.item_group_name;
        load_products_by_category(group.item_group_name);
      });
    });
  }

  var content_area = $('<div class="content-area"></div>').appendTo(page.wrapper);
  content_area.append('<h2 style="color:white;">Whrt POS</h2>');
  content_area.append('<p style="color:white;">Select a category to view products</p>');
  
  // Removed the style tag injection for media queries as these are now in whrt_pos.css

  var product_grid = $('<div class="product-grid"></div>').appendTo(content_area);

  let currentFilteredItems = [];
  let currentCategory = "";
  let currentPage = 1;
  const itemsPerPage = 24;
  var formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  async function renderPage() {
    let start = (currentPage - 1) * itemsPerPage;
    let end = start + itemsPerPage;
    let pageItems = currentFilteredItems.slice(start, end);
    await populateProductGrid(pageItems);
    addPaginationControls(Math.ceil(currentFilteredItems.length / itemsPerPage));
  }

  function addPaginationControls(totalPages) {
    $('.pagination-controls').remove();
    if (totalPages <= 1) return;
    const pagination = $('<div class="pagination-controls"></div>').css({ 'display': 'flex', 'justify-content': 'center', 'margin-top': '20px' });
    const prev_button = $('<button>Previous</button>');
    const next_button = $('<button>Next</button>');
    if (currentPage === 1) prev_button.prop('disabled', true);
    if (currentPage === totalPages) next_button.prop('disabled', true);
    prev_button.on('click', function () { if (currentPage > 1) { currentPage--; renderPage(); } });
    next_button.on('click', function () { if (currentPage < totalPages) { currentPage++; renderPage(); } });
    pagination.append(prev_button, next_button);
    content_area.append(pagination);
  }

  async function load_products_by_category(category_name) {
    let data = await getStorage("items");
    if (!data) {
      frappe.msgprint("No offline items found. Please go online and fetch data first.");
      return;
    }
    let allItems = JSON.parse(data);
    currentFilteredItems = allItems.filter(it => it.item_group === category_name);
    currentCategory = category_name;
    currentPage = 1;
    renderPage();
  }

  const search_bar = $('<input type="text" placeholder="Search products..." class="search-bar">').appendTo(content_area);
  search_bar.on('input', async function () {
    const search_term = $(this).val().trim().toLowerCase();
    let data = await getStorage("items");
    if (!data) {
      frappe.msgprint("No offline items found for searching. Please fetch data first.");
      return;
    }
    let allItems = JSON.parse(data);
    currentFilteredItems = allItems.filter(item => {
      let combined = (item.item_name + " " + item.name).toLowerCase();
      return combined.includes(search_term);
    });
    currentPage = 1;
    renderPage();
  });

  async function populateProductGrid(products) {
    $('.pagination-controls').remove();
    product_grid.empty();
    let stock_mapping = {};
    try {
      let storedMapping = await getStorage("stock_mapping");
      if (storedMapping) stock_mapping = JSON.parse(storedMapping);
    } catch(e) {
      console.error("Error retrieving stock mapping:", e);
    }
    products.forEach(function (product) {
      const product_item = createProductItem(product, stock_mapping);
      product_grid.append(product_item);
    });
  }

  function createProductItem(product, stock_mapping) {
    let stock_qty = (stock_mapping && stock_mapping[product.name] !== undefined)
      ? stock_mapping[product.name]
      : 0;
    const product_item = $('<div class="product-item"></div>');
    const product_image = $('<img />')
      .attr('src', product.image)
      .attr('alt', product.item_name);
    product_item.append(product_image);
    const badge_color = (typeof stock_qty === 'number' && stock_qty > 0) ? '#28a745' : '#dc3545';
    const badge_text  = (typeof stock_qty === 'number' && stock_qty > 0) ? stock_qty : '0';
    const stock_badge = $('<div class="stock-badge"></div>').text(badge_text);
    product_item.append(stock_badge);
    const product_info = $('<div class="product-info"></div>');
    const product_name = $('<div class="product-name"></div>')
      .text(product.item_name);
    product_info.append(product_name);
    const product_price = $('<div class="product-price"></div>')
      .text(formatter.format(product.valuation_rate));
    product_info.append(product_price);
    product_item.append(product_info);
    product_item.on('click', function () {
      add_to_cart(product);
    });
    return product_item;
  }

  var right_section = $('<div class="right-section"></div>').appendTo(page.wrapper);
  const customer_search_bar = $(`
    <div class="customer-search-bar">
      <input type="text" class="customer-search-input" placeholder="Search or add customer">
      <button class="add-customer-btn">Add New Customer</button>
    </div>
  `).appendTo(right_section);
  var cart_section = $(`
    <div class="cart-section">
      <h3>Item Cart</h3>
      <div class="cart-items"></div>
      <hr>
      <div class="cart-summary">
        <div>
          <span>Total Quantity:</span>
          <span class="cart-quantity">0</span>
        </div>
        <div>
          <span>Net Total:</span>
          <span>₹<span class="net-total">0.00</span></span>
        </div>
        <div class="tax-lines"></div>
        <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 16px; font-weight: bold; color: #007bff;">
          <span>Grand Total:</span>
          <span>₹<span class="grand-total">TBD</span></span>
        </div>
      </div>
      <button class="checkout-btn">Checkout</button>
    </div>
  `);
  right_section.append(cart_section);
  let cart = [];
  let totalQuantity = 0;
  let invoice_id = null;
  let selected_customer = null;

  async function add_to_cart(product) {
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
    await update_cart();
  }

  function createCartItem(item) {
    const cartItem = $(`
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-qty">
            Quantity:
            <button class="decrease-quantity">-</button>
            ${item.quantity}
            <button class="increase-quantity">+</button>
          </div>
        </div>
        <div class="cart-item-total">₹${(item.quantity * item.valuation_rate).toFixed(2)}</div>
        <button class="remove-item">×</button>
      </div>
    `);
    cartItem.find('.increase-quantity').on('click', async function () {
      item.quantity += 1;
      await update_cart();
    });
    cartItem.find('.decrease-quantity').on('click', async function () {
      if (item.quantity > 1) {
        item.quantity -= 1;
        await update_cart();
      }
    });
    cartItem.find('.remove-item').on('click', async function () {
      cart = cart.filter(cartItem => cartItem.name !== item.name);
      await update_cart();
    });
    return cartItem;
  }

  async function loadCartFromStorage() {
    const savedCart = await getStorage('cart');
    if (savedCart) {
      cart = JSON.parse(savedCart);
      await update_cart();
    }
  }
  await loadCartFromStorage();

  // ----------------------------
  // Payment Modal
  // ----------------------------
  const payment_modal = $(`
    <div class="payment-modal">
      <div style="display: flex; flex-wrap: wrap; gap: 20px;">
        <div class="payment-left">
          <h4>Payment Method</h4>
          <div class="payment-method-row">
            <label>Cash</label>
            <input type="number" class="cash-amount" placeholder="0.00" />
          </div>
          <div class="payment-method-row">
            <label>Credit Card</label>
            <input type="number" class="credit-card-amount" placeholder="0.00" />
          </div>
          <div class="payment-method-row">
            <label>Mobile Payment</label>
            <input type="number" class="mobile-amount" placeholder="0.00" />
          </div>
        </div>
        <div class="payment-right">
          <div class="payment-summary">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Grand Total:</span>
              <span class="grand-total-display">₹0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Paid Amount:</span>
              <span class="paid-amount-display">₹0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>To Be Paid:</span>
              <span class="to-be-paid-display">₹0.00</span>
            </div>
          </div>
          <div class="numpad">
            <button class="numpad-btn" data-value="1">1</button>
            <button class="numpad-btn" data-value="2">2</button>
            <button class="numpad-btn" data-value="3">3</button>
            <button class="numpad-btn" data-value="4">4</button>
            <button class="numpad-btn" data-value="5">5</button>
            <button class="numpad-btn" data-value="6">6</button>
            <button class="numpad-btn" data-value="7">7</button>
            <button class="numpad-btn" data-value="8">8</button>
            <button class="numpad-btn" data-value="9">9</button>
            <button class="numpad-btn" data-value="0">0</button>
            <button class="numpad-btn" data-value=".">.</button>
            <button class="numpad-btn" data-value="C">C</button>
          </div>
          <button class="process-payment-btn">Pay</button>
          <button class="close-payment-modal-btn">Close</button>
        </div>
      </div>
    </div>
  `).appendTo('body');

  let currentInput = null;
  payment_modal.find('.cash-amount, .credit-card-amount, .mobile-amount').on('focus', function () {
    currentInput = $(this);
  });
  payment_modal.find('.cash-amount, .credit-card-amount, .mobile-amount').on('input', function () {
    recalcPaymentTotals();
  });
  payment_modal.find('.numpad-btn').on('click', function () {
    const val = $(this).data('value');
    if (!currentInput) currentInput = payment_modal.find('.cash-amount');
    if (val === 'C') {
      currentInput.val('');
    } else {
      currentInput.val(currentInput.val() + val);
    }
    recalcPaymentTotals();
  });

  function recalcPaymentTotals() {
    const grandTotal = parseFloat($('.grand-total').text()) || 0;
    const cashAmt = parseFloat(payment_modal.find('.cash-amount').val()) || 0;
    const ccAmt = parseFloat(payment_modal.find('.credit-card-amount').val()) || 0;
    const mobileAmt = parseFloat(payment_modal.find('.mobile-amount').val()) || 0;
    const paidAmount = cashAmt + ccAmt + mobileAmt;
    const toBePaid = grandTotal - paidAmount;
    payment_modal.find('.paid-amount-display').text("₹" + paidAmount.toFixed(2));
    payment_modal.find('.to-be-paid-display').text("₹" + (toBePaid < 0 ? 0 : toBePaid).toFixed(2));
  }

  $('.checkout-btn').on('click', async function () {
    const grandTotal = parseFloat($('.grand-total').text());
    if (grandTotal <= 0) {
      frappe.msgprint("Your cart is empty. Please add items to proceed.");
      return;
    }
    let selected_company = await getStorage("selected_company");
    let selected_pos_profile = await getStorage("selected_pos_profile");
    if (!selected_company || !selected_pos_profile) {
      frappe.msgprint("Please select a Company and POS Profile before checkout.");
      return;
    }
    payment_modal.find('.grand-total-display').text("₹" + grandTotal.toFixed(2));
    payment_modal.find('.paid-amount-display').text("₹0.00");
    payment_modal.find('.to-be-paid-display').text("₹" + grandTotal.toFixed(2));
    payment_modal.find('.cash-amount').val('');
    payment_modal.find('.credit-card-amount').val('');
    payment_modal.find('.mobile-amount').val('');
    payment_modal.show();
  });

  payment_modal.find('.process-payment-btn').on('click', function () {
    const grandTotal = parseFloat($('.grand-total').text()) || 0;
    const cashAmt = parseFloat(payment_modal.find('.cash-amount').val()) || 0;
    const ccAmt = parseFloat(payment_modal.find('.credit-card-amount').val()) || 0;
    const mobileAmt = parseFloat(payment_modal.find('.mobile-amount').val()) || 0;
    const totalPaid = cashAmt + ccAmt + mobileAmt;
    if (totalPaid < grandTotal) {
      frappe.msgprint("Paid amount is less than Grand Total!");
      return;
    }
    let paymentEntries = [];
    if (cashAmt > 0) paymentEntries.push({ mode_of_payment: "Cash", amount: cashAmt });
    if (ccAmt > 0) paymentEntries.push({ mode_of_payment: "Credit Card", amount: ccAmt });
    if (mobileAmt > 0) paymentEntries.push({ mode_of_payment: "Mobile Payment", amount: mobileAmt });
    
    (async function(){
      let selected_company = await getStorage("selected_company");
      let selected_pos_profile = await getStorage("selected_pos_profile");
      if (!selected_company || !selected_pos_profile) {
        frappe.msgprint("Please select a Company and POS Profile before processing payment.");
        return;
      }
      
      let taxation = await getStorage("pos_profile_taxation") || "{}"; 
      
      let invoicePayload = {
        cart: JSON.stringify(cart),
        customer: selected_customer,
        pos_profile: selected_pos_profile,
        payments: JSON.stringify(paymentEntries),
        taxes_and_charges: taxation
      };
      
      // Offline branch after payment processing:
if (!navigator.onLine) {
    await storeOfflineInvoice(invoicePayload);
    await offlineReduceStock(cart);
    frappe.msgprint("No internet connection. Invoice stored offline and stock updated locally. It will be synced when connection is restored.");
    
    // Compute offline totals
	let temp_invoice_id = "OFF-" + new Date().getTime();
	invoicePayload.temp_id = temp_invoice_id;

    let taxation = await getStorage("pos_profile_taxation") || "{}";
    let taxData = {};
    try {
       taxData = JSON.parse(taxation);
    } catch (e) {
       taxData = { rules: [] };
    }
    let taxRules = taxData.rules || [];
    let taxResult = calculateClientSideTaxes(cart, taxRules);
    
    // Show order completion modal with offline data
    showOrderCompletionModal({
         invoice_id: temp_invoice_id,
         customer_name: selected_customer,
         items: cart,
         net_total: taxResult.net_total,
         total_taxes_and_charges: taxResult.total_taxes_and_charges,
         grand_total: taxResult.grand_total,
         payments: paymentEntries
    });
    
    // Save the computed offline invoice data for printing:
    window.offline_invoice_data = {
         invoice_id: temp_invoice_id,
         customer_name: selected_customer,
         items: cart,
         net_total: taxResult.net_total,
         total_taxes_and_charges: taxResult.total_taxes_and_charges,
         grand_total: taxResult.grand_total,
         payments: paymentEntries
    };
    
    cart = [];
    update_cart();
    payment_modal.hide();
    return;
}

      
      frappe.call({
        method: 'whrt_whitelabel.api.create_invoice',
        args: invoicePayload,
        callback: function (invoice_response) {
          if (invoice_response.message && invoice_response.message.invoice_id) {
            payment_modal.hide();
            const invoice_data = invoice_response.message;
            invoice_id = invoice_data.invoice_id;
            showOrderCompletionModal({
              invoice_id: invoice_data.invoice_id,
              customer_name: invoice_data.customer_name,
              items: invoice_data.items,
              net_total: invoice_data.net_total,
              total_taxes_and_charges: invoice_data.total_taxes_and_charges,
              grand_total: invoice_data.grand_total,
              payments: invoice_data.payments
            });
            cart.forEach(function(item){
              if (item.name && item.quantity) {
                frappe.call({
                  method: 'whrt_whitelabel.api.reduce_stock',
                  args: { item_code: item.name, quantity: item.quantity },
                  callback: function(res) {
                    console.log("Reduced stock for", item.name, res.message);
                  }
                });
              } else {
                console.error("Invalid item in cart:", item);
              }
            });
            cart = [];
            update_cart();
            fetchStockData();
          } else {
            frappe.msgprint("Invoice creation failed. Please check logs.");
          }
        },
        error: async function (err) {
          frappe.msgprint("Server error. Attempting offline invoice storage.");
          await storeOfflineInvoice(invoicePayload);
          cart = [];
          update_cart();
          payment_modal.hide();
        }
      });
    })();
  });

  payment_modal.find('.close-payment-modal-btn').on('click', function () {
    payment_modal.hide();
  });

  const order_completion_modal = $(`
    <div class="order-completion-modal">
      <div class="invoice-summary">
        <h3 class="customer-name"></h3>
        <div class="invoice-id"></div>
        <div class="items-section"></div>
        <div class="totals-section"></div>
        <div class="payments-section"></div>
      </div>
      <div>
        <button class="print-receipt-btn">Print Receipt</button>
        <button class="email-receipt-btn">Email Receipt</button>
        <button class="new-order-btn">New Order</button>
      </div>
    </div>
  `).appendTo('body');

  function showOrderCompletionModal(data) {
    order_completion_modal.find('.customer-name').text(data.customer_name || "Walk-in-Customer");
    order_completion_modal.find('.invoice-id').text(data.invoice_id ? `Invoice: ${data.invoice_id}` : "");
    let items_html = "";
	if (data.items && data.items.length) {
    // Currently something like:
    // data.items.forEach(item => {
    //   let line_total = (item.rate || 0) * (item.actual_qty || 1);
    //   ...
    // });

    // Remove the above lines and replace with the new snippet:
    data.items.forEach(item => {
      const qty = item.quantity || 0;
      const rate = item.valuation_rate || 0;
      const line_total = qty * rate;
      const itemLabel = item.item_name || item.name;
      items_html += `
        <div style="display: flex; justify-content: space-between;">
          <span>${itemLabel} (${qty} Nos)</span>
          <span>₹${line_total.toFixed(2)}</span>
        </div>
      `;
    });
  }

  order_completion_modal.find('.items-section').html(items_html);
    let totals_html = `
      <div style="display: flex; justify-content: space-between;">
        <span>Net Total</span>
        <span>₹${(data.net_total || 0).toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Total Taxes</span>
        <span>₹${(data.total_taxes_and_charges || 0).toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px;">
        <span>Grand Total</span>
        <span>₹${(data.grand_total || 0).toLocaleString()}</span>
      </div>
    `;
    order_completion_modal.find('.totals-section').html(totals_html);
    let payments_html = "";
    if (data.payments && data.payments.length) {
      data.payments.forEach(pay => {
        payments_html += `
          <div style="display: flex; justify-content: space-between;">
            <span>${pay.mode_of_payment}</span>
            <span>₹${(pay.amount).toLocaleString()}</span>
          </div>
        `;
      });
    }
    order_completion_modal.find('.payments-section').html(payments_html);
    order_completion_modal.show();
  }
  // New print_receipt function
function print_receipt() {
  if (!invoice_id) {
    frappe.msgprint("No invoice found.");
    return;
  }
  const doctype = "POS Invoice";
  const print_format = "POS Invoice"; // Use the ERPNext format
  const letter_head = "null"; // Or adjust as needed
  const language = frappe.boot.lang || "en";
  
  frappe.utils.print(doctype, invoice_id, print_format, letter_head, language);
  console.debug("Print function called for invoice:", invoice_id);
}
function print_offline_receipt(data) {
    // Build a simple HTML receipt
    let html = `<html>
      <head>
        <title>Offline Invoice Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h3 { text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          table, th, td { border: 1px solid #ddd; }
          th, td { padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <h3>Offline Invoice Receipt</h3>
        <p><strong>Invoice:</strong> Offline Invoice</p>
        <p><strong>Customer:</strong> ${data.customer_name}</p>
        <h4>Items</h4>
        <table>
          <tr>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>`;
    
    data.items.forEach(item => {
        const total = (item.quantity * item.valuation_rate).toFixed(2);
        html += `<tr>
                   <td>${item.item_name}</td>
                   <td>${item.quantity}</td>
                   <td>${item.valuation_rate}</td>
                   <td>${total}</td>
                 </tr>`;
    });
    
    html += `</table>
        <h4>Totals</h4>
        <p><strong>Net Total:</strong> ${data.net_total}</p>
        <p><strong>Total Taxes:</strong> ${data.total_taxes_and_charges}</p>
        <p><strong>Grand Total:</strong> ${data.grand_total}</p>
        <h4>Payments</h4>
        <ul>`;
    
    data.payments.forEach(payment => {
        html += `<li>${payment.mode_of_payment}: ${payment.amount}</li>`;
    });
    
    html += `</ul>
      </body>
      </html>`;
    
    // Open a new window and write the HTML
    let printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}



 order_completion_modal.find('.print-receipt-btn').on('click', function () {
    if (!navigator.onLine) {
  // offline
  if (window.offline_invoice_data) {
    print_offline_receipt(window.offline_invoice_data);
  } else {
    frappe.msgprint("Offline invoice data not available.");
  }
} else {
  // online
  if (!invoice_id) {
    frappe.msgprint("No invoice found.");
    return;
  }
  print_receipt();
}

});



  order_completion_modal.find('.email-receipt-btn').on('click', function () {
    if (!invoice_id) {
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
        frappe.msgprint("An error occurred while emailing the invoice. Please check your network connection.");
      }
    });
  });

  order_completion_modal.find('.new-order-btn').on('click', function () {
    order_completion_modal.hide();
    selected_customer = null;
    cart = [];
    update_cart();
  });

  customer_search_bar.find('.customer-search-input').on('input', async function () {
    const search_term = $(this).val().trim().toLowerCase();
    if (navigator.onLine) {
      try {
        let response = await frappe.call({
          method: 'whrt_whitelabel.api.search_customers',
          args: { search_term: search_term }
        });
        if (response.message) {
          const customers = response.message;
          await setStorage("customers", JSON.stringify(customers));
          let storedOffline = await getStorage("customers");
          let combined = customers;
          if (storedOffline) {
            combined = combined.concat(JSON.parse(storedOffline));
          }
          showCustomerDropdown(combined);
          return;
        }
      } catch (error) {
        console.error("Online customer search failed:", error);
      }
    }
    let storedCustomers = await getStorage("customers");
    let storedOffline = await getStorage("customers");
    let combined = [];
    if (storedCustomers) combined = combined.concat(JSON.parse(storedCustomers));
    if (storedOffline) combined = combined.concat(JSON.parse(storedOffline));
    let filtered = combined.filter(cust => {
      let combinedStr = (cust.customer_name + " " + (cust.mobile_no || "")).toLowerCase();
      return combinedStr.includes(search_term);
    });
    if (filtered.length > 0) {
      showCustomerDropdown(filtered);
    } else {
      frappe.msgprint("No matching offline customer data found.");
    }
  });

  function showCustomerDropdown(customers) {
    const customer_dropdown = $('<div class="customer-dropdown"></div>').css({
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
    customer_search_bar.append(customer_dropdown);
  }

  async function addCustomerOffline(customer_name, mobile_no) {
    try {
      let storedOffline = await getStorage("customers");
      let offlineArr = storedOffline ? JSON.parse(storedOffline) : [];
      let newCustomer = {
        name: "local_" + Date.now(),
        customer_name: customer_name,
        mobile_no: mobile_no,
        synced: false
      };
      offlineArr.push(newCustomer);
      await setStorage("customers", JSON.stringify(offlineArr));
      frappe.msgprint("Customer added offline successfully!");
      selected_customer = newCustomer.customer_name;
      customer_search_bar.find('.customer-search-input').val(newCustomer.customer_name);
    } catch (error) {
      frappe.msgprint("Error storing offline customer: " + error);
      console.error("Error storing offline customer:", error);
    }
  }

  customer_search_bar.find('.add-customer-btn').on('click', function () {
    const customer_name = customer_search_bar.find('.customer-search-input').val().trim();
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
        description: 'Enter the customer mobile number.'
      }
    ], async function (values) {
      if (navigator.onLine) {
        try {
          let response = await frappe.call({
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
            }
          });
          if (response.message) {
            frappe.msgprint("Customer added successfully!");
            selected_customer = response.message.name;
          }
        } catch (error) {
          frappe.msgprint("Error adding customer: " + error);
          console.error("Error adding customer:", error);
        }
      } else {
        addCustomerOffline(customer_name, values.mobile_no);
      }
    });
  });

  setInterval(() => {
    if (navigator.onLine) {
      syncOfflineInvoices();
    }
  }, 30000);

};
